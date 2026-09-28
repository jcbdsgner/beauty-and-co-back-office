"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { TrashBinIcon } from "@/icons";
import { Card } from "@/components/ui/atoms/card";
import { Switch } from "@/components/ui/atoms/switch";
import { TextInput as PdvTextInput } from "@/components/ui/atoms/text-input";
import { Select } from "@/components/ui/atoms/select";
import { Field } from "@/components/ui/molecules/field";
import { buttonVariants } from "@/components/ui/atoms/button";
import { cn } from "@/lib/utils";

// Primitives de formulaire / liste éditable partagées par Fidélité, Services,
// Équipe, Stock et Salons. Depuis le 2026-09-27, bâties sur les composants de
// point-de-vente (`@/components/ui/atoms|molecules`) — mêmes API qu'avant pour
// les consommateurs.

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
    <Card>
      <div className="border-b border-base-300 px-6 py-5">
        <h2 className="text-lg font-semibold text-base-content">{title}</h2>
        {description && (
          <p className="mt-1 max-w-xl text-sm text-base-content/60">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

export const Divider = () => <div className="-mx-6 border-t border-base-300" />;

/* ------------------------------------------------------------------- interrupteur */

// `Switch` de point-de-vente ; sa zone de clic de 56px (caisse tactile) est
// ramenée à la piste elle-même (`size-auto`), poste desktop à la souris.
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
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      label={ariaLabel ?? ""}
      className="size-auto"
      />
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
        <p className="text-sm font-medium text-base-content">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-base-content/55">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------- champs */

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
      <Field label={label}>
        <PdvTextInput
        id={autoId}
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      </Field>
      {hint && <p className="mt-1.5 text-xs text-base-content/55">{hint}</p>}
    </div>
  );
}

// Radix Select refuse `value=""` : une option vide passe par une sentinelle.
const EMPTY = "__vide__";

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  id?: string;
}) {
  return (
    <Field label={label}>
      <Select
        value={value === "" ? EMPTY : value}
        onChange={(v) => onChange((v === EMPTY ? "" : v) as T)}
        options={options.map((o) => ({ value: o.value === "" ? EMPTY : o.value, label: o.label }))}
      />
    </Field>
  );
}

/* ---------------------------------------------------------------------- boutons */

// Classes du `Button` de point-de-vente (daisyUI `btn`), pour les `<button>` /
// `<Link>` écrits à la main.
export const btnPrimary = buttonVariants({ variant: "brand", size: "sm" });

export const btnGhost = cn(
  "btn btn-ghost btn-sm normal-case text-[15px] font-semibold text-base-content/70 hover:text-base-content",
  "disabled:!bg-transparent disabled:!text-base-content/40",
  );

// Bouton secondaire bordé — `Button variant="outline"` de point-de-vente.
export const btnOutline = buttonVariants({ variant: "outline", size: "sm" });

/* --------------------------------------------------------- retour (flux pleine page) */

// Pastille bordée de point-de-vente (`BoardHeader` → `backHref`) : le libellé
// nomme la destination (« Équipe », « Stock »…), jamais un « Retour » générique.
export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex h-10 w-fit shrink-0 items-center gap-1.5 rounded-field border border-base-300 bg-white px-3.5 text-sm font-medium text-base-content/60 transition hover:bg-base-200 active:scale-[0.97]"
    >
      <ChevronLeft aria-hidden className="size-4" />
        {label}
    </button>
  );
}

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
    <li className="flex items-center gap-4 rounded-box border border-base-300 bg-base-100 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-base-content">{title}</p>
        <p className="mt-0.5 text-xs text-base-content/55">{subtitle}</p>
      </div>
      {confirming ? (
        <span className="flex shrink-0 items-center gap-2 text-xs">
          <span className="text-base-content/60">Supprimer&nbsp;?</span>
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
            className="font-medium text-base-content/60 hover:underline"
          >
            Non
          </button>
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-ghost btn-sm normal-case font-semibold text-base-content/70"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={onAskDelete}
            aria-label={deleteLabel}
            className="btn btn-ghost btn-sm btn-square text-base-content/45 hover:bg-error/10 hover:text-error"
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
    <p className="rounded-box border-2 border-dashed border-base-300 px-4 py-10 text-center text-sm text-base-content/55">
      {children}
    </p>
  );
}
