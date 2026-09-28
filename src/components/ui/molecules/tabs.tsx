"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export type TabItem = { value: string; label: string; content: React.ReactNode };

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/**
 * Rebuilt as an underline tab bar — text + a taupe underline on the active item, sitting on a
 * hairline rule. A page switcher (owns real panel content, e.g. Répertoire/Relances/Campagnes/
 * Styles) needs to read as navigation, not as a filter you could also mistake for Pills or a
 * mode-switch you could mistake for SegmentedToggle — three different jobs, three different
 * shapes now. min-h-11 keeps each trigger a real touch target despite the leaner visual weight.
 */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onChange} className={cn("flex flex-col gap-5", className)}>
      <TabsPrimitive.List className="flex items-center gap-6 overflow-x-auto border-b border-base-300">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              "relative flex min-h-14 shrink-0 items-center px-1 pb-3 text-[15px] font-semibold whitespace-nowrap text-base-content/55 transition",
              "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors",
              "data-[state=active]:text-base-content data-[state=active]:after:bg-primary",
              "active:opacity-70 outline-none focus-visible:text-base-content",
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content key={item.value} value={item.value} className="focus:outline-none">
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
