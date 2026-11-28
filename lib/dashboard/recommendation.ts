import type { Types } from "mongoose";

export interface RecommendationProfile {
  _id: Types.ObjectId;
  name: string;
  campus?: string | null;
  branch?: string | null;
  year?: number | null;
  bio?: string | null;
  skills?: string[];
  interests?: string[];
}

export interface RecommendationResult {
  id: string;
  name: string;
  campus?: string;
  branch?: string;
  year?: number;
  bio?: string;
  skills: string[];
  interests: string[];
  commonSkills: string[];
  commonInterests: string[];
  reasons: string[];
  score: number;
}

interface RecommendationOptions {
  currentUser: RecommendationProfile;
  candidates: RecommendationProfile[];
  limit?: number;
}

function normalizeString(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeMap(values?: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const raw of values ?? []) {
    const trimmed = raw.trim();
    const key = trimmed.toLowerCase();
    if (key && !map.has(key)) {
      map.set(key, trimmed);
    }
  }
  return map;
}

function intersectValues(
  userValues: Map<string, string>,
  candidateValues: Map<string, string>
): string[] {
  const shared: string[] = [];
  for (const [key, display] of candidateValues) {
    if (userValues.has(key)) {
      shared.push(display);
    }
  }
  return shared;
}

/**
 * Deterministically scores and ranks student candidates for a user.
 *
 * Priority order (using fields that exist in User.ts):
 * 1. Academic class similarity: same branch + academic year (+10), or branch (+5), or year (+3).
 *    (Note: `section` and `clubs` do not exist on User yet and are omitted.)
 * 2. Shared skills (+4 each) and shared interests (+3 each).
 * 3. Same campus (+1) as a secondary academic tie-breaker (without inventing social ties).
 */
export function scoreStudentCandidate(
  currentUser: RecommendationProfile,
  candidate: RecommendationProfile
): RecommendationResult {
  const userSkills = normalizeMap(currentUser.skills);
  const userInterests = normalizeMap(currentUser.interests);
  const candidateSkills = normalizeMap(candidate.skills);
  const candidateInterests = normalizeMap(candidate.interests);

  const commonSkills = intersectValues(userSkills, candidateSkills);
  const commonInterests = intersectValues(userInterests, candidateInterests);
  const reasons: string[] = [];

  let score = 0;

  const userBranch = normalizeString(currentUser.branch);
  const candidateBranch = normalizeString(candidate.branch);
  const sameBranch = Boolean(userBranch && candidateBranch && userBranch === candidateBranch);

  const sameYear = Boolean(
    currentUser.year &&
      candidate.year &&
      currentUser.year === candidate.year
  );

  // 1. Academic class similarity (branch + year)
  if (sameBranch && sameYear) {
    score += 10;
    reasons.push("Same branch & year");
  } else if (sameBranch) {
    score += 5;
    reasons.push("Same branch");
  } else if (sameYear) {
    score += 3;
    reasons.push(`Year ${candidate.year} peer`);
  }

  // 2. Shared skills & interests
  if (commonSkills.length > 0) {
    score += commonSkills.length * 4;
    reasons.push(
      commonSkills.length === 1
        ? "1 shared skill"
        : `${commonSkills.length} shared skills`
    );
  }

  if (commonInterests.length > 0) {
    score += commonInterests.length * 3;
    reasons.push(
      commonInterests.length === 1
        ? "1 shared interest"
        : `${commonInterests.length} shared interests`
    );
  }

  // 3. Secondary campus similarity (never fabricated into a social relationship)
  const userCampus = normalizeString(currentUser.campus);
  const candidateCampus = normalizeString(candidate.campus);
  if (userCampus && candidateCampus && userCampus === candidateCampus) {
    score += 1;
  }

  return {
    id: candidate._id.toString(),
    name: candidate.name,
    campus: candidate.campus ?? undefined,
    branch: candidate.branch ?? undefined,
    year: candidate.year ?? undefined,
    bio: candidate.bio ?? undefined,
    skills: Array.from(candidateSkills.values()),
    interests: Array.from(candidateInterests.values()),
    commonSkills,
    commonInterests,
    reasons,
    score,
  };
}

export function rankRecommendedStudents(
  options: RecommendationOptions
): RecommendationResult[] {
  const { currentUser, candidates, limit } = options;

  // Deduplicate candidates by stringified _id
  const seen = new Set<string>();
  const uniqueCandidates: RecommendationProfile[] = [];
  for (const candidate of candidates) {
    const id = candidate._id.toString();
    if (id === currentUser._id.toString() || seen.has(id)) continue;
    seen.add(id);
    uniqueCandidates.push(candidate);
  }

  const ranked = uniqueCandidates
    .map((candidate) => scoreStudentCandidate(currentUser, candidate))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.id.localeCompare(b.id);
    });

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}
