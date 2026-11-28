import mongoose from "mongoose";
import Request from "@/models/Request";
import type { StudentConnectionStatus } from "@/types";

export interface CounterpartRelationship {
  status: StudentConnectionStatus;
  pendingRequestId?: string;
  conversationId?: string;
}

export interface UserRelationshipIndex {
  byCounterpartId: Map<string, CounterpartRelationship>;
  excludedFromRecommendations: Set<string>;
}

/**
 * Fetches all active (pending, accepted, completed) Request records involving
 * the given user and builds a deterministic lookup map keyed by counterpart userId.
 */
export async function getUserRelationshipIndex(
  userObjectId: mongoose.Types.ObjectId
): Promise<UserRelationshipIndex> {
  const currentUserId = userObjectId.toString();

  const requests = await Request.find({
    $or: [{ fromUser: userObjectId }, { toUser: userObjectId }],
    status: { $in: ["pending", "accepted", "completed"] },
  })
    .select("fromUser toUser status conversationId createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const byCounterpartId = new Map<string, CounterpartRelationship>();
  const excludedFromRecommendations = new Set<string>([currentUserId]);

  for (const req of requests) {
    const isSent = req.fromUser.toString() === currentUserId;
    const counterpartId = isSent
      ? req.toUser.toString()
      : req.fromUser.toString();

    excludedFromRecommendations.add(counterpartId);

    const existing = byCounterpartId.get(counterpartId);
    // "connected" takes precedence over any pending entry if multiple requests coexist
    if (req.status === "accepted" || req.status === "completed") {
      byCounterpartId.set(counterpartId, {
        status: "connected",
        conversationId: req.conversationId?.toString(),
      });
    } else if (req.status === "pending" && !existing) {
      byCounterpartId.set(counterpartId, {
        status: isSent ? "pending_sent" : "pending_received",
        pendingRequestId: req._id.toString(),
      });
    }
  }

  return { byCounterpartId, excludedFromRecommendations };
}
