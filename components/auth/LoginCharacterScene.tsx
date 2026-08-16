"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import StudentCharacter from "./StudentCharacter";

export type AuthInteractionState =
  | "idle"
  | "email_focus"
  | "password_focus"
  | "submitting"
  | "success"
  | "error";

interface LoginCharacterSceneProps {
  state: AuthInteractionState;
  isMobile?: boolean;
}

export default function LoginCharacterScene({ state, isMobile = false }: LoginCharacterSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsEntering(false);
      return;
    }

    // Desktop entrance is 1.6s of travel + 0.3s of deceleration/settle (total 1.9s)
    // Mobile entrance is a quick 0.6s
    const duration = isMobile ? 600 : 1600;
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [isMobile, prefersReducedMotion]);

  if (isMobile) {
    return (
      <div className="relative w-full flex justify-center mt-[-20px] mb-[-40px] pointer-events-none z-10">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none"
        >
          <StudentCharacter 
            state={state} 
            isWalking={false} 
            className="w-32 h-44 drop-shadow-lg scale-90 origin-bottom"
          />
        </motion.div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="absolute bottom-0 right-10 pointer-events-none z-20 flex items-end justify-center overflow-visible w-48">
      <motion.div
        initial={prefersReducedMotion ? { x: 0, opacity: 1 } : { x: "50vw", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        // 1.6s for the main walk, easeOutExpo handles the 1.6-1.9s deceleration naturally
        transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none"
      >
        <StudentCharacter 
          state={state} 
          isWalking={isEntering} 
          className="w-48 h-64 drop-shadow-xl"
        />
      </motion.div>
    </div>
  );
}
