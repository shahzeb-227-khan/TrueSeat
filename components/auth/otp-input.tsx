"use client";

import { useRef } from "react";

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setDigit(index: number, char: string) {
    const clean = char.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(""));
    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text.padEnd(0, "").slice(0, length));
    const focusIndex = Math.min(text.length, length - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="mx-auto flex max-w-sm items-center justify-between gap-2 sm:gap-2.5">
      {digits.map((d, i) => {
        const filled = Boolean(d);
        const active = i === digits.findIndex((c) => !c);
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            disabled={disabled}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            inputMode="numeric"
            maxLength={1}
            placeholder="•"
            className={
              "otp-input h-14 w-11 rounded-lg text-center font-mono text-xl font-semibold transition-all focus:outline-none sm:h-14 sm:w-12 " +
              (filled
                ? "border-2 border-primary bg-surface-card-elevated text-primary shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : active
                  ? "border border-border-prominent bg-surface-canvas text-text-headline focus:border-primary"
                  : "border border-border-subtle bg-surface-canvas text-text-metadata placeholder:text-text-metadata/40 focus:border-primary")
            }
          />
        );
      })}
    </div>
  );
}
