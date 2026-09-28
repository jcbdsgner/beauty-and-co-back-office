"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { buttonVariants } from "@/components/ui/atoms/button";
import { cn } from "@/lib/utils";

// Grammaire commune de l'écran Réglages (refonte 2026-09-28) :
// - `SettingsGroup` : un bloc blanc, un titre, des lignes séparées par un filet ;
// - `SettingsRow` : libellé + aide à gauche, contrôle à droite — on lit la
//   question, on voit la réponse, sans chercher le champ sous le texte ;
// - `SaveBar` : une seule barre d'enregistrement par section, qui n'apparaît
//   qu'en cas de modification (plus de bouton « Enregistrer » grisé en pied de
//   chaque carte) ;
// - `ItemRow` + `EditorPanel` : les listes (paliers, récompenses, forfaits,
//   packs) restent lisibles, l'ajout / la modification s'ouvre en panneau
//   latéral, la grammaire des fiches du reste de l'app.

export const btnBrand = buttonVariants({ variant: "brand", size: "sm" });
export const btnOutline = buttonVariants({ variant: "outline", size: "sm" });

/* ------------------------------------------------------------------ bloc */

export function SettingsGroup({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-base-100">
      <header className="flex items-start justify-between gap-6 px-6 pb-4 pt-5">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-base-content">{title}</h3>
          {description && (
            <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-base-content/60">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="divide-y divide-base-300 border-t border-base-300">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ ligne */

export function SettingsRow({
  label,
  help,
  htmlFor,
  children,
  wide = false,
  muted = false,
}: {
  label: string;
  help?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  /** Contrôle large (champ, menu) plutôt qu'un interrupteur. */
  wide?: boolean;
  /** Ligne sans effet tant qu'un réglage parent est coupé. */
  muted?: boolean;
}) {
  const Label = htmlFor ? "label" : "p";
  return (
    <div
      className={cn(
        "grid items-center gap-x-10 gap-y-2 px-6 py-4 transition-opacity",
        wide ? "grid-cols-[minmax(0,1fr)_300px]" : "grid-cols-[minmax(0,1fr)_auto]",
        muted && "opacity-50",
      )}
    >
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="block text-[15px] font-medium text-base-content">
          {label}
        </Label>
        {help && <p className="mt-0.5 text-sm leading-relaxed text-base-content/60">{help}</p>}
      </div>
      <div className={cn("min-w-0", wide ? "w-full" : "justify-self-end")}>{children}</div>
    </div>
  );
}

/* --------------------------------------------------------- champ + unité */

export function UnitInput({
  id,
  value,
  onChange,
  unit,
  invalid,
  disabled,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-field border bg-base-100 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#fdcfca]",
        invalid ? "border-error-500" : "border-base-300",
        disabled && "bg-base-200",
      )}
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] tabular-nums text-base-content outline-none placeholder:text-base-content/40 disabled:cursor-not-allowed"
      />
      {unit && <span className="shrink-0 pr-3.5 text-sm text-base-content/55">{unit}</span>}
    </div>
  );
}

/* ------------------------------------------------ barre d'enregistrement */

export function SaveBar({
  dirty,
  onSave,
  onReset,
  blocked,
}: {
  dirty: boolean;
  onSave: () => void;
  onReset: () => void;
  /** Motif qui empêche d'enregistrer (champ invalide). */
  blocked?: string | null;
}) {
  if (!dirty) return null;
  return (
    <div className="sticky bottom-5 z-10 mt-6 flex items-center gap-4 rounded-box bg-neutral px-5 py-3 text-neutral-content shadow-[0_12px_32px_-12px_rgba(58,45,45,0.55)] animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <p className="min-w-0 flex-1 text-sm">
        {blocked ? (
          <span className="text-[#fdcfca]">{blocked}</span>
        ) : (
          "Modifications non enregistrées"
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="btn btn-ghost btn-sm normal-case text-[15px] font-semibold text-neutral-content/80 hover:bg-white/10 hover:text-neutral-content"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={Boolean(blocked)}
        className="btn btn-sm normal-case border-none bg-base-100 text-[15px] font-semibold text-base-content hover:bg-accent disabled:!bg-white/20 disabled:!text-neutral-content/50"
      >
        Enregistrer
      </button>
    </div>
  );
}

// Confirmation discrète après un enregistrement, à placer sous la section.
export function SavedNote({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="mt-4 text-sm font-medium text-success-700">
      Réglages enregistrés.
    </p>
  );
}

/* ------------------------------------------------------ liste éditable */

export function ItemRow({
  title,
  lead,
  meta,
  columns,
  onEdit,
  onDelete,
  deleteLabel,
}: {
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  /** Valeurs alignées à droite (seuil, prix…), en chiffres tabulaires. */
  columns?: ReactNode[];
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-base-200/60">
      {lead && <div className="shrink-0">{lead}</div>}
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-medium text-base-content">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-sm text-base-content/55">{meta}</span>}
      </button>
      {columns?.map((c, i) => (
        <div key={i} className="w-40 shrink-0 whitespace-nowrap text-right text-sm tabular-nums text-base-content/80">
          {c}
        </div>
      ))}
      {confirming ? (
        <div className="flex w-[152px] shrink-0 items-center justify-end gap-1 text-sm">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-field px-2.5 py-1.5 font-semibold text-error-600 hover:bg-error-50"
          >
            Supprimer
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-field px-2.5 py-1.5 font-medium text-base-content/60 hover:bg-base-200"
          >
            Non
          </button>
        </div>
      ) : (
        <div className="flex w-[152px] shrink-0 items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Modifier — ${typeof title === "string" ? title : deleteLabel}`}
            className="btn btn-ghost btn-sm btn-square text-base-content/70"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={deleteLabel}
            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:bg-error-50 hover:text-error-600"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

// En-têtes de colonnes au-dessus d'une liste d'`ItemRow`.
export function ItemHeader({ label, columns }: { label: string; columns?: string[] }) {
  return (
    <div className="flex items-center gap-4 bg-base-200/60 px-6 py-2 text-xs font-medium text-base-content/55">
      <span className="flex-1">{label}</span>
      {columns?.map((c) => (
        <span key={c} className="w-40 shrink-0 text-right">
          {c}
        </span>
      ))}
      <span className="w-[152px] shrink-0" />
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-6 py-8 text-center text-sm text-base-content/55">{children}</p>;
}

/* ------------------------------------------------- panneau d'édition */

export function EditorPanel({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel,
  canSubmit,
  widthClassName = "max-w-xl",
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  canSubmit: boolean;
  widthClassName?: string;
  children: ReactNode;
}) {
  const id = `editor-${title.replace(/\W+/g, "-")}`;
  return (
    <Dialog open={open} onClose={onClose} variant="side" labelledBy={id} className={cn("flex flex-col", widthClassName)}>
      <header className="flex items-center justify-between gap-4 border-b border-base-300 px-6 py-4">
        <h2 id={id} className="text-lg font-semibold text-base-content">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="btn btn-ghost btn-sm btn-square text-base-content/60"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">{children}</div>
      <footer className="flex items-center justify-end gap-2 border-t border-base-300 px-6 py-4">
        <button type="button" onClick={onClose} className={btnOutline}>
          Annuler
        </button>
        <button type="button" onClick={onSubmit} disabled={!canSubmit} className={btnBrand}>
          {submitLabel}
        </button>
      </footer>
    </Dialog>
  );
}
