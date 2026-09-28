import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/atoms/card";

type StatTileTone = "neutral" | "success" | "warning" | "info" | "error";

const TONE_CLASS: Record<StatTileTone, string> = {
  neutral: "text-base-content",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  error: "text-error",
};

type StatTileProps = {
  value: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
  tone?: StatTileTone;
  /** Optional line under the number (a trend, a breakdown). */
  hint?: string;
  className?: string;
};

/** Label leads (small, uppercase), the figure sits below in Poppins semibold at display scale, tabular
 *  digits so it doesn't jitter when it recomputes. */
export function StatTile({ value, label, icon, tone = "neutral", hint, className }: StatTileProps) {
  return (
    <Card className={cn("flex flex-col gap-1 p-5", className)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-base-content/55 uppercase">
        {icon}
        {label}
      </p>
      <p className={cn("font-[family-name:var(--font-heading)] font-semibold text-[2.25rem] leading-none tabular-nums", TONE_CLASS[tone])}>{value}</p>
      {hint && <p className="text-xs text-base-content/45">{hint}</p>}
    </Card>
  );
}

type StatTileRowProps = {
  children: React.ReactNode;
  className?: string;
};

export function StatTileRow({ children, className }: StatTileRowProps) {
  return <div className={cn("grid grid-cols-3 gap-3", className)}>{children}</div>;
}

export type StatBandItem = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: StatTileTone;
  href?: string;
  onClick?: () => void;
};

/**
 * A single card holding a row of hero figures split by hairlines — the "at a glance" band at the
 * head of Accueil and Récap des ventes. Each cell can be a link/button (tap-through to detail).
 */
export function StatBand({ items, className }: { items: StatBandItem[]; className?: string }) {
  return (
    <Card className={cn("grid divide-x divide-border overflow-hidden", className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item, i) => {
        const inner = (
          <>
            <p className="text-xs font-semibold tracking-wide text-base-content/55 uppercase">{item.label}</p>
            <p className={cn("mt-1.5 font-[family-name:var(--font-heading)] font-semibold text-[2.5rem] leading-none tabular-nums", TONE_CLASS[item.tone ?? "neutral"])}>
              {item.value}
            </p>
            {item.hint && <p className="mt-1 text-xs text-base-content/45">{item.hint}</p>}
          </>
        );
        const cls = "flex flex-col justify-center px-6 py-6 text-left transition";
        if (item.href) {
          return (
            <a key={i} href={item.href} className={cn(cls, "hover:bg-accent/40 active:bg-accent/60")}>
              {inner}
            </a>
          );
        }
        if (item.onClick) {
          return (
            <button key={i} type="button" onClick={item.onClick} className={cn(cls, "hover:bg-accent/40 active:bg-accent/60 outline-none focus-visible:bg-accent/40")}>
              {inner}
            </button>
          );
        }
        return (
          <div key={i} className={cls}>
            {inner}
          </div>
        );
      })}
    </Card>
  );
}
