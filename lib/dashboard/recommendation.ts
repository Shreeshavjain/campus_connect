import type { Types } from "mongoose";

export interface RecommendationProfile {
  _id: Types.ObjectId;
  name: string;
  campus?: string | null;
  branch?: string | null;
  year?: number | null;
  skills?: string[];
  interests?: string[];
}

export interface RecommendationResult {
  id: string;
  name: string;
  campus?: string;
  branch?: string;
  year?: number;
  commonSkills: string[];
  commonInterests: string[];
  score: number;
}

interface RecommendationOptions {
  currentUser: RecommendationProfile;
  candidates: RecommendationProfile[];
  limit: number;
}

function normalizeSet(values?: string[]): Set<string> {
  return new Set((values ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean));
}

function intersection(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = [];
  for (const value of a) {
    if (b.has(value)) {
      shared.push(value);
    }
  }
  return shared;
}

export function rankRecommendedStudents(options: RecommendationOptions): RecommendationResult[] {
  const { currentUser, candidates, limit } = options;

  const userSkills = normalizeSet(currentUser.skills);
  const userInterests = normalizeSet(currentUser.interests);

  const ranked = candidates.map((candidate) => {
    const candidateSkills = normalizeSet(candidate.skills);
    const candidateInterests = normalizeSet(candidate.interests);

    const commonSkills = intersection(userSkills, candidateSkills);
    const commonInterests = intersection(userInterests, candidateInterests);

    let score = 0;

    // Shared skill overlap is weighted highest for initial relevance.
    score += commonSkills.length * 4;
    score += commonInterests.length * 3;

    if (
      currentUser.campus &&
      candidate.campus &&
      currentUser.campus.toLowerCase() === candidate.campus.toLowerCase()
    ) {
      score += 2;
    }

    if (
      currentUser.branch &&
      candidate.branch &&
      currentUser.branch.toLowerCase() === candidate.branch.toLowerCase()
    ) {
      score += 1;
    }

    if (currentUser.year && candidate.year && currentUser.year === candidate.year) {
      score += 1;
    }

    return {
      id: candidate._id.toString(),
      name: candidate.name,
      campus: candidate.campus ?? undefined,
      branch: candidate.branch ?? undefined,
      year: candidate.year ?? undefined,
      commonSkills,
      commonInterests,
      score,
    };
  });

  return ranked
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
