"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Mail,
  ArrowLeft,
  ArrowRight,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your college email.");
      return;
    }

    if (!cleanEmail.endsWith("@nmamit.in")) {
      setError("Only @nmamit.in college email addresses are allowed.");
      return;
    }

    setIsLoading(true);

    /**
     * MOCK: Simulate sending OTP to the email.
     * TODO: Replace with actual API call:
     *   const res = await fetch("/api/auth/send-otp", {
     *     method: "POST",
     *     headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify({ email: cleanEmail }),
     *   });
     */
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsLoading(false);

    // Navigate to verify-otp with email as URL param (mock stage only)
    router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <GraduationCap className="h-7 w-7 text-indigo-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Connect</h1>
          <p className="mt-1 text-sm text-slate-500">
            Password Recovery
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-indigo-100/50">
          {/* Back */}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
            aria-label="Back to login"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <KeyRound className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your college email and we&apos;ll send you a verification code.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                College Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usn@nmamit.in"
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending code...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Send Verification Code
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your campus. Your community.
        </p>
      </div>
    </div>
  );
}
