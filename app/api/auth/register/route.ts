/**
 * POST /api/auth/register
 *
 * Registers a new Campus Connect user.
 * Only @nmamit.in email addresses are accepted.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { ApiResponse, SafeUser } from "@/types";

// ─── Validation schema ────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .refine((e) => e.endsWith("@nmamit.in"), {
      message: "Only @nmamit.in college email addresses are allowed.",
    }),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
});

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

    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json<ApiResponse>(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // 2. Connect to DB
    await connectDB();

    // 3. Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "An account with this email already exists. Please sign in.",
        },
        { status: 409 }
      );
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Create user
    const user = await User.create({ name, email, passwordHash });

    // 6. Return safe user (no hash)
    const safeUser: SafeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json<ApiResponse<SafeUser>>(
      {
        success: true,
        message: "Account created successfully. You can now sign in.",
        data: safeUser,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
