"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

export type AnimationPhase =
  | "idle"
  | "verifying"
  | "success"
  | "error"
  | "dispersing";

interface OTPAnimationProps {
  /** The 6 OTP digits */
  digits: string[];
  /** Current animation phase */
  phase: AnimationPhase;
  /** Verification result: true (success), false (failure), null (verifying/pending) */
  isSuccess: boolean | null;
  /** Active focused input index (during idle) */
  focusIndex?: number;
  /** Error state flag */
  hasError?: boolean;
  /** Disabled flag */
  disabled?: boolean;
  /** Called when the full success animation sequence has completed */
  onSuccessComplete?: () => void;
  /** Called when the failure animation & disperse has completed */
  onFailureComplete?: () => void;
}

const OTP_LENGTH = 6;
// Motion easing curve per spec: fast start, smooth deceleration
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

// External store subscription for responsive window width without hydration mismatch
function subscribeWindowResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getWindowWidthSnapshot() {
  return window.innerWidth;
}

function getServerWidthSnapshot() {
  return 400; // Deterministic SSR snapshot
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function OTPAnimation({
  digits,
  phase,
  isSuccess,
  focusIndex = 0,
  hasError = false,
  disabled = false,
  onSuccessComplete,
  onFailureComplete,
}: OTPAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  // Internal choreography sub-stage
  type MotionStage =
    | "idle"
    | "gather"
    | "formation"
    | "spin"
    | "collapse"
    | "success_burst"
    | "shake"
    | "disperse";

  const [stage, setStage] = useState<MotionStage>("idle");
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Responsive window width via React's official useSyncExternalStore
  const windowWidth = useSyncExternalStore(
    subscribeWindowResize,
    getWindowWidthSnapshot,
    getServerWidthSnapshot
  );

  const boxSize = useMemo(() => {
    const vw = windowWidth;
    // Responsive box dimension calculations
    const w = Math.min(52, Math.max(38, vw * 0.115));
    const gap = Math.min(10, Math.max(6, vw * 0.018));
    return { w, gap };
  }, [windowWidth]);

  const totalRowWidth = OTP_LENGTH * boxSize.w + (OTP_LENGTH - 1) * boxSize.gap;

  // Real initial horizontal positions relative to container center
  const initialPositions = useMemo(() => {
    return Array.from({ length: OTP_LENGTH }, (_, i) => {
      const leftEdge = i * (boxSize.w + boxSize.gap);
      const centerX = leftEdge + boxSize.w / 2;
      const rowCenter = totalRowWidth / 2;
      return centerX - rowCenter;
    });
  }, [boxSize.gap, boxSize.w, totalRowWidth]);

  // 2-2-2 Hexagonal compact formation offsets relative to center (0,0)
  // [1]   [2]
  // [3]       [4]
  // [5]   [6]
  const formationPositions = useMemo(() => {
    const scale = windowWidth < 360 ? 0.85 : 1;
    return [
      { x: -34 * scale, y: -42 * scale, rotate: -6 },  // Top Left (1)
      { x: 34 * scale,  y: -42 * scale, rotate: 6 },   // Top Right (2)
      { x: -52 * scale, y: 0,          rotate: -12 },  // Mid Left (3)
      { x: 52 * scale,  y: 0,          rotate: 12 },   // Mid Right (4)
      { x: -34 * scale, y: 42 * scale,  rotate: -6 },  // Bottom Left (5)
      { x: 34 * scale,  y: 42 * scale,  rotate: 6 },   // Bottom Right (6)
    ];
  }, [windowWidth]);

  // ── Orchestration State Machine ─────────────────────────────────
  useEffect(() => {
    clearAllTimers();

    if (prefersReducedMotion) {
      if (phase === "success") {
        const t = window.setTimeout(() => onSuccessComplete?.(), 600);
        timersRef.current.push(t);
      } else if (phase === "error") {
        const t = window.setTimeout(() => onFailureComplete?.(), 600);
        timersRef.current.push(t);
      }
      return;
    }

    if (phase === "idle") {
      const t = window.setTimeout(() => setStage("idle"), 0);
      timersRef.current.push(t);
    } else if (phase === "verifying") {
      // 1. Gather into formation (0ms -> 300ms)
      const t0 = window.setTimeout(() => setStage("gather"), 0);

      const t1 = window.setTimeout(() => {
        setStage("formation");
      }, 300);

      // 2. Start group rotation (500ms)
      const t2 = window.setTimeout(() => {
        setStage("spin");
      }, 500);

      timersRef.current.push(t0, t1, t2);
    } else if (phase === "success") {
      // 3. Rotation finishes -> Collapse (1500ms) -> Success burst
      const t0 = window.setTimeout(() => setStage("collapse"), 0);

      const tSuccess = window.setTimeout(() => {
        setStage("success_burst");
      }, 320);

      const tDone = window.setTimeout(() => {
        onSuccessComplete?.();
      }, 1200);

      timersRef.current.push(t0, tSuccess, tDone);
    } else if (phase === "error") {
      // Failure: Shake -> Disperse back to row
      const t0 = window.setTimeout(() => setStage("shake"), 0);

      const tDisperse = window.setTimeout(() => {
        setStage("disperse");
      }, 400);

      const tFailDone = window.setTimeout(() => {
        onFailureComplete?.();
      }, 850);

      timersRef.current.push(t0, tDisperse, tFailDone);
    }

    return clearAllTimers;
  }, [
    phase,
    isSuccess,
    prefersReducedMotion,
    clearAllTimers,
    onSuccessComplete,
    onFailureComplete,
  ]);

  // ── Focus Glow styling during idle ──────────────────────────────
  const getFocusedStyle = useCallback(
    (index: number) => {
      if (phase !== "idle" || disabled) return {};
      if (index === focusIndex) {
        return {
          boxShadow:
            "0 0 0 3px rgba(99, 102, 241, 0.25), 0 0 16px rgba(99, 102, 241, 0.1)",
          borderColor: "rgb(99, 102, 241)",
        };
      }
      return {};
    },
    [disabled, focusIndex, phase]
  );

  // ── Reduced Motion Fallback ─────────────────────────────────────
  if (prefersReducedMotion) {
    return (
      <div className="relative flex items-center justify-center py-2" style={{ minHeight: 96 }}>
        <AnimatePresence mode="wait">
          {phase !== "success" ? (
            <motion.div
              key="reduced-boxes"
              className="flex gap-[clamp(6px,1.8vw,10px)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {digits.map((digit, i) => (
                <div
                  key={i}
                  className={`
                    flex items-center justify-center rounded-xl border-2 bg-white
                    text-xl sm:text-2xl font-bold text-slate-800
                    w-[clamp(38px,11.5vw,52px)] h-[clamp(46px,13.5vw,60px)]
                    ${
                      hasError
                        ? "border-red-300 bg-red-50/30"
                        : digit
                        ? "border-slate-300 bg-slate-50"
                        : "border-slate-200"
                    }
                  `}
                  style={getFocusedStyle(i)}
                >
                  {digit}
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="reduced-success"
              className="flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Group Transform (Rotation & Shake) ──────────────────────────
  const getGroupAnimation = () => {
    if (stage === "spin") {
      return {
        rotate: 360,
        x: 0,
        scale: 1,
      };
    }
    if (stage === "shake") {
      return {
        rotate: 0,
        x: [-6, 6, -4, 4, -2, 2, 0],
        scale: 1,
      };
    }
    return {
      rotate: 0,
      x: 0,
      scale: 1,
    };
  };

  const getGroupTransition = () => {
    if (stage === "spin") {
      return {
        duration: 1.05,
        ease: EASE_IN_OUT,
      };
    }
    if (stage === "shake") {
      return {
        duration: 0.35,
        ease: "easeInOut" as const,
      };
    }
    return { duration: 0.2 };
  };

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        minHeight: 160,
        width: "100%",
        overflow: "visible",
      }}
    >
      {/* ── CENTRAL ROTATING GROUP ───────────────────────────────── */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{
          width: 200,
          height: 150,
          transformOrigin: "center center",
        }}
        animate={getGroupAnimation()}
        transition={getGroupTransition()}
      >
        {digits.map((digit, i) => {
          const initX = initialPositions[i];
          const formPos = formationPositions[i];

          // Determine per-box transform based on stage
          let targetX = initX;
          let targetY = 0;
          let targetRotate = 0;
          let targetScale = 1;
          let targetOpacity = 1;

          if (stage === "idle") {
            targetX = initX;
            targetY = 0;
            targetRotate = 0;
            targetScale = 1;
            targetOpacity = 1;
          } else if (stage === "gather") {
            targetX = formPos.x;
            targetY = formPos.y;
            targetRotate = formPos.rotate;
            targetScale = 0.95;
            targetOpacity = 1;
          } else if (stage === "formation" || stage === "spin") {
            targetX = formPos.x;
            targetY = formPos.y;
            targetRotate = formPos.rotate;
            targetScale = 0.95;
            targetOpacity = 1;
          } else if (stage === "collapse") {
            targetX = 0;
            targetY = 0;
            targetRotate = 0;
            targetScale = 0.15;
            targetOpacity = 0;
          } else if (stage === "success_burst") {
            targetX = 0;
            targetY = 0;
            targetRotate = 0;
            targetScale = 0;
            targetOpacity = 0;
          } else if (stage === "shake") {
            targetX = formPos.x;
            targetY = formPos.y;
            targetRotate = formPos.rotate;
            targetScale = 0.95;
            targetOpacity = 1;
          } else if (stage === "disperse") {
            targetX = initX;
            targetY = 0;
            targetRotate = 0;
            targetScale = 1;
            targetOpacity = 1;
          }

          let boxTransition: Record<string, number | [number, number, number, number] | string>;

          if (stage === "gather") {
            const staggerDelay = Math.abs(i - 2.5) * 0.035;
            boxTransition = {
              duration: 0.32,
              ease: EASE_OUT_EXPO,
              delay: staggerDelay,
            };
          } else if (stage === "collapse") {
            boxTransition = {
              duration: 0.3,
              ease: EASE_OUT_EXPO,
            };
          } else if (stage === "disperse") {
            const disperseDelay = (2.5 - Math.abs(i - 2.5)) * 0.035;
            boxTransition = {
              duration: 0.38,
              ease: EASE_OUT_EXPO,
              delay: disperseDelay,
            };
          } else {
            boxTransition = {
              duration: 0.25,
              ease: EASE_OUT_EXPO,
            };
          }

          const isErrorLook = hasError || stage === "shake";

          return (
            <motion.div
              key={i}
              className={`
                absolute flex items-center justify-center rounded-xl border-2 bg-white
                text-xl sm:text-2xl font-bold text-slate-800 shadow-xs
                w-[clamp(38px,11.5vw,52px)] h-[clamp(46px,13.5vw,60px)]
                -ml-[19px] -mt-[23px] sm:-ml-[26px] sm:-mt-[30px]
                ${
                  isErrorLook
                    ? "border-red-300 bg-red-50/20 text-red-700"
                    : digit
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-200"
                }
              `}
              style={{
                left: "50%",
                top: "50%",
                willChange: "transform, opacity",
                ...getFocusedStyle(i),
              }}
              animate={{
                x: targetX,
                y: targetY,
                rotate: targetRotate,
                scale: targetScale,
                opacity: targetOpacity,
              }}
              transition={boxTransition}
            >
              {/* Digit character */}
              <span className="leading-none">{digit}</span>

              {/* Focus glow in idle state */}
              {phase === "idle" && i === focusIndex && !disabled && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-indigo-400"
                  animate={{
                    opacity: [0.35, 0.75, 0.35],
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ pointerEvents: "none" }}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── SUCCESS ANIMATION LAYER (Phase 5) ────────────────────── */}
      <AnimatePresence>
        {stage === "success_burst" && (
          <motion.div
            key="success-burst-layer"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Subtle atmospheric glow behind */}
            <motion.div
              className="absolute rounded-full bg-emerald-400/25 blur-xl"
              initial={{ width: 30, height: 30, opacity: 0 }}
              animate={{
                width: [30, 110, 80],
                height: [30, 110, 80],
                opacity: [0, 0.6, 0.2],
              }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            />

            {/* Expanding outline green ring */}
            <motion.div
              className="absolute rounded-full border-2 border-emerald-400"
              initial={{ width: 42, height: 42, opacity: 0.9 }}
              animate={{
                width: [42, 118],
                height: [42, 118],
                opacity: [0.9, 0],
              }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            />

            {/* Central Success Badge */}
            <motion.div
              className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200 shadow-lg shadow-emerald-500/10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              {/* Animated SVG checkmark */}
              <svg
                className="h-7 w-7 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.15,
                    ease: "easeOut",
                  }}
                />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
