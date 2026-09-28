"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "cream" | "rose-soft" | "white";
type Size = "field" | "compact";

const TONE_CLASS: Record<Tone, string> = {
  cream: "bg-base-200",
  "rose-soft": "bg-accent border-transparent",
  white: "bg-base-100",
};

const SIZE_CLASS: Record<Size, string> = {
  field: "input-md text-[15px]",
  compact: "input-sm text-sm",
};

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  tone?: Tone;
  size?: Size;
  disabled?: boolean;
  className?: string;
};

/**
 * Radix Select styled as a daisyUI `input`. Disabled options render struck-through with "· pris"
 * rather than disappearing. Menu rows are 56px tap targets.
 */
export function Select({ value, onChange, options, placeholder = "Sélectionner…", tone = "white", size = "field", disabled, className }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "input w-full items-center justify-between gap-2 text-left",
          "disabled:cursor-not-allowed disabled:opacity-40 data-[placeholder]:text-base-content/40",
          TONE_CLASS[tone],
          SIZE_CLASS[size],
          className,
        )}
      >
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate" placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-base-content/50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-xl"
        >
          <SelectPrimitive.Viewport className="max-h-72 p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-field px-3 text-[15px] text-base-content outline-none data-[highlighted]:bg-base-200 data-[state=checked]:font-semibold data-[disabled]:cursor-not-allowed data-[disabled]:text-base-content/40 data-[disabled]:line-through"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                  {option.disabled && " · pris"}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check aria-hidden className="size-4 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
