/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * On success, issues a signed JWT stored in a secure HTTP-only cookie.
 * Never reveals whether the email or the password was specifically wrong.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import type { ApiResponse, SafeUser } from "@/types";

// ─── Validation schema ────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .refine((e) => e.endsWith("@nmamit.in"), {
      message: "Only @nmamit.in college email addresses are allowed.",
    }),

  password: z.string().min(1, "Please enter your password."),
});

// Generic error shown when credentials don't match — intentionally vague.
const INVALID_CREDENTIALS_MSG = "Invalid email or password.";

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // 2. Connect to DB
    await connectDB();

    // 3. Look up user — explicitly select passwordHash (excluded by default)
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      // User not found — return same error as wrong password to prevent enumeration
      return NextResponse.json<ApiResponse>(
        { success: false, message: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    // 4. Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    // 5. Sign JWT with minimal payload
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // 6. Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, authCookieOptions());

    // 7. Return safe user (no hash)
    const safeUser: SafeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json<ApiResponse<SafeUser>>(
      { success: true, message: "Logged in successfully.", data: safeUser },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
