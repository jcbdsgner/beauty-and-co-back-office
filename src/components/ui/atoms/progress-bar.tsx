"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "error";

const TONE_CLASS: Record<Tone, string> = {
  brand: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

type ProgressBarProps = {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
  label?: string;
};

/** Flat-fill determinate progress track. */
export function ProgressBar({ value, max = 100, tone = "brand", className, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <ProgressPrimitive.Root
      value={value}
      max={max}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-base-300", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out", TONE_CLASS[tone])}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
