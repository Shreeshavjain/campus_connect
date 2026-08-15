/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 *
 * Flow:
 *  1. Read the auth cookie and verify the JWT → extract userId.
 *  2. Fetch the user from MongoDB using that userId.
 *     (We do NOT trust the email or other fields from the JWT alone.)
 *  3. Return safe user fields (no passwordHash).
 *
 * Returns 401 if the cookie is absent, the token is invalid/expired,
 * or the user no longer exists in the database.
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import type { ApiResponse, SafeUser } from "@/types";

export async function GET() {
  try {
    // 1. Verify auth cookie and extract token payload
    const tokenPayload = await getAuthUser();

    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    // 2. Fetch current user from DB — never trust JWT claims for profile data
    await connectDB();
    const user = await User.findById(tokenPayload.userId);

    if (!user) {
      // Account was deleted after the token was issued
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User account not found." },
        { status: 401 }
      );
    }

    // 3. Return safe user (no passwordHash — it is excluded by default in the schema)
    const safeUser: SafeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json<ApiResponse<SafeUser>>(
      { success: true, message: "Authenticated.", data: safeUser },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
