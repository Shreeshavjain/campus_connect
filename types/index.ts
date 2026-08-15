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
