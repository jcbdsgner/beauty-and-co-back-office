import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PillOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
};

type PillsProps = {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** false → a single non-wrapping row that scrolls horizontally instead of stacking. */
  wrap?: boolean;
};

/**
 * Filter chips — exclusive choice over one list (catégories, rôles, statuts). daisyUI buttons:
 * the selected one is a solid `btn-primary` carrying its own check mark; the rest are
 * `btn-outline`. 56px tap height.
 */
export function Pills({ options, value, onChange, className, wrap = true }: PillsProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        wrap ? "flex-wrap" : "flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "btn btn-md gap-1.5 font-medium",
              active ? "btn-primary" : "btn-outline border-base-300 text-base-content/70 hover:!bg-base-200 hover:!text-base-content",
            )}
          >
            {active ? <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={3} /> : option.icon}
            {option.label}
            {typeof option.count === "number" && (
              <span className={cn("text-xs", active ? "text-primary-content/60" : "text-base-content/40")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
