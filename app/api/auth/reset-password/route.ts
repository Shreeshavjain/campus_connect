/**
 * POST /api/auth/reset-password
 *
 * Validates a password-reset token and sets a new password.
 *
 * The request does NOT include an email — the reset token alone
 * identifies the user via the PasswordReset record's userId.
 *
 * ─── Atomicity strategy (no MongoDB transaction required) ──────
 *
 * 1. Validate the reset token (read-only lookup).
 * 2. Hash the new password with bcrypt (CPU work — no DB writes).
 * 3. Atomically consume the token via findOneAndUpdate with
 *    `used: false` as the atomic guard.  This ensures exactly one
 *    concurrent request can consume a given token.
 * 4. Update the user's password.
 * 5. If step 4 fails, rollback: set `used: false` (best-effort).
 *
 * Tradeoff: Between steps 3 and 4 the token is consumed but the
 * password is not yet updated. If the User update fails (extremely
 * unlikely — the DB was just proven reachable in step 3), the
 * rollback in step 5 restores the token. If the rollback also fails,
 * the user can request a new OTP. The password hash (the heaviest
 * CPU operation) is computed before any writes to minimize risk.
 *
 * Invariant: One valid reset token → at most one successful reset.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** bcrypt salt rounds for the new password (same as registration). */
const PASSWORD_SALT_ROUNDS = 12;

// ─── Validation schema ───────────────────────────────────────────────────────

const ResetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "Reset token is required."),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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

    const result = ResetPasswordSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { resetToken, newPassword } = result.data;

    // 2. Connect to DB
    await connectDB();

    // 3. Hash the provided reset token with SHA-256
    const resetTokenHash = sha256(resetToken);

    // 4. Validate the reset token (read-only — do NOT consume yet).
    //    Application-level expiry check via $gt (TTL is cleanup only).
    const resetRecord = await PasswordReset.findOne({
      resetTokenHash,
      used: false,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // 5. Hash the new password BEFORE any writes.
    //    bcrypt is the heaviest CPU operation — doing it before
    //    consumption ensures a CPU failure can't leave a consumed token.
    const newPasswordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

    // 6. Atomically consume the reset token.
    //    The filter `used: false` ensures only ONE concurrent request
    //    can consume this token. The loser gets null.
    const consumed = await PasswordReset.findOneAndUpdate(
      {
        _id: resetRecord._id,
        used: false, // ← atomic guard
      },
      { $set: { used: true } },
      { new: true }
    );

    if (!consumed) {
      // Another concurrent request already consumed this token
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // 7. Update the user's password.
    //    If this fails, we attempt to rollback the token consumption.
    try {
      const updatedUser = await User.findByIdAndUpdate(
        consumed.userId,
        { $set: { passwordHash: newPasswordHash } },
        { new: true }
      );

      if (!updatedUser) {
        // User was deleted between OTP verification and password reset.
        // Rollback: un-consume the token (best-effort).
        await PasswordReset.updateOne(
          { _id: consumed._id },
          { $set: { used: false } }
        ).catch(() => {
          // Rollback failed — token stays consumed. User can request a new OTP.
        });

        return NextResponse.json<ApiResponse>(
          { success: false, message: "User account not found." },
          { status: 400 }
        );
      }
    } catch (updateErr) {
      // Password update failed — rollback token consumption (best-effort).
      await PasswordReset.updateOne(
        { _id: consumed._id },
        { $set: { used: false } }
      ).catch(() => {
        // Rollback also failed — token stays consumed. User can request a new OTP.
      });

      throw updateErr; // Re-throw to hit the outer catch
    }

    // 8. Clear the auth cookie (best-effort session invalidation).
    //    Note: Existing JWTs on other devices remain valid until their
    //    natural 7-day expiry. This is a documented limitation of the
    //    stateless JWT architecture. Future hardening: add tokenVersion
    //    to the User model and check it during JWT verification.
    try {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, "", authCookieOptions({ maxAge: 0 }));
    } catch {
      // Cookie clearing is best-effort — don't fail the reset
    }

    // 9. Return success
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
