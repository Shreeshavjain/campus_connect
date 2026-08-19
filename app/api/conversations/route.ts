import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import type { ApiResponse } from "@/types";

export async function GET() {
  try {
    const tokenPayload = await getAuthUser();

    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);

    const conversations = await Conversation.find({
      "participants.user": userObjectId,
    })
      .sort({ lastMessageAt: -1 })
      .populate({
        path: "requestId",
        select: "title type status",
      })
      .populate({
        path: "participants.user",
        select: "name campus branch year",
      })
      .lean();

    // Map to a frontend-friendly format
    const formattedConversations = conversations.map((conv) => {
      // Find the other participant
      const counterpartParticipant = conv.participants.find(
        (p) => p.user._id.toString() !== userObjectId.toString()
      );
      // Find current user's participant info for unread counts
      const currentUserParticipant = conv.participants.find(
        (p) => p.user._id.toString() === userObjectId.toString()
      );

      const reqPopulated = conv.requestId as unknown as { _id: mongoose.Types.ObjectId; title: string; type: string; status: string };

      const counterpartUser = counterpartParticipant?.user as unknown as { _id: mongoose.Types.ObjectId; name: string; campus?: string; branch?: string; year?: number };

      return {
        id: conv._id.toString(),
        request: {
          id: reqPopulated._id.toString(),
          title: reqPopulated.title,
          type: reqPopulated.type,
          status: reqPopulated.status,
        },
        counterpart: counterpartUser
          ? {
              id: counterpartUser._id.toString(),
              name: counterpartUser.name,
              campus: counterpartUser.campus,
              branch: counterpartUser.branch,
              year: counterpartUser.year,
            }
          : null,
        unreadCount: currentUserParticipant?.unreadCount || 0,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
      };
    });

    return NextResponse.json<ApiResponse<unknown[]>>(
      {
        success: true,
        message: "Conversations fetched successfully.",
        data: formattedConversations,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/conversations]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
