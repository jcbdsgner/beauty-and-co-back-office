"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

type PopoverProps = {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
};

/** Anchored floating panel for a trigger element — a filter panel, a "..." actions menu, a mini date picker. */
export function Popover({ trigger, children, align = "start", className }: PopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          className={cn(
            "z-50 rounded-box border border-base-300 bg-white p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.1)] focus:outline-none",
            className,
          )}
        >
          {children}
          <PopoverPrimitive.Arrow className="fill-white" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
