/**
 * POST /api/auth/forgot-password
 *
 * Initiates the password-reset flow by generating a 6-digit OTP,
 * hashing it, storing it in the PasswordReset collection, and
 * emailing it to the user.
 *
 * Always returns the same generic response regardless of whether
 * the email exists or a cooldown is in effect — this prevents
 * account enumeration.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { sendOTPEmail } from "@/lib/email";
import type { ApiResponse } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** OTP expires 5 minutes after creation. */
const OTP_EXPIRY_MS = 5 * 60 * 1000;

/** Minimum interval between OTP sends for the same user (seconds). */
const RESEND_COOLDOWN_SECONDS = 60;

/** bcrypt salt rounds for OTP hashing (lower than passwords — OTP is short-lived). */
const OTP_SALT_ROUNDS = 10;

/**
 * Generic response returned to ALL requests, regardless of outcome.
 * Identical message whether the email exists, doesn't exist, or is on cooldown.
 */
const GENERIC_SUCCESS: ApiResponse = {
  success: true,
  message:
    "If an account exists for this email, a verification code has been sent.",
};

// ─── Validation schema ───────────────────────────────────────────────────────

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .refine((e) => e.endsWith("@nmamit.in"), {
      message: "Only @nmamit.in college email addresses are allowed.",
    }),
});

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

    const result = ForgotPasswordSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // 2. Connect to DB
    await connectDB();

    // 3. Look up user — never reveal whether the email exists
    const user = await User.findOne({ email });

    if (!user) {
      // No account — return the same generic success
      return NextResponse.json<ApiResponse>(GENERIC_SUCCESS, { status: 200 });
    }

    // 4. Check resend cooldown — silently return generic success if too recent
    //    This prevents leaking account existence through cooldown-specific errors.
    const cooldownThreshold = new Date(
      Date.now() - RESEND_COOLDOWN_SECONDS * 1000
    );
    const recentReset = await PasswordReset.findOne({
      userId: user._id,
      used: false,
      createdAt: { $gt: cooldownThreshold },
    });

    if (recentReset) {
      // Cooldown active — return same generic response (no information leak)
      return NextResponse.json<ApiResponse>(GENERIC_SUCCESS, { status: 200 });
    }

    // 5. Invalidate all prior active reset records for this user
    //    Prevents multiple active OTPs from causing confusion.
    await PasswordReset.updateMany(
      { userId: user._id, used: false },
      { $set: { used: true } }
    );

    // 6. Generate cryptographically secure 6-digit OTP
    //    randomInt(min, max) — min inclusive, max exclusive
    const otp = randomInt(100000, 1000000).toString();

    // 7. Hash the OTP before storing — never store raw OTP
    const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);

    // 8. Create PasswordReset document
    await PasswordReset.create({
      userId: user._id,
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    // 9. Send OTP email
    //    Errors are caught to avoid leaking account existence through
    //    email delivery failures. The generic response is always returned.
    try {
      await sendOTPEmail(user.email, otp);
    } catch (emailErr) {
      console.error(
        "[POST /api/auth/forgot-password] Email delivery failed:",
        emailErr
      );
    }

    // 10. Return generic success — identical to all other code paths
    return NextResponse.json<ApiResponse>(GENERIC_SUCCESS, { status: 200 });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
