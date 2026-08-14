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
  BookOpen,
  Lightbulb,
  FlaskConical,
  Users,
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

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your college email.");
      return;
    }

    if (!cleanEmail.endsWith("@nmamit.in")) {
      setError("Only @nmamit.in college email addresses are allowed.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setIsLoading(true);

    // Temporary frontend testing.
    // Backend authentication will be connected later.
    setTimeout(() => {
      setIsLoading(false);

      console.log({
        name,
        email: cleanEmail,
        password,
        mode: isSignUp ? "signup" : "login",
      });
    }, 500);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <main className="min-h-screen bg-white">

      {/* =====================================================
          DESKTOP / LAPTOP VERSION
          ===================================================== */}

      <div className="hidden min-h-screen lg:flex">

        {/* ================= LEFT LOGIN SECTION ================= */}

        <section className="flex w-[48%] items-center justify-center bg-white px-12 py-12 xl:px-20">
          <div className="w-full max-w-md">

            {/* Branding */}
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                <GraduationCap className="h-7 w-7 text-indigo-700" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Campus Connect
                </h1>

                <p className="text-xs text-slate-500">
                  Your campus. Your community.
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>

              <p className="mt-2 text-slate-500">
                {isSignUp
                  ? "Join your campus peer network."
                  : "Connect with your campus community."}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              {isSignUp && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}

              {/* College Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  College Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usn@nmamit.in"
                    autoComplete="email"
                    className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Use your official @nmamit.in college email.
                </p>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() =>
                        alert("Password reset will be connected later.")
                      }
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login / Create Account */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isSignUp ? "Create Account" : "Login"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Switch */}
            <div className="mt-7 text-center">
              <p className="text-sm text-slate-500">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </p>
            </div>

            {/* Information */}
            <div className="mt-8 flex gap-3 border border-indigo-100 bg-indigo-50/60 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

              <p className="text-xs leading-relaxed text-slate-600">
                Campus Connect is exclusively for students using their
                official{" "}
                <span className="font-semibold text-indigo-700">
                  @nmamit.in
                </span>{" "}
                college email.
              </p>
            </div>
          </div>
        </section>

        {/* ================= RIGHT EDUCATION SECTION ================= */}

        <section className="relative flex w-[52%] items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-12 py-16 xl:px-20">

          {/* Soft background shapes */}
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-purple-100/60 blur-3xl" />

          <div className="relative z-10 w-full max-w-xl">

            {/* Label */}
            <p className="text-sm font-semibold tracking-wide text-indigo-600">
              CAMPUS COMMUNITY
            </p>

            {/* Heading */}
            <h2 className="mt-3 text-4xl font-bold leading-tight text-slate-900 xl:text-5xl">
              Learn from each other.
              <br />
              <span className="text-indigo-600">
                Grow together.
              </span>
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Find students with the skills you need, ask for help,
              discover clubs and build meaningful connections.
            </p>

            {/* Simple education illustration */}
            <div className="relative mx-auto mt-10 h-56 max-w-lg">

              {/* Desk */}
              <div className="absolute bottom-5 left-1/2 h-3 w-80 -translate-x-1/2 rounded-full bg-slate-200" />

              {/* Laptop */}
              <div className="absolute bottom-8 left-1/2 h-32 w-52 -translate-x-1/2 rounded-lg border-4 border-slate-300 bg-white shadow-lg">
                <div className="flex h-full items-center justify-center bg-indigo-50">
                  <GraduationCap className="h-16 w-16 text-indigo-500" />
                </div>
              </div>

              {/* Book */}
              <div className="absolute bottom-9 left-12 flex h-10 w-20 rotate-[-8deg] items-center justify-center rounded-md border border-indigo-200 bg-indigo-100 shadow-sm">
                <BookOpen className="h-5 w-5 text-indigo-500" />
              </div>

              {/* People */}
              <div className="absolute left-20 top-12 flex h-11 w-11 items-center justify-center rounded-full border border-indigo-200 bg-white shadow-sm">
                <Users className="h-5 w-5 text-indigo-500" />
              </div>

              {/* Lightbulb */}
              <div className="absolute right-12 top-10 flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                <Lightbulb className="h-6 w-6 text-amber-500" />
              </div>

              {/* Flask */}
              <div className="absolute bottom-12 right-24 flex h-12 w-12 items-center justify-center rounded-xl border border-purple-200 bg-purple-50">
                <FlaskConical className="h-6 w-6 text-purple-500" />
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-8 grid grid-cols-3 gap-3">

              <div className="border border-slate-200 bg-white p-4">
                <BookOpen className="h-5 w-5 text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Learn
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Share knowledge
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-4">
                <Users className="h-5 w-5 text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Connect
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Meet students
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-4">
                <Lightbulb className="h-5 w-5 text-indigo-600" />

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Collaborate
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Work together
                </p>
              </div>

            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Your campus. Your skills. Your community.
            </p>
          </div>
        </section>
      </div>

      {/* =====================================================
          MOBILE VERSION
          ===================================================== */}

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 lg:hidden">

        <div className="w-full max-w-md">

          {/* Mobile Branding */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <GraduationCap className="h-7 w-7 text-indigo-700" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Campus Connect
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Connect • Help • Collaborate
            </p>
          </div>

          {/* Mobile Login Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-indigo-100/50">

            <h2 className="text-2xl font-bold text-slate-900">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isSignUp
                ? "Join your campus peer network"
                : "Log in with your college credentials"}
            </p>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">

              {/* Name */}
              {isSignUp && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  College Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usn@nmamit.in"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>

                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() =>
                        alert("Password reset will be connected later.")
                      }
                      className="text-xs font-semibold text-indigo-600"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-70"
              >
                {isLoading
                  ? "Please wait..."
                  : isSignUp
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>

            {/* Switch */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-bold text-indigo-600"
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </p>
            </div>

            {/* Note */}
            <div className="mt-6 flex gap-2 rounded-xl bg-indigo-50 p-3">
              <Info className="h-4 w-4 shrink-0 text-indigo-600" />

              <p className="text-[11px] leading-5 text-slate-600">
                Only{" "}
                <span className="font-semibold text-indigo-700">
                  @nmamit.in
                </span>{" "}
                college email addresses are allowed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}