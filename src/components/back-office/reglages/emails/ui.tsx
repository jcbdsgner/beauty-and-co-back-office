"use client";

import React from "react";
import { Card } from "@/components/ui/atoms/card";

// Primitives locales du panneau Emails — bâties sur les composants de
// point-de-vente depuis le 2026-09-27 (interrupteur et boutons partagés avec
// `../../fidelite/ui`).

export { Toggle, btnPrimary } from "../../fidelite/ui";

/* -------------------------------------------------------------- carte de section */

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-5">
        <div className="flex items-start gap-3">
          {icon && <span className="mt-0.5 text-base-content/45">{icon}</span>}
          <div>
            <h2 className="text-lg font-semibold text-base-content">{title}</h2>
            {description && (
              <p className="mt-1 max-w-xl text-sm text-base-content/60">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------------- champs */

export const fieldClass =
  "input w-full bg-base-100 text-[15px] disabled:bg-base-200 disabled:text-base-content/40";

// Petit select stylé (unité de délai) — chevron superposé.
export function MiniSelect<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="select select-sm w-24 bg-base-100 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------------------------------------------------------------------- boutons */

// Bouton secondaire bordé — `Button variant="outline"` de point-de-vente.
  export { btnOutline as btnGhost } from "../../fidelite/ui";
