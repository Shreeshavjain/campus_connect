"use client";

import { motion } from "motion/react";
import { AuthInteractionState } from "./LoginCharacterScene";

export interface StudentCharacterProps {
  state: AuthInteractionState;
  className?: string;
  isWalking?: boolean;
}

export default function StudentCharacter({ state, className = "", isWalking = false }: StudentCharacterProps) {
  // We use Framer Motion variants for all groups.
  const currentBodyState = isWalking ? "walking" : state;
  const currentHeadState = isWalking ? "idle" : state;

  const torsoVariants = {
    idle: { y: 0, rotate: 0 },
    walking: { 
      y: [0, -4, 0, -4, 0], // Torso bobs up when crossing legs
      rotate: [-2, 2, -2, 2, -2],
      transition: { repeat: Infinity, duration: 1, ease: "easeInOut" } 
    },
    success: { y: -8, transition: { type: "spring", bounce: 0.6 } }
  };

  const headVariants = {
    idle: { rotate: 0, x: 0, y: 0 },
    // Head counter-bobs to stay level against torso
    walking: { 
      y: [0, 4, 0, 4, 0], 
      rotate: [2, -2, 2, -2, 2],
      transition: { repeat: Infinity, duration: 1, ease: "easeInOut" } 
    },
    email_focus: { rotate: 8, x: -5, y: 2 },
    submitting: { rotate: 12, x: -3, y: 4 },
    success: { rotate: -15, y: -5, transition: { type: "spring", bounce: 0.5 } },
    error: { rotate: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } },
  };

  const backpackVariants = {
    idle: { y: 0, rotate: 0 },
    walking: { 
      y: [0, -3, 0, -3, 0], // Follows torso with slight delay
      rotate: [-3, 3, -3, 3, -3],
      transition: { repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.05 } 
    },
    success: { y: -5, transition: { type: "spring", bounce: 0.6, delay: 0.05 } }
  };

  const frontUpperArmVariants = {
    idle: { rotate: 0 },
    walking: { 
      rotate: [-25, 25], 
      transition: { repeat: Infinity, repeatType: "mirror", duration: 0.5, ease: "easeInOut" } 
    },
    success: { rotate: -160, transition: { type: "spring", bounce: 0.5 } },
  };

  const frontForearmVariants = {
    idle: { rotate: 0 },
    walking: { 
      rotate: [-15, 15], 
      transition: { repeat: Infinity, repeatType: "mirror", duration: 0.5, ease: "easeInOut" } 
    },
    success: { rotate: 0 },
  };

  const backArmVariants = {
    idle: { rotate: 0 },
    walking: { 
      rotate: [25, -25], 
      transition: { repeat: Infinity, repeatType: "mirror", duration: 0.5, ease: "easeInOut" } 
    },
    success: { rotate: 160, y: -10 },
  };

  const frontLegVariants = {
    idle: { rotate: 0, y: 0 },
    walking: { 
      rotate: [-35, 35], 
      y: [-2, 0, -2], 
      transition: { repeat: Infinity, repeatType: "mirror", duration: 0.5, ease: "easeInOut" } 
    },
    success: { y: -10, rotate: -20 },
  };

  const backLegVariants = {
    idle: { rotate: 0, y: 0 },
    walking: { 
      rotate: [35, -35], 
      y: [0, -2, 0], 
      transition: { repeat: Infinity, repeatType: "mirror", duration: 0.5, ease: "easeInOut" } 
    },
    success: { y: -5, rotate: 10 },
  };

  const eyeVariants = {
    idle: { scaleY: 1, x: 0 },
    email_focus: { scaleY: 1, x: -3 },
    password_focus: { scaleY: 1, x: 4 }, // Eyes look away
    submitting: { scaleY: 0.8, x: -2 },
    success: { scaleY: 0.2, y: 2 }, // Squinting/smiling
    error: { scaleY: 1.2, x: 0 },
  };

  return (
    <div className={`relative ${className}`}>
      <motion.svg
        viewBox="0 0 200 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        initial="idle"
      >
        {/* Shadow */}
        <motion.ellipse
          cx="100" cy="290" rx="40" ry="8"
          fill="rgba(0,0,0,0.1)"
          animate={isWalking ? { rx: [35, 45], opacity: [0.1, 0.15] } : { rx: 40, opacity: 0.1 }}
          // @ts-ignore
          transition={{ repeat: isWalking ? Infinity : 0, repeatType: "mirror", duration: 0.25 }}
        />

        {/* --- Back Elements --- */}
        {/* Back Arm (Slate) */}
        <motion.g
          style={{ originX: "100px", originY: "120px" }}
          variants={backArmVariants as any}
          animate={currentBodyState}
        >
          <path d="M100 120 Q120 160 110 200" stroke="#334155" strokeWidth="16" strokeLinecap="round" />
        </motion.g>

        {/* Back Leg (Slate) */}
        <motion.g
          style={{ originX: "100px", originY: "200px" }}
          variants={backLegVariants as any}
          animate={currentBodyState}
        >
          <path d="M100 200 Q110 240 100 280" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
          <path d="M90 280 H115 A 8 8 0 0 1 115 290 H90 A 8 8 0 0 1 90 280" fill="#f59e0b" />
        </motion.g>

        {/* Backpack Layer (Behind Torso, Independent Physics) */}
        <motion.g
          style={{ originX: "135px", originY: "150px" }}
          variants={backpackVariants as any}
          animate={currentBodyState}
        >
          {/* Bag Body */}
          <path d="M125 110 C155 110 165 130 165 160 C165 195 145 200 120 190" fill="#f59e0b" />
          {/* Straps/Detail */}
          <path d="M120 105 C145 105 145 130 145 130" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
          <path d="M165 155 L155 155" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
        </motion.g>

        {/* --- Torso Group --- */}
        <motion.g variants={torsoVariants as any} animate={currentBodyState} style={{ originX: "100px", originY: "150px" }}>
          {/* Hoodie Body */}
          <path d="M80 110 C90 100 110 100 120 110 C130 140 130 180 115 200 H85 C70 180 70 140 80 110 Z" fill="#4f46e5" />
          {/* Hoodie Strings */}
          <path d="M95 110 L95 130 M105 110 L105 125" stroke="#3730a3" strokeWidth="3" strokeLinecap="round" />

          {/* Head & Neck (Attached to Torso to inherit bob, but has counter-bob variants) */}
          <motion.g
            style={{ originX: "100px", originY: "100px" }}
            variants={headVariants as any}
            animate={currentHeadState}
          >
            <path d="M95 100 H105 V115 H95 Z" fill="#fcd34d" />
            <circle cx="100" cy="75" r="30" fill="#fde68a" />
            <path d="M70 75 C70 40 130 40 130 75 C125 55 75 55 70 75 Z" fill="#0f172a" />
            <path d="M68 65 C80 45 100 45 100 65" fill="#0f172a" />

            <motion.g variants={eyeVariants as any}>
              <circle cx="85" cy="75" r="4" fill="#0f172a" />
              <circle cx="105" cy="75" r="4" fill="#0f172a" />
            </motion.g>
            
            <motion.path 
              d="M90 90 Q100 95 105 88" 
              stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none"
              animate={
                state === "error" ? { d: "M90 92 Q100 88 105 92" } : 
                state === "success" ? { d: "M88 88 Q100 100 110 88" } : 
                { d: "M90 90 Q100 95 105 88" }
              }
            />
            <ellipse cx="80" cy="85" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
          </motion.g>

          {/* Front Arm (Articulated Hierarchy) - Attached to torso */}
          <motion.g
            style={{ originX: "90px", originY: "120px" }}
            variants={frontUpperArmVariants as any}
            animate={currentBodyState}
          >
            {/* Upper Arm Line */}
            <line x1="90" y1="120" x2="80" y2="160" stroke="#4338ca" strokeWidth="16" strokeLinecap="round" />
            
            {/* Forearm & Hand */}
            <motion.g
              style={{ originX: "80px", originY: "160px" }}
              variants={frontForearmVariants as any}
            >
              <line x1="80" y1="160" x2="85" y2="200" stroke="#4338ca" strokeWidth="16" strokeLinecap="round" />
              {/* Hand */}
              <circle cx="85" cy="200" r="10" fill="#fde68a" />
            </motion.g>
          </motion.g>
        </motion.g>

        {/* Front Leg (Slate) */}
        <motion.g
          style={{ originX: "90px", originY: "200px" }}
          variants={frontLegVariants as any}
          animate={currentBodyState}
        >
          <path d="M90 200 Q80 240 90 280" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" />
          <path d="M80 280 H105 A 8 8 0 0 1 105 290 H80 A 8 8 0 0 1 80 280" fill="#f59e0b" />
        </motion.g>
      </motion.svg>
    </div>
  );
}
