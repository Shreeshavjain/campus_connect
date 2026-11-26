/**
 * Shared TypeScript types used across API routes and auth helpers.
 * Only safe, non-sensitive fields are defined here.
 */

/** Standard JSON response envelope returned by all API routes. */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

/** Payload encoded into the JWT. Minimal — only what the server needs for identity. */
export interface AuthTokenPayload {
  /** MongoDB ObjectId as string */
  userId: string;
  /** Normalized college email */
  email: string;
}

/** Safe user shape returned to the client — no passwordHash. */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ProfileSocialLinks {
  github: string;
  linkedin: string;
  portfolio: string;
  instagram: string;
}

export interface ProfileProject {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
  campus: string;
  branch: string;
  year: number | null;
  bio: string;
  skills: string[];
  interests: string[];
  socialLinks: ProfileSocialLinks;
  projects: ProfileProject[];
  achievements: ProfileAchievement[];
  createdAt: string;
}

export type PublicStudentProfile = Omit<StudentProfile, "email">;

export type ProfileUpdate = Omit<StudentProfile, "id" | "email" | "createdAt">;

export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";
export type RequestType = "FREE" | "SKILL_SWAP";

export interface DashboardStats {
  connections: number;
  incomingPendingRequests: number;
  unreadMessages: number;
}

export interface DashboardStudent {
  id: string;
  name: string;
  campus?: string;
  branch?: string;
  year?: number;
  commonSkills: string[];
  commonInterests: string[];
}

export interface DashboardRecentRequest {
  id: string;
  type: RequestType;
  title: string;
  status: RequestStatus;
  createdAt: Date;
  direction: "sent" | "received";
  message?: string;
  counterpart: {
    id: string;
    name: string;
    campus?: string;
    branch?: string;
    year?: number;
  };
}

export interface DashboardCollaboration {
  id: string;
  title: string;
  status: string;
  startedAt?: Date;
}

export interface DashboardData {
  stats: DashboardStats;
  students: DashboardStudent[];
  recentRequests: DashboardRecentRequest[];
  collaborations: {
    supported: boolean;
    active: DashboardCollaboration[];
  };
  notifications: {
    supported: boolean;
    unreadCount: number;
  };
  capabilities: {
    requests: boolean;
    unreadMessages: boolean;
    notifications: boolean;
    collaborations: boolean;
  };
}
