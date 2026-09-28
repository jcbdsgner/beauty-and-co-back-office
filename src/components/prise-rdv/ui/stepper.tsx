"use client";

import { cn } from "@/lib/prise-rdv/utils";

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 15 15" fill="none" className={cn("overflow-visible", className)}>
      <path d="M0.5 7.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 15 15" fill="none" className={cn("overflow-visible", className)}>
      <path
        d="M0.5 7.5H14.5M7.5 0.5V14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type StepperProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** Shared +/- counter, e.g. adult/child count (AttendeesDialog) or cycles to prepay (AbonnementDetailsDialog). */
export function Stepper({ label, hint, value, min, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-[17px] font-bold text-[var(--color-gray-800)]">{label}</p>
        {hint && <p className="text-[15px] text-[var(--color-gray-500)]">{hint}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Diminuer le nombre — ${label}`}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-2 border-[rgba(136,102,102,0.3)] text-[var(--brand-taupe-muted)] transition",
            "disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:border-[var(--brand-taupe-muted)]",
          )}
        >
          <MinusIcon className="size-4" />
        </button>
        <span className="w-4 text-center text-[17px] font-bold text-[var(--color-gray-800)]">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Augmenter le nombre — ${label}`}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-2 border-[rgba(136,102,102,0.3)] text-[var(--brand-taupe-muted)] transition",
            "disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:border-[var(--brand-taupe-muted)]",
          )}
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
