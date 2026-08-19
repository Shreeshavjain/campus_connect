/**
 * GET /api/dashboard
 *
 * Aggregates a lightweight dashboard payload for the currently
 * authenticated user.
 */

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import Request from "@/models/Request";
import Conversation from "@/models/Conversation";
import { rankRecommendedStudents, type RecommendationProfile } from "@/lib/dashboard/recommendation";
import type { ApiResponse, DashboardData, DashboardRecentRequest, DashboardStudent } from "@/types";

type RequestAggregateSummary = {
  connections: number;
  incomingPendingRequests: number;
  connectedCounterparts: mongoose.Types.ObjectId[];
  pendingCounterparts: mongoose.Types.ObjectId[];
};

function normalizeAggregateSummary(value?: Partial<RequestAggregateSummary>): RequestAggregateSummary {
  return {
    connections: value?.connections ?? 0,
    incomingPendingRequests: value?.incomingPendingRequests ?? 0,
    connectedCounterparts: (value?.connectedCounterparts ?? []).filter(Boolean),
    pendingCounterparts: (value?.pendingCounterparts ?? []).filter(Boolean),
  };
}

async function getRequestSummary(userObjectId: mongoose.Types.ObjectId): Promise<RequestAggregateSummary> {
  const [summary] = await Request.aggregate<{
    connections: number;
    incomingPendingRequests: number;
    connectedCounterparts: mongoose.Types.ObjectId[];
    pendingCounterparts: mongoose.Types.ObjectId[];
  }>([
    {
      $match: {
        $or: [{ fromUser: userObjectId }, { toUser: userObjectId }],
      },
    },
    {
      $project: {
        status: 1,
        isIncoming: { $eq: ["$toUser", userObjectId] },
        counterpart: {
          $cond: [{ $eq: ["$fromUser", userObjectId] }, "$toUser", "$fromUser"],
        },
      },
    },
    {
      $group: {
        _id: null,
        connections: {
          $sum: {
            $cond: [{ $in: ["$status", ["accepted", "completed"]] }, 1, 0],
          },
        },
        incomingPendingRequests: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$status", "pending"] }, "$isIncoming"] }, 1, 0],
          },
        },
        connectedCounterparts: {
          $addToSet: {
            $cond: [{ $in: ["$status", ["accepted", "completed"]] }, "$counterpart", null],
          },
        },
        pendingCounterparts: {
          $addToSet: {
            $cond: [{ $eq: ["$status", "pending"] }, "$counterpart", null],
          },
        },
      },
    },
  ]);

  return normalizeAggregateSummary(summary);
}

function toStudentResponse(students: ReturnType<typeof rankRecommendedStudents>): DashboardStudent[] {
  return students.map((student) => ({
    id: student.id,
    name: student.name,
    campus: student.campus,
    branch: student.branch,
    year: student.year,
    commonSkills: student.commonSkills,
    commonInterests: student.commonInterests,
  }));
}

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

    const currentUser = await User.findById(userObjectId)
      .select("name campus branch year skills interests")
      .lean<RecommendationProfile | null>();

    if (!currentUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User account not found." },
        { status: 401 }
      );
    }

    // Run dashboard aggregations in parallel
    const [requestSummary, recentRequestDocs, unreadAgg] = await Promise.all([
      getRequestSummary(userObjectId),
      Request.find({
        $or: [{ fromUser: userObjectId }, { toUser: userObjectId }],
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fromUser toUser type title status message createdAt")
        .populate({ path: "fromUser", select: "name campus branch year" })
        .populate({ path: "toUser", select: "name campus branch year" })
        .lean(),
      Conversation.aggregate([
        { $match: { "participants.user": userObjectId } },
        { $unwind: "$participants" },
        { $match: { "participants.user": userObjectId } },
        { $group: { _id: null, totalUnread: { $sum: "$participants.unreadCount" } } }
      ])
    ]);

    const totalUnread = unreadAgg[0]?.totalUnread || 0;

    const excluded = new Set<string>([
      userObjectId.toString(),
      ...requestSummary.connectedCounterparts.map((id) => id.toString()),
      ...requestSummary.pendingCounterparts.map((id) => id.toString()),
    ]);

    const excludedIds = Array.from(excluded).map((id) => new mongoose.Types.ObjectId(id));

    // Improved Recommendation Query: Prefilter by shared traits to get better candidates
    let candidateUsers = await User.find({
      _id: { $nin: excludedIds },
      $or: [
        { campus: currentUser.campus ?? undefined },
        { skills: { $in: currentUser.skills ?? [] } },
        { interests: { $in: currentUser.interests ?? [] } },
      ],
    })
      .select("name campus branch year skills interests")
      .limit(100)
      .lean<RecommendationProfile[]>();

    // Fallback if no candidates share traits (or user has no traits)
    if (candidateUsers.length === 0) {
      candidateUsers = await User.find({
        _id: { $nin: excludedIds },
      })
        .select("name campus branch year skills interests")
        .limit(100)
        .lean<RecommendationProfile[]>();
    }

    const rankedStudents = rankRecommendedStudents({
      currentUser,
      candidates: candidateUsers,
      limit: 4,
    });

    const recentRequests: DashboardRecentRequest[] = recentRequestDocs.map((doc) => {
      const fromUser = doc.fromUser as unknown as { _id: mongoose.Types.ObjectId; name: string; campus?: string; branch?: string; year?: number };
      const toUser = doc.toUser as unknown as { _id: mongoose.Types.ObjectId; name: string; campus?: string; branch?: string; year?: number };

      const isSent = fromUser._id.toString() === userObjectId.toString();
      const counterpart = isSent ? toUser : fromUser;

      return {
        id: doc._id.toString(),
        type: doc.type,
        title: doc.title,
        status: doc.status,
        createdAt: doc.createdAt,
        direction: isSent ? "sent" : "received",
        message: doc.message ?? undefined,
        counterpart: {
          id: counterpart._id.toString(),
          name: counterpart.name,
          campus: counterpart.campus,
          branch: counterpart.branch,
          year: counterpart.year,
        },
      };
    });

    const response: DashboardData = {
      stats: {
        connections: requestSummary.connections,
        incomingPendingRequests: requestSummary.incomingPendingRequests,
        unreadMessages: totalUnread,
      },
      students: toStudentResponse(rankedStudents),
      recentRequests,
      collaborations: {
        supported: false,
        active: [],
      },
      notifications: {
        supported: false,
        unreadCount: 0,
      },
      capabilities: {
        requests: true,
        unreadMessages: true,
        notifications: false,
        collaborations: false,
      },
    };

    return NextResponse.json<ApiResponse<DashboardData>>(
      {
        success: true,
        message: "Dashboard data fetched successfully.",
        data: response,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
