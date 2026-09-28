import { cn } from "@/lib/utils";

// Primitives de mise en page « Le Tableau » de point-de-vente
// (`components/ui/board.tsx`), reprises pour les écrans Clients et
// Rendez-vous (2026-09-28, point-de-vente fait autorité sur leur disposition).
// Mêmes gabarits, tokens du back-office : `--brand-taupe-muted` (#886666) =
// `primary`, `--board-groove` = `base-300`, `--brand-rose-soft` = `accent`.

/** Intitulé de section : capitales espacées, couleur de marque. */
export function Legend({
  children,
  className,
  size = "label",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "label" | "section";
}) {
  return (
    <span
      className={cn(
        "uppercase text-primary",
        size === "section" ? "text-lg font-medium leading-none tracking-[1.12px]" : "text-sm font-bold tracking-[0.08em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Région bordée avec son intitulé au-dessus (et, à droite, une petite action). */
export function Board({
  legend,
  legendRight,
  children,
  className,
}: {
  legend?: React.ReactNode;
  legendRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      {(legend || legendRight) && (
        <div className="mb-2 flex items-center justify-between gap-3 pl-1">
          {legend ? <Legend>{legend}</Legend> : <span />}
          {legendRight}
        </div>
      )}
      <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">{children}</div>
    </section>
  );
}

export function BoardEmpty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Legend>{title}</Legend>
      {hint && <p className="max-w-sm text-sm text-base-content/60">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Pastilles de filtre compactes (choix exclusif). */
export function ChipFilter({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-field px-3.5 text-[0.8rem] font-semibold transition active:scale-[0.97]",
              active
                ? "bg-primary text-primary-content"
                : "border border-base-300 bg-base-100 text-base-content/60 hover:bg-base-200",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={cn("tabular-nums", active ? "text-primary-content/60" : "text-base-content/40")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
