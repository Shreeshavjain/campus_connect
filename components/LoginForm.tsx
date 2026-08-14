"use client";

import { useState } from "react";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
} from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your college email address.");
      return;
    }

    if (!email.toLowerCase().endsWith("@nmamit.in")) {
      setError(
        "Only college email addresses ending in @nmamit.in are allowed."
      );
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Temporary frontend behavior.
      // Backend authentication will be connected later.
      console.log({
        name,
        email,
        password,
        mode: isSignUp ? "signup" : "login",
      });
    }, 500);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-slate-50">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-100/50 border border-slate-100/80 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#283593]">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSignUp
                ? "Create your Student Account"
                : "Welcome back to Campus Connect"}
            </h1>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {isSignUp
                ? "Join your campus peer network"
                : "Log in with your college credentials"}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Name - Signup only */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Mehta"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#283593] transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              College Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@nmamit.in"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#283593] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() =>
                    alert("Password reset will be connected later.")
                  }
                  className="text-xs font-semibold text-[#283593] hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#283593] transition-all"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#283593] hover:bg-[#1f2a74] text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Login"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Login / Signup toggle */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-bold text-[#283593] hover:underline"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        {/* College email note */}
        <div className="mt-6 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-slate-600">
          <Info className="w-4 h-4 text-[#283593] shrink-0 mt-0.5" />

          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-slate-700">Note:</span>{" "}
            Only college email addresses (
            <span className="font-mono font-medium text-[#283593]">
              @nmamit.in
            </span>
            ) are allowed.
          </p>
        </div>
      </div>
    </main>
  );
}