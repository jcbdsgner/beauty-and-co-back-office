"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export type RadioOption = { value: string; label: string; hint?: string };

type RadioGroupProps = {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/**
 * Each option is its own full-width pressable card, not just a small dot with text next to it —
 * a single-choice list (payment method, delivery option) benefits from a large, unambiguous
 * target per row on a touch counter, and the selected row's whole surface changing color (not
 * just the dot) makes the choice readable from arm's length.
 */
export function RadioGroup({ options, value, onChange, className }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root value={value} onValueChange={onChange} className={cn("flex flex-col gap-2", className)}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-field border p-4 transition active:scale-[0.99]",
              active
                ? "border-secondary bg-accent"
                : "border-border bg-white",
            )}
          >
            <RadioGroupPrimitive.Item
              value={option.value}
              className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-base-content/30 transition data-[state=checked]:border-secondary outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
            >
              <RadioGroupPrimitive.Indicator className="size-3 rounded-full bg-secondary" />
            </RadioGroupPrimitive.Item>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-base-content">{option.label}</span>
              {option.hint && <span className="block text-xs text-base-content/55">{option.hint}</span>}
            </span>
          </label>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
