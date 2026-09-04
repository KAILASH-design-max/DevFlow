"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputGroupProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OtpInputGroup: React.FC<OtpInputGroupProps> = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleDigitChange = (index: number, char: string) => {
    const cleanChar = char.replace(/\D/g, "");
    if (!cleanChar) {
      // Clear current digit
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    const lastChar = cleanChar.slice(-1);
    const next = digits.slice();
    next[index] = lastChar;
    const combined = next.join("");
    onChange(combined);

    // Auto-focus next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and delete
        const next = digits.slice();
        next[index - 1] = "";
        onChange(next.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = digits.slice();
        next[index] = "";
        onChange(next.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 my-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i]}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono rounded-xl border transition-all shadow-sm outline-none ${
            hasError
              ? "border-red-500 bg-red-50/20 text-red-700 focus:ring-2 focus:ring-red-400"
              : digits[i]
              ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      ))}
    </div>
  );
};
