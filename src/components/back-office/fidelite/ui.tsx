"use client";

import React from "react";
import { ChevronDownIcon, TrashBinIcon } from "@/icons";

/* -------------------------------------------------------------- carte de section */

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="mt-1 max-w-xl text-theme-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export const Divider = () => <div className="-mx-6 border-t border-gray-100" />;

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

/* ------------------------------------------------------ ligne « libellé + contrôle » */

export function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        {description && (
          <p className="mt-0.5 text-theme-xs text-gray-500">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------- champs */

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  id,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  id?: string;
  inputMode?: "numeric" | "text";
}) {
  const autoId = id ?? `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={autoId} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
      </label>
      <input
        id={autoId}
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
      {hint && <p className="mt-1.5 text-theme-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  id?: string;
}) {
  const autoId = id ?? `s-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={autoId} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
      </label>
      <div className="relative">
        <select
          id={autoId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`${fieldClass} appearance-none pr-10`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- boutons */

export const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300";

export const btnGhost =
  "inline-flex items-center rounded-lg px-4 py-2.5 text-theme-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900";

/* -------------------------------- ligne d'une liste éditable (palier / récompense) */

export function EditableRow({
  title,
  subtitle,
  confirming,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
  deleteLabel,
}: {
  title: string;
  subtitle: string;
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <li className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">{title}</p>
        <p className="mt-0.5 text-theme-xs text-gray-500">{subtitle}</p>
      </div>
      {confirming ? (
        <span className="flex shrink-0 items-center gap-2 text-theme-xs">
          <span className="text-gray-500">Supprimer&nbsp;?</span>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="font-semibold text-error-600 hover:underline"
          >
            Oui
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="font-medium text-gray-500 hover:underline"
          >
            Non
          </button>
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={onAskDelete}
            aria-label={deleteLabel}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
          >
            <TrashBinIcon className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}

/* -------------------------------------------------------------- état vide de liste */

export function EmptyList({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-theme-sm text-gray-500">
      {children}
    </p>
  );
}
