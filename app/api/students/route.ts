import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import {
  rankRecommendedStudents,
  scoreStudentCandidate,
  type RecommendationProfile,
} from "@/lib/dashboard/recommendation";
import {
  getUserRelationshipIndex,
  type CounterpartRelationship,
} from "@/lib/students/relationships";
import type {
  ApiResponse,
  DiscoveryStudent,
  StudentDiscoveryData,
  StudentDiscoveryFilter,
} from "@/types";

const QuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  filter: z
    .enum(["for_you", "same_class", "same_clubs", "skills", "all"])
    .default("for_you"),
  skill: z.string().trim().max(40).default(""),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

const PUBLIC_STUDENT_FIELDS = "name campus branch year bio skills interests";
const MAX_RANKED_POOL = 200;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchCondition(q: string): Record<string, unknown> | null {
  if (!q) return null;
  const regex = new RegExp(escapeRegex(q), "i");
  return {
    $or: [
      { name: regex },
      { branch: regex },
      { campus: regex },
      { skills: regex },
      { interests: regex },
      { bio: regex },
    ],
  };
}

function toDiscoveryStudent(
  scored: ReturnType<typeof scoreStudentCandidate>,
  rel?: CounterpartRelationship
): DiscoveryStudent {
  return {
    id: scored.id,
    name: scored.name,
    campus: scored.campus,
    branch: scored.branch,
    year: scored.year,
    bio: scored.bio,
    skills: scored.skills,
    interests: scored.interests,
    commonSkills: scored.commonSkills,
    commonInterests: scored.commonInterests,
    reasons: scored.reasons,
    score: scored.score,
    connectionStatus: rel?.status ?? "none",
    pendingRequestId: rel?.pendingRequestId,
    conversationId: rel?.conversationId,
  };
}

async function getRecommendations(
  currentUser: RecommendationProfile,
  excludedIds: mongoose.Types.ObjectId[],
  limit: number
): Promise<DiscoveryStudent[]> {
  const traitClauses: Record<string, unknown>[] = [];
  if (currentUser.branch?.trim()) {
    traitClauses.push({
      branch: new RegExp(`^${escapeRegex(currentUser.branch.trim())}$`, "i"),
    });
  }
  if (currentUser.year) {
    traitClauses.push({ year: currentUser.year });
  }
  if (currentUser.skills?.length) {
    traitClauses.push({ skills: { $in: currentUser.skills } });
  }
  if (currentUser.interests?.length) {
    traitClauses.push({ interests: { $in: currentUser.interests } });
  }
  if (currentUser.campus?.trim()) {
    traitClauses.push({
      campus: new RegExp(`^${escapeRegex(currentUser.campus.trim())}$`, "i"),
    });
  }

  let candidates: RecommendationProfile[] = [];
  if (traitClauses.length > 0) {
    candidates = await User.find({
      _id: { $nin: excludedIds },
      $or: traitClauses,
    })
      .select(PUBLIC_STUDENT_FIELDS)
      .limit(MAX_RANKED_POOL)
      .lean<RecommendationProfile[]>();
  }

  if (candidates.length < limit) {
    const existingIds = new Set(candidates.map((c) => c._id.toString()));
    const fallbackExclude = [
      ...excludedIds,
      ...candidates.map((c) => c._id),
    ];
    const extra = await User.find({ _id: { $nin: fallbackExclude } })
      .select(PUBLIC_STUDENT_FIELDS)
      .limit(MAX_RANKED_POOL - existingIds.size)
      .lean<RecommendationProfile[]>();
    candidates = [...candidates, ...extra];
  }

  const ranked = rankRecommendedStudents({
    currentUser,
    candidates,
    limit,
  });

  return ranked.map((item) => toDiscoveryStudent(item));
}

