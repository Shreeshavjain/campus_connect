/**
 * Server-side authentication helpers.
 *
 * All functions in this file are server-only.
 * Never import this file in a Client Component.
 *
 * Uses `jose` for JWT operations because it works in both Node.js and
 * the Next.js Edge runtime without native module issues.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthTokenPayload } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const AUTH_COOKIE_NAME = "auth-token";

/** 7-day expiry for the session cookie. */
const TOKEN_EXPIRY = "7d";

/** Cookie max-age in seconds (7 days). */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// ─── Secret ───────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET environment variable is not set. " +
        "Add AUTH_SECRET=<random 32+ char string> to your .env.local file."
    );
  }
  return new TextEncoder().encode(secret);
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/**
 * Signs a JWT containing only the minimal user identity.
 * The token is short — consumers should re-fetch the DB for full profile data.
 */
export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

/**
 * Verifies and decodes a JWT.
 * Returns the payload or throws if the token is invalid/expired.
 */
export async function verifyToken(
  token: string
): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  // Validate shape
  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string"
  ) {
    throw new Error("Invalid token payload shape.");
  }

  return { userId: payload.userId, email: payload.email };
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/**
 * Reads the auth cookie and returns the decoded payload, or null if the
 * cookie is absent or the token is invalid/expired.
 *
 * Use this in Route Handlers and Server Components to get the current user.
 */
export async function getAuthUser(): Promise<AuthTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (!cookie?.value) return null;

    return await verifyToken(cookie.value);
  } catch {
    // Token invalid, expired, or cookie missing — treat as unauthenticated.
    return null;
  }
}

/**
 * Returns the cookie options object used when setting the auth cookie.
 * Exported so both login and logout routes use identical settings.
 */
export function authCookieOptions(overrides?: { maxAge?: number }) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: overrides?.maxAge ?? COOKIE_MAX_AGE,
  };
}
