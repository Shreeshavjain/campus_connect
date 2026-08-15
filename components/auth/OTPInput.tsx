"use client";

import {
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";

interface OTPInputProps {
  /** Current 6-char OTP value (may contain empty strings) */
  value: string[];
  /** Called when any digit changes */
  onChange: (value: string[]) => void;
  /** Disable all inputs */
  disabled?: boolean;
  /** Index that should receive focus (controlled externally) */
  focusIndex?: number;
  /** Called when a specific index gains focus */
  onFocusChange?: (index: number) => void;
  /** Whether there's an error state */
  hasError?: boolean;
}

const OTP_LENGTH = 6;

export default function OTPInput({
  value,
  onChange,
  disabled = false,
  focusIndex,
  onFocusChange,
  hasError = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the requested index when focusIndex changes
  useEffect(() => {
    if (focusIndex !== undefined && focusIndex >= 0 && focusIndex < OTP_LENGTH) {
      inputRefs.current[focusIndex]?.focus();
    }
  }, [focusIndex]);

  const focusInput = useCallback(
    (index: number) => {
      if (index >= 0 && index < OTP_LENGTH) {
        inputRefs.current[index]?.focus();
        onFocusChange?.(index);
      }
    },
    [onFocusChange]
  );

  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Only accept the last typed digit (in case of double-input race)
      const digit = raw.replace(/\D/g, "").slice(-1);

      if (!digit) return;

      const next = [...value];
      next[index] = digit;
      onChange(next);

      // Advance focus
      if (index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
    },
    [value, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Backspace":
          e.preventDefault();
          if (value[index]) {
            // Clear current digit
            const next = [...value];
            next[index] = "";
            onChange(next);
          } else if (index > 0) {
            // Move to previous and clear it
            const next = [...value];
            next[index - 1] = "";
            onChange(next);
            focusInput(index - 1);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (index > 0) focusInput(index - 1);
          break;

        case "ArrowRight":
          e.preventDefault();
          if (index < OTP_LENGTH - 1) focusInput(index + 1);
          break;

        case "Delete":
          e.preventDefault();
          if (value[index]) {
            const next = [...value];
            next[index] = "";
            onChange(next);
          }
          break;

        default:
          // Reject non-numeric (but allow Tab, etc.)
          if (e.key.length === 1 && !/\d/.test(e.key)) {
            e.preventDefault();
          }
          break;
      }
    },
    [value, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

      if (!pasted) return;

      const next = [...value];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      onChange(next);

      // Focus the next empty slot, or the last filled
      const nextEmpty = next.findIndex((d) => !d);
      focusInput(nextEmpty >= 0 ? nextEmpty : OTP_LENGTH - 1);
    },
    [value, onChange, focusInput]
  );

  const handleFocus = useCallback(
    (index: number) => {
      // Select the digit text on focus for easy overwrite
      inputRefs.current[index]?.select();
      onFocusChange?.(index);
    },
    [onFocusChange]
  );

  return (
    <div
      className="flex items-center justify-center"
      role="group"
      aria-label="One-time password input"
    >
      <div
        className="flex gap-[clamp(6px,1.8vw,10px)]"
        style={{ touchAction: "manipulation" }}
      >
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(i)}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            aria-invalid={hasError}
            className={`
              w-[clamp(38px,11.5vw,52px)] h-[clamp(46px,13.5vw,60px)]
              rounded-xl border-2 bg-white
              text-center text-xl sm:text-2xl font-bold text-slate-800
              outline-none transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                hasError
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              }
              ${value[i] ? "border-slate-300 bg-slate-50" : ""}
            `}
            style={{
              caretColor: "transparent",
              WebkitAppearance: "none",
              MozAppearance: "textfield",
            }}
          />
        ))}
      </div>
    </div>
  );
}
