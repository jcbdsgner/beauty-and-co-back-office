"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Radix Switch under the hood; the pressable area is a 56px square (the counter tap target) with
 * a daisyUI-style track centred inside it. Brand colour = on.
 */
export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "group relative flex size-14 shrink-0 items-center justify-center transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 outline-none",
        className,
      )}
    >
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          "bg-base-300 group-data-[state=checked]:bg-primary",
          "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary",
        )}
      >
        <SwitchPrimitive.Thumb className="absolute top-0.5 left-0.5 size-6 rounded-full bg-base-100 shadow transition-transform data-[state=checked]:translate-x-5" />
      </span>
    </SwitchPrimitive.Root>
  );
}
