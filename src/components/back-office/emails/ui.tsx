"use client";

import React from "react";
import { ChevronDownIcon } from "@/icons";

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
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {description && (
              <p className="mt-1 max-w-xl text-theme-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------- interrupteur */

export function Toggle({
  checked,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand-500" : "bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-xs transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------------- champs */

export const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

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
        className="h-10 w-24 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* ---------------------------------------------------------------------- boutons */

export const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300";

export const btnGhost =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-theme-sm font-medium text-gray-700 transition hover:bg-gray-50";
