/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useRef, useState } from "react";
import { Control, Controller } from "react-hook-form";
import { Box, InputBase } from "@mui/material";

const DIGIT_COUNT = 6;

export interface VerificationCodeInputProps {
  name: string;
  control: Control<any>;
  onComplete?: () => void;
  disabled?: boolean;
  inputClassName?: string;
  containerClassName?: string;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  name,
  control,
  onComplete,
  disabled = false,
  inputClassName = "",
  containerClassName = "",
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < DIGIT_COUNT) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, value: string, currentDigits: string[], onChange: (value: string) => void) => {
      const char = value.replace(/\D/g, "").slice(-1);
      if (char === "" && value === "") {
        const next = [...currentDigits];
        next[index] = "";
        onChange(next.join(""));
        return;
      }
      if (char === "") return;

      const next = [...currentDigits];
      next[index] = char;
      const combined = next.join("");
      onChange(combined);

      if (index < DIGIT_COUNT - 1) {
        focusInput(index + 1);
      } else {
        if (combined.length === DIGIT_COUNT && onComplete) {
          setTimeout(() => onComplete(), 0);
        }
      }
    },
    [focusInput, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent, currentDigits: string[], onChange: (value: string) => void) => {
      if (e.key === "Backspace" && !currentDigits[index] && index > 0) {
        e.preventDefault();
        const next = [...currentDigits];
        next[index - 1] = "";
        onChange(next.join(""));
        focusInput(index - 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < DIGIT_COUNT - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, currentDigits: string[], onChange: (value: string) => void) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
      if (!pasted) return;
      const next = pasted.split("");
      while (next.length < DIGIT_COUNT) next.push("");
      const combined = next.slice(0, DIGIT_COUNT).join("");
      onChange(combined);
      const lastFilled = Math.min(pasted.length, DIGIT_COUNT) - 1;
      focusInput(lastFilled);
      if (combined.length === DIGIT_COUNT && onComplete) {
        setTimeout(() => onComplete(), 0);
      }
    },
    [focusInput, onComplete]
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => {
        const str = typeof value === "string" ? value : "";
        const digits = str.split("").concat(Array(DIGIT_COUNT).fill("")).slice(0, DIGIT_COUNT);

        return (
          <Box
            className={containerClassName}
            sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "nowrap" }}
          >
            {Array.from({ length: DIGIT_COUNT }, (_, i) => (
              <InputBase
                key={i}
                inputRef={(el) => {
                  inputRefs.current[i] = el;
                }}
                inputProps={{
                  maxLength: 1,
                  "aria-label": `Digit ${i + 1}`,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  "data-testid": `verification-digit-${i}`,
                }}
                value={digits[i]}
                onChange={(e) => handleChange(i, e.target.value, digits, onChange)}
                onKeyDown={(e) => handleKeyDown(i, e, digits, onChange)}
                onPaste={(e) => handlePaste(e, digits, onChange)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                disabled={disabled}
                className={inputClassName}
                sx={{
                  width: 56,
                  height: 56,
                  textAlign: "center",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 1.5,
                  "& .MuiInputBase-input": {
                    textAlign: "center",
                    "&::placeholder": {
                      opacity: 0.6,
                    },
                  },
                  "&.Mui-focused": {
                    borderColor: "primary.main",
                    outline: "none",
                  },
                }}
                placeholder="-"
              />
            ))}
          </Box>
        );
      }}
    />
  );
};
