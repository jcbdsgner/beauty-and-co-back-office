"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Primitives du parcours « Équipe ». Mêmes briques de formulaire / liste que
// Fidélité et Services (`../fidelite/ui`) — réexportées ici pour un seul point
// d'import.

export {
  SectionCard,
  Divider,
  Toggle,
  SettingRow,
  TextInput,
  SelectField,
  EditableRow,
  EmptyList,
  btnPrimary,
  btnGhost,
} from "../fidelite/ui";
import { BackButton as SharedBackButton } from "../fidelite/ui";

export function BackButton({
  onClick,
  label = "Équipe",
}: {
  onClick: () => void;
  label?: string;
}) {
  return <SharedBackButton onClick={onClick} label={label} />;
}

// Case à cocher « pilule » — sélection multiple de rôles / salons. Grammaire des
// `Pills` de point-de-vente : sélectionnée = `btn-primary` + coche, sinon contour.
export function CheckPill({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "btn btn-sm gap-1.5 font-medium normal-case",
        checked
          ? "btn-primary"
          : "btn-outline border-base-300 text-base-content/70 hover:!bg-base-200 hover:!text-base-content",
      )}
    >
      {checked && <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={3} />}
      {children}
    </button>
  );
}

// Avatar (photo, sinon initiales) — même rendu dans la liste et sur la fiche.
export function Avatar({
  initials,
  photo,
  size = "md",
}: {
  initials: string;
  photo?: string;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg"
      ? "h-14 w-14 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-10 w-10 text-sm";
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" className={`shrink-0 rounded-full object-cover ${cls}`} />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-secondary ${cls}`}
    >
      {initials}
    </span>
  );
}
