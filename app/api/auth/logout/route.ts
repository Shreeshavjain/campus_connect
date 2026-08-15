/**
 * POST /api/auth/logout
 *
 * Clears the authentication cookie, ending the session.
 * The JWT itself is not invalidated server-side (stateless design),
 * but the cookie is expired immediately so the browser discards it.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Overwrite with expired cookie — the browser will discard it immediately.
    cookieStore.set(AUTH_COOKIE_NAME, "", authCookieOptions({ maxAge: 0 }));

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Logged out successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/auth/logout]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
