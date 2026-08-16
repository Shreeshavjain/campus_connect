/**
 * POST /api/auth/verify-reset-otp
 *
 * Verifies a 6-digit OTP submitted by the user. On success, issues
 * a short-lived password-reset token (separate from the login JWT).
 *
 * OTP consumption is atomic — if two requests submit the same correct
 * OTP simultaneously, only one receives a reset token. This is enforced
 * by a findOneAndUpdate with `resetTokenHash: null` as an atomic guard.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import type { ApiResponse } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_OTP_ATTEMPTS = 5;

/** Reset token expires 10 minutes after OTP verification. */
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

// ─── Validation schema ───────────────────────────────────────────────────────

const VerifyOTPSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .refine((e) => e.endsWith("@nmamit.in"), {
      message: "Only @nmamit.in college email addresses are allowed.",
    }),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits.")
    .regex(/^\d{6}$/, "OTP must be a 6-digit number."),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** SHA-256 hash of a string, returned as hex. */
function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ─── Route handler ───────────────────────────────────────────────────────────

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

    const result = VerifyOTPSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;

    // 2. Connect to DB
    await connectDB();

    // 3. Look up user — generic error if not found (enumeration prevention)
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // 4. Find the latest active (non-used, non-consumed) PasswordReset
    //    resetTokenHash: null ensures we only find records where the
    //    OTP has not yet been consumed by a prior verification.
    const resetRecord = await PasswordReset.findOne({
      userId: user._id,
      used: false,
      resetTokenHash: null,
    }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // 5. Application-level expiry check (TTL is cleanup only)
    if (resetRecord.otpExpiresAt <= new Date()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Verification code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 6. Application-level attempt limit check
    if (resetRecord.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Too many incorrect attempts. Please request a new code.",
        },
        { status: 429 }
      );
    }

    // 7. Verify OTP against the stored hash
    const isValid = await bcrypt.compare(otp, resetRecord.otpHash);

    if (!isValid) {
      // Atomically increment the attempt counter
      await PasswordReset.updateOne(
        { _id: resetRecord._id },
        { $inc: { otpAttempts: 1 } }
      );

      const remaining = MAX_OTP_ATTEMPTS - resetRecord.otpAttempts - 1;

      return NextResponse.json<ApiResponse<{ remainingAttempts: number }>>(
        {
          success: false,
          message: "Invalid or expired verification code.",
          data: { remainingAttempts: Math.max(0, remaining) },
        },
        { status: 400 }
      );
    }

    // 8. OTP is correct — atomically consume it and issue a reset token.
    //
    //    ATOMIC GUARD: The filter `resetTokenHash: null` ensures that if
    //    two concurrent requests both verify the same correct OTP, only
    //    ONE of them can set resetTokenHash. The other gets null back
    //    (document no longer matches the filter) and is rejected.
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenHash = sha256(resetToken);

    const consumed = await PasswordReset.findOneAndUpdate(
      {
        _id: resetRecord._id,
        used: false,
        resetTokenHash: null, // ← atomic guard: only one request wins
      },
      {
        $set: {
          resetTokenHash,
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
          otpHash: "", // Wipe OTP hash — no longer needed
        },
      },
      { new: true }
    );

    if (!consumed) {
      // Another concurrent request already consumed this OTP
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Verification code has already been used.",
        },
        { status: 400 }
      );
    }

    // 9. Return the reset token (client stores this for the password reset step)
    return NextResponse.json<ApiResponse<{ resetToken: string }>>(
      {
        success: true,
        message: "Email verified successfully.",
        data: { resetToken },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/auth/verify-reset-otp]", err);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
