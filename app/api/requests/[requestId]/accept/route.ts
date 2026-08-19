import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Request from "@/models/Request";
import Conversation from "@/models/Conversation";
import type { ApiResponse } from "@/types";

export async function POST(
  request: globalThis.Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  let session: mongoose.mongo.ClientSession | undefined = undefined;
  try {
    const tokenPayload = await getAuthUser();

    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { requestId } = await params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid request ID." },
        { status: 400 }
      );
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);

    // Try starting a session for transactions. If it fails (e.g., standalone DB), we proceed without it.
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      console.warn("Transactions not supported, proceeding without transaction:", e);
      session = undefined; // Fallback
    }

    // 1. Atomically find the pending request and mark it as accepted
    const reqDoc = await Request.findOneAndUpdate(
      {
        _id: requestId,
        toUser: userObjectId, // Only the receiver can accept
        status: "pending", // Optimistic lock
      },
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      },
      { new: true, session }
    );

    if (!reqDoc) {
      if (session) {
        await session.abortTransaction();
        await session.endSession();
      }
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Request not found, already processed, or unauthorized.",
        },
        { status: 404 }
      );
    }

    // 2. Create Conversation
    const conversationData = {
      requestId: reqDoc._id,
      participants: [
        { user: reqDoc.fromUser, lastReadAt: new Date(), unreadCount: 0 },
        { user: reqDoc.toUser, lastReadAt: new Date(), unreadCount: 0 },
      ],
      lastMessageAt: null,
      lastMessagePreview: null,
    };

    let newConversation;
    try {
      if (session) {
        const convs = await Conversation.create([conversationData], { session });
        newConversation = convs[0];
      } else {
        newConversation = await Conversation.create(conversationData);
      }
    } catch (createErr) {
      // If we're not in a transaction, rollback the request status
      if (!session) {
        await Request.updateOne(
          { _id: reqDoc._id },
          { $set: { status: "pending", acceptedAt: null } }
        ).catch(() => {});
      } else {
        await session.abortTransaction();
        await session.endSession();
      }
      throw createErr;
    }

    // 3. Update Request with conversationId
    try {
      await Request.updateOne(
        { _id: reqDoc._id },
        { $set: { conversationId: newConversation._id } },
        { session }
      );
    } catch (updateErr) {
      // Rollback conversation creation if not in transaction
      if (!session) {
        await Conversation.deleteOne({ _id: newConversation._id }).catch(() => {});
        await Request.updateOne(
          { _id: reqDoc._id },
          { $set: { status: "pending", acceptedAt: null } }
        ).catch(() => {});
      } else {
        await session.abortTransaction();
        await session.endSession();
      }
      throw updateErr;
    }

    if (session) {
      await session.commitTransaction();
      await session.endSession();
    }

    return NextResponse.json<ApiResponse<{ conversationId: string }>>(
      {
        success: true,
        message: "Request accepted successfully.",
        data: { conversationId: newConversation._id.toString() },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/requests/[id]/accept]", err);
    if (session) {
      try {
        await session.abortTransaction();
      } catch {}
      await session.endSession();
    }
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
