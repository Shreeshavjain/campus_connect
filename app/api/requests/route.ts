import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import RequestModel from "@/models/Request";
import type { ApiResponse, RequestStatus } from "@/types";

const CreateRequestSchema = z
  .object({
    toUserId: z.string().trim().min(1, "Recipient student ID is required."),
    type: z.enum(["FREE", "SKILL_SWAP"]).default("FREE"),
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters.")
      .max(120, "Title must be at most 120 characters.")
      .default("Connect on Campus Connect"),
    message: z
      .string()
      .trim()
      .max(500, "Message must be at most 500 characters.")
      .optional(),
    skills: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    offeredSkills: z
      .array(z.string().trim().min(1).max(40))
      .max(10)
      .optional(),
  })
  .strict();

export async function POST(request: globalThis.Request) {
  try {
    const tokenPayload = await getAuthUser();
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { toUserId, type, title, message, skills, offeredSkills } =
      parsed.data;

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid recipient student ID." },
        { status: 400 }
      );
    }

    if (toUserId === tokenPayload.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "You cannot send a request to yourself." },
        { status: 400 }
      );
    }

    await connectDB();

    const fromUserObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);
    const toUserObjectId = new mongoose.Types.ObjectId(toUserId);

    const targetExists = await User.exists({ _id: toUserObjectId });
    if (!targetExists) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Recipient student not found." },
        { status: 404 }
      );
    }

    // Prevent duplicate pending requests or requests between already-connected users
    const existingActive = await RequestModel.findOne({
      $or: [
        { fromUser: fromUserObjectId, toUser: toUserObjectId },
        { fromUser: toUserObjectId, toUser: fromUserObjectId },
      ],
      status: { $in: ["pending", "accepted", "completed"] },
    })
      .select("fromUser status")
      .lean();

    if (existingActive) {
      if (
        existingActive.status === "accepted" ||
        existingActive.status === "completed"
      ) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "You are already connected with this student.",
          },
          { status: 409 }
        );
      }

      const alreadySentByMe =
        existingActive.fromUser.toString() === tokenPayload.userId;

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: alreadySentByMe
            ? "A connection request is already pending."
            : "This student has already sent you a connection request.",
        },
        { status: 409 }
      );
    }

    const created = await RequestModel.create({
      fromUser: fromUserObjectId,
      toUser: toUserObjectId,
      type,
      status: "pending",
      title,
      ...(message ? { message } : {}),
      skills: skills ?? [],
      offeredSkills: offeredSkills ?? [],
    });

    return NextResponse.json<
      ApiResponse<{ id: string; status: RequestStatus; toUser: string }>
    >(
      {
        success: true,
        message: "Connection request sent successfully.",
        data: {
          id: created._id.toString(),
          status: created.status,
          toUser: toUserId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/requests]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