export async function GET(request: Request) {
  try {
    const tokenPayload = await getAuthUser();
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      q: searchParams.get("q") ?? "",
      filter: searchParams.get("filter") ?? "for_you",
      skill: searchParams.get("skill") ?? "",
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 12,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid query parameters.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { q, filter, skill, page, limit } = parsed.data;

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(tokenPayload.userId);
    const currentUser = await User.findById(userObjectId)
      .select(PUBLIC_STUDENT_FIELDS)
      .lean<RecommendationProfile | null>();

    if (!currentUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User account not found." },
        { status: 401 }
      );
    }

    const [relationshipIndex, skillAgg] = await Promise.all([
      getUserRelationshipIndex(userObjectId),
      User.aggregate<{ _id: string; label: string; count: number }>([
        {
          $match: {
            _id: { $ne: userObjectId },
            skills: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$skills" },
        {
          $group: {
            _id: { $toLower: "$skills" },
            label: { $first: "$skills" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, label: 1 } },
        { $limit: 16 },
      ]),
    ]);

    const excludedIds = Array.from(
      relationshipIndex.excludedFromRecommendations
    ).map((id) => new mongoose.Types.ObjectId(id));

    const recommendations =
      page === 1
        ? await getRecommendations(currentUser, excludedIds, 6)
        : [];

    let students: DiscoveryStudent[] = [];
    let total = 0;

    const searchCondition = buildSearchCondition(q);
    const typedFilter: StudentDiscoveryFilter = filter;

    if (typedFilter === "same_clubs") {
      // Club membership is not implemented on User or in a Club model yet.
      students = [];
      total = 0;
    } else if (typedFilter === "for_you") {
      const query: Record<string, unknown> = { _id: { $nin: excludedIds } };
      if (searchCondition) Object.assign(query, searchCondition);

      const pool = await User.find(query)
        .select(PUBLIC_STUDENT_FIELDS)
        .limit(MAX_RANKED_POOL)
        .lean<RecommendationProfile[]>();

      const ranked = rankRecommendedStudents({ currentUser, candidates: pool });
      total = ranked.length;
      const offset = (page - 1) * limit;
      students = ranked
        .slice(offset, offset + limit)
        .map((item) =>
          toDiscoveryStudent(
            item,
            relationshipIndex.byCounterpartId.get(item.id)
          )
        );
    } else if (typedFilter === "same_class") {
      const hasBranch = Boolean(currentUser.branch?.trim());
      const hasYear = Boolean(currentUser.year);

      if (hasBranch || hasYear) {
        const clauses: Record<string, unknown>[] = [{ _id: { $ne: userObjectId } }];
        if (hasBranch && currentUser.branch) {
          clauses.push({
            branch: new RegExp(`^${escapeRegex(currentUser.branch.trim())}$`, "i"),
          });
        }
        if (hasYear && currentUser.year) {
          clauses.push({ year: currentUser.year });
        }
        if (searchCondition) clauses.push(searchCondition);

        const pool = await User.find({ $and: clauses })
          .select(PUBLIC_STUDENT_FIELDS)
          .limit(MAX_RANKED_POOL)
          .lean<RecommendationProfile[]>();

        const ranked = rankRecommendedStudents({ currentUser, candidates: pool });
        total = ranked.length;
        const offset = (page - 1) * limit;
        students = ranked
          .slice(offset, offset + limit)
          .map((item) =>
            toDiscoveryStudent(
              item,
              relationshipIndex.byCounterpartId.get(item.id)
            )
          );
      }
    } else if (typedFilter === "skills") {
      const clauses: Record<string, unknown>[] = [{ _id: { $ne: userObjectId } }];
      if (skill) {
        clauses.push({
          skills: new RegExp(`^${escapeRegex(skill)}$`, "i"),
        });
      } else {
        clauses.push({ skills: { $exists: true, $not: { $size: 0 } } });
      }
      if (searchCondition) clauses.push(searchCondition);

      const pool = await User.find({ $and: clauses })
        .select(PUBLIC_STUDENT_FIELDS)
        .limit(MAX_RANKED_POOL)
        .lean<RecommendationProfile[]>();

      const ranked = rankRecommendedStudents({ currentUser, candidates: pool });
      total = ranked.length;
      const offset = (page - 1) * limit;
      students = ranked
        .slice(offset, offset + limit)
        .map((item) =>
          toDiscoveryStudent(
            item,
            relationshipIndex.byCounterpartId.get(item.id)
          )
        );
    } else {
      // "all": deterministic alphabetical pagination across the directory
      const query: Record<string, unknown> = { _id: { $ne: userObjectId } };
      if (searchCondition) Object.assign(query, searchCondition);

      const [count, docs] = await Promise.all([
        User.countDocuments(query),
        User.find(query)
          .select(PUBLIC_STUDENT_FIELDS)
          .sort({ name: 1, _id: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean<RecommendationProfile[]>(),
      ]);

      total = count;
      students = docs.map((doc) =>
        toDiscoveryStudent(
          scoreStudentCandidate(currentUser, doc),
          relationshipIndex.byCounterpartId.get(doc._id.toString())
        )
      );
    }

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const payload: StudentDiscoveryData = {
      recommendations,
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        availableSkills: skillAgg.map((s) => s.label).filter(Boolean),
        currentUserContext: {
          campus: currentUser.campus ?? "",
          branch: currentUser.branch ?? "",
          year: currentUser.year ?? null,
          skillsCount: currentUser.skills?.length ?? 0,
          interestsCount: currentUser.interests?.length ?? 0,
        },
      },
      capabilities: {
        clubs: false,
        section: false,
      },
    };

    return NextResponse.json<ApiResponse<StudentDiscoveryData>>(
      {
        success: true,
        message: "Students fetched successfully.",
        data: payload,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/students]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
