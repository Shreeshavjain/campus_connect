"use client";

import { useState } from "react";
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    /**
     * MOCK: Password reset is not connected to a backend yet.
     * TODO: Replace with actual API call:
     *   await fetch("/api/auth/reset-password", { ... });
     */
    alert(
      "Password reset UI is ready! Backend not connected yet.\n\nThis will later call POST /api/auth/reset-password."
    );
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
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-indigo-100/50">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Set new password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your email has been verified. Create a new password for your account.
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
            {/* New Password */}
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-10 pr-11 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-10 pr-11 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              <span className="flex items-center justify-center gap-2">
                Reset Password
                <ArrowRight className="h-4 w-4" />
              </span>
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
