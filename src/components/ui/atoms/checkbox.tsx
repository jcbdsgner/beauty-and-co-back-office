"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  "aria-label"?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * The whole row is the control (min-h-14, padded, presses with active:bg) — no bare square to
 * miss on a touchscreen. The box takes daisyUI's `checkbox` shape/size; Radix drives the checked
 * state.
 */
export function Checkbox({ checked, onChange, label, "aria-label": ariaLabel, id, disabled, className }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-field px-1 text-[15px] text-base-content transition",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer active:bg-base-200",
        className,
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        className={cn(
          "checkbox checkbox-primary size-7 shrink-0",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden className="size-4 text-primary-content" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label}
    </label>
  );
}
