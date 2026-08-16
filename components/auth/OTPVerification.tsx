"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import OTPInput from "./OTPInput";
import OTPAnimation, { type AnimationPhase } from "./OTPAnimation";

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

type VerificationState =
  | "idle"
  | "verifying"
  | "success"
  | "error"
  | "expired"
  | "tooManyAttempts";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;


/** Mask an email: u***@nmamit.in */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

/* ═══════════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════════ */

interface OTPVerificationProps {
  /** The email the OTP was sent to */
  email: string;
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function OTPVerification({ email }: OTPVerificationProps) {
  const router = useRouter();

  // ── OTP State ──────────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusIndex, setFocusIndex] = useState(0);
  const [verificationState, setVerificationState] = useState<VerificationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Animation Phase ────────────────────────────────────────────
  const [animPhase, setAnimPhase] = useState<AnimationPhase>("idle");
  const [animResult, setAnimResult] = useState<boolean | null>(null);

  // ── Resend State ───────────────────────────────────────────────
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendMessage, setResendMessage] = useState("");
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Attempt Tracking (UI limit display) ────────────────────────
  const [attemptCount, setAttemptCount] = useState(0);
  const MAX_ATTEMPTS = 5;

  const isSubmittingRef = useRef(false);

  /* ── Cooldown Timer ────────────────────────────────────────── */
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
      return;
    }

    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
    }

    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    };
  }, [resendCooldown]);

  /* ── Derived state ─────────────────────────────────────────── */
  const otpFilled = otpDigits.every((d) => d !== "");
  const isInteractive = (verificationState === "idle" || verificationState === "error") && animPhase === "idle";
  const maskedEmail = maskEmail(email);

  /* ── Verification Handler ──────────────────────────────────── */
  const verifyOTP = useCallback(async () => {
    if (!otpFilled || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const enteredOTP = otpDigits.join("");
    setVerificationState("verifying");
    setErrorMessage("");
    setSuccessMessage("");
    setResendMessage("");

    // Start gathering and rotation animation
    setAnimPhase("verifying");
    setAnimResult(null);

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOTP }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Store resetToken securely in sessionStorage
        if (data.data?.resetToken) {
          sessionStorage.setItem("resetToken", data.data.resetToken);
        }
        setAnimResult(true);
        setAnimPhase("success");
        setVerificationState("success");
        setSuccessMessage("Your email has been verified successfully.");
      } else {
        setAnimResult(false);
        setAnimPhase("error");

        if (res.status === 429) {
          setAttemptCount(MAX_ATTEMPTS); // Fast-track to max attempts
          setVerificationState("tooManyAttempts");
          setErrorMessage(data.message || "Too many incorrect attempts. Please request a new code.");
        } else {
          setAttemptCount((prev) => prev + 1);
          setVerificationState(
            data.message?.includes("expired") ? "expired" : "error"
          );
          setErrorMessage(data.message || "Incorrect verification code. Please try again.");
        }
      }
    } catch (err) {
      setAnimResult(false);
      setAnimPhase("error");
      setVerificationState("error");
      setErrorMessage("Network error. Please try again later.");
    }

    isSubmittingRef.current = false;
  }, [otpDigits, otpFilled]);

  /* ── Animation Completion Callbacks ────────────────────────── */
  const handleSuccessComplete = useCallback(() => {
    // Navigate to reset-password after success animation finishes
    router.push("/reset-password");
  }, [router]);

  const handleFailureComplete = useCallback(() => {
    // Reset back to idle editable state
    setAnimPhase("idle");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setFocusIndex(0);

    if (attemptCount >= MAX_ATTEMPTS) {
      setVerificationState("tooManyAttempts");
      setErrorMessage("Too many incorrect attempts. Please request a new code.");
    }
  }, [attemptCount]);

  /* ── Auto-submit when all 6 digits entered ─────────────────── */
  useEffect(() => {
    if (otpFilled && isInteractive) {
      const timer = setTimeout(verifyOTP, 250);
      return () => clearTimeout(timer);
    }
  }, [otpFilled, isInteractive, verifyOTP]);

  /* ── Resend Handler ────────────────────────────────────────── */
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setErrorMessage("");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setFocusIndex(0);
    setVerificationState("idle");
    setAnimPhase("idle");
    setAttemptCount(0);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setResendMessage(data.message || "A new verification code has been sent.");
      } else {
        setErrorMessage(data.message || "Failed to resend code.");
      }
    } catch (err) {
      setErrorMessage("Network error. Could not resend code.");
    }

    setTimeout(() => setResendMessage(""), 4000);
  }, [resendCooldown, email]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* ── Branding ──────────────────────────────────────────── */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <GraduationCap className="h-7 w-7 text-indigo-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Connect</h1>
        </div>

        {/* ── Card ──────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-indigo-100/50">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
            aria-label="Back to forgot password"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter the 6-digit code sent to
            </p>
            <p className="mt-1 text-sm font-semibold text-indigo-600">
              {maskedEmail}
            </p>
          </div>

          {/* ── Success message ──────────────────────────────────── */}
          <AnimatePresence>
            {successMessage && verificationState === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700"
                role="alert"
                aria-live="polite"
              >
                <p className="font-bold">Email verified</p>
                <p className="mt-0.5 font-normal text-emerald-600">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error message ────────────────────────────────────── */}
          <AnimatePresence>
            {errorMessage &&
              (verificationState === "error" ||
                verificationState === "tooManyAttempts" ||
                verificationState === "expired") && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600"
                  role="alert"
                  aria-live="assertive"
                >
                  {errorMessage}
                </motion.div>
              )}
          </AnimatePresence>

          {/* ── Resend confirmation ──────────────────────────────── */}
          <AnimatePresence>
            {resendMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-center text-xs font-semibold text-blue-700"
                role="status"
                aria-live="polite"
              >
                {resendMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Visual Animated OTP Layer ───────────────────────── */}
          <div className="relative mb-6 flex items-center justify-center">
            {/* The single persistent visual animation container */}
            <OTPAnimation
              digits={otpDigits}
              phase={animPhase}
              isSuccess={animResult}
              focusIndex={focusIndex}
              hasError={verificationState === "error" && animPhase === "idle"}
              disabled={!isInteractive}
              onSuccessComplete={handleSuccessComplete}
              onFailureComplete={handleFailureComplete}
            />

            {/* Invisible interactive input layer during idle state */}
            {isInteractive && (
              <div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ touchAction: "manipulation" }}
              >
                <div className="opacity-0">
                  <OTPInput
                    value={otpDigits}
                    onChange={setOtpDigits}
                    disabled={!isInteractive}
                    focusIndex={focusIndex}
                    onFocusChange={setFocusIndex}
                    hasError={verificationState === "error"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Verify Button (Idle only) ───────────────────────── */}
          {animPhase === "idle" && (
            <motion.button
              type="button"
              onClick={verifyOTP}
              disabled={!otpFilled || verificationState === "tooManyAttempts"}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Verify OTP"
              whileTap={{ scale: 0.98 }}
            >
              Verify Code
            </motion.button>
          )}

          {/* ── Loading status message during animation ─────────── */}
          {animPhase === "verifying" && (
            <div className="flex items-center justify-center py-2">
              <p className="text-xs font-medium text-slate-400 animate-pulse">
                Verifying your code...
              </p>
            </div>
          )}

          {/* ── Resend / Cooldown ───────────────────────────────── */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              {"Didn't receive the code? "}
              {resendCooldown > 0 ? (
                <span className="font-medium text-slate-400">
                  Resend available in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={verificationState === "verifying" || animPhase !== "idle"}
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 transition hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resend OTP
                </button>
              )}
            </p>
          </div>


        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Your campus. Your community.
        </p>
      </div>
    </div>
  );
}
