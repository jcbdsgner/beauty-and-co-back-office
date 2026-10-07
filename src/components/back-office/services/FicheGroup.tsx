"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Grammaire de la fiche prestation (refonte 2026-10-07) : des blocs titrés,
// chaque réglage sur une ligne « libellé → valeur → action ». La manager lit la
// règle et son état d'un coup d'œil, sans paragraphe d'explication — même
// principe que `reglages/kit` (SettingsGroup / SettingsRow).

export function FicheGroup({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-white">
      <header className="flex min-h-12 items-center justify-between gap-4 border-b border-base-300 bg-base-200/70 px-5 py-2.5">
        <h3 className="text-[15px] font-semibold text-base-content">
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-2 font-normal tabular-nums text-base-content/50">{count}</span>
          )}
        </h3>
        {action}
      </header>
      <div className="divide-y divide-base-300">{children}</div>
    </section>
  );
}

// Une ligne de réglage : libellé à gauche, valeur / contrôle à droite.
export function FicheRule({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[176px_minmax(0,1fr)] items-start gap-x-6 px-5 py-3">
      <p className="flex min-h-9 items-center text-sm font-medium text-base-content">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// Valeur courante (à gauche) + action (à droite), sur la hauteur d'un contrôle.
export function RuleLine({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-4">
      <div className="min-w-0 text-sm text-base-content">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export const Muted = ({ children }: { children: ReactNode }) => (
  <span className="text-base-content/50">{children}</span>
);

export function AddLink({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-secondary transition hover:bg-accent",
        className,
      )}
    >
      <Plus aria-hidden className="size-4" />
      {children}
    </button>
  );
}
