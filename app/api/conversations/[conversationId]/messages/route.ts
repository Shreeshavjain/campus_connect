import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import type { ApiResponse } from "@/types";

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);
    const convObjectId = new mongoose.Types.ObjectId(conversationId);

    // Verify participation
    const conversation = await Conversation.findOne({
      _id: convObjectId,
      "participants.user": userObjectId,
    }).lean();

    if (!conversation) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Conversation not found or unauthorized." },
        { status: 404 }
      );
    }

    // Build cursor query
    const query: Record<string, unknown> = { conversationId: convObjectId };
    if (cursor && !isNaN(Date.parse(cursor))) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Side effect: Mark as read
    await Conversation.updateOne(
      { _id: convObjectId, "participants.user": userObjectId },
      {
        $set: {
          "participants.$.unreadCount": 0,
          "participants.$.lastReadAt": new Date(),
        },
      }
    );

    // The messages array is sorted newest first due to cursor pagination,
    // reverse it to get oldest-to-newest ordering suitable for rendering a chat
    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.sender.toString(),
      content: msg.content,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json<ApiResponse<{ id: string, senderId: string, content: string, createdAt: Date }[]>>(
      {
        success: true,
        message: "Messages fetched successfully.",
        data: formattedMessages,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/conversations/[id]/messages]", err);
    return NextResponse.json<ApiResponse>({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function POST(
  request: globalThis.Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const tokenPayload = await getAuthUser();
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    let body: { content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>({ success: false, message: "Invalid JSON." }, { status: 400 });
    }

    if (!body || !body.content || typeof body.content !== "string" || body.content.trim().length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Message content is required." }, { status: 400 });
    }
    const content = body.content.trim().substring(0, 2000);

    const { conversationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Invalid conversation ID." }, { status: 400 });
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);
    const convObjectId = new mongoose.Types.ObjectId(conversationId);

    // Verify participation
    const conversation = await Conversation.findOne({
      _id: convObjectId,
      "participants.user": userObjectId,
    });

    if (!conversation) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Conversation not found or unauthorized." },
        { status: 404 }
      );
    }

    // Create Message
    const message = await Message.create({
      conversationId: convObjectId,
      sender: userObjectId,
      content,
    });

    // Update Conversation metadata and counterpart unreadCount
    const preview = content.length > 100 ? content.substring(0, 97) + "..." : content;
    
    // Find counterpart ID to increment unread count for them
    const counterpartInfo = conversation.participants.find(p => p.user.toString() !== userObjectId.toString());

    await Conversation.updateOne(
      { _id: convObjectId, "participants.user": counterpartInfo?.user },
      {
        $set: {
          lastMessageAt: message.createdAt,
          lastMessagePreview: preview,
        },
        $inc: {
          "participants.$.unreadCount": 1,
        },
      }
    );

    return NextResponse.json<ApiResponse<{ id: string, senderId: string, content: string, createdAt: Date }>>(
      {
        success: true,
        message: "Message sent successfully.",
        data: {
          id: message._id.toString(),
          senderId: message.sender.toString(),
          content: message.content,
          createdAt: message.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/conversations/[id]/messages]", err);
    return NextResponse.json<ApiResponse>({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}
