"use client";

import { cn } from "@/lib/utils";

export type SegmentOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type SegmentedToggleProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  /** `sm` — compact (44px) for a page header, beside `Button size="sm"`. */
  size?: "default" | "sm";
  className?: string;
  /** Ajout back-office : nom accessible du groupe (ex. « Filtrer par salon »). */
  "aria-label"?: string;
};

/**
 * Rebuilt as a real segmented control — a sliding white thumb moves under the active segment
 * (CSS grid placement, no measurement/JS needed) rather than each segment just swapping its own
 * background. This is a *mode* switch (Services vs Produits: two entirely different catalogues),
 * so it needed to feel like a physical toggle you flip, not a filter chip you tap — which is
 * exactly what made it look identical to Pills before. Touch target: py-3 (44px).
 */
export function SegmentedToggle({ options, value, onChange, size = "default", className, "aria-label": ariaLabel }: SegmentedToggleProps) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const count = options.length;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("relative grid rounded-selector bg-[#efefef] p-1", className)}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-[calc(var(--radius-selector)-0.25rem)] bg-base-100 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-[left] duration-200 ease-out"
        // Le thumb se positionne sur la boîte de padding : on retire le p-1 des deux côtés pour
        // qu'il garde le même retrait de 4px à gauche/droite qu'en haut/bas.
        style={{
          left: `calc(0.25rem + ${index} * ((100% - 0.5rem) / ${count}))`,
          width: `calc((100% - 0.5rem) / ${count})`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-selector font-semibold whitespace-nowrap transition active:scale-[0.97] outline-none",
              size === "sm" ? "h-9 px-4 text-sm" : "h-12 px-5 text-[15px]",
              active ? "text-base-content" : "text-base-content/55 hover:text-base-content/80",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
