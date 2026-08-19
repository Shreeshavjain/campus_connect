import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import type { ApiResponse } from "@/types";

export async function PATCH(
  request: globalThis.Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const tokenPayload = await getAuthUser();
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const { conversationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Invalid conversation ID." }, { status: 400 });
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);
    const convObjectId = new mongoose.Types.ObjectId(conversationId);

    // Update unread count for the participant atomically
    const result = await Conversation.updateOne(
      {
        _id: convObjectId,
        "participants.user": userObjectId,
      },
      {
        $set: {
          "participants.$.unreadCount": 0,
          "participants.$.lastReadAt": new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Conversation not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Conversation marked as read." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH /api/conversations/[id]/read]", err);
    return NextResponse.json<ApiResponse>({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}
