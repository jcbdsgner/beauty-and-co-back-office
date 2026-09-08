"use client";

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

export function BackButton({
  onClick,
  label = "Équipe",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex items-center gap-1.5 text-theme-sm text-gray-500 transition hover:text-gray-700"
    >
      ← {label}
    </button>
  );
}

// Case à cocher « pilule » — sélection multiple de rôles / salons.
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
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-theme-sm font-medium transition ${
        checked
          ? "border-brand-400 bg-brand-50 text-brand-700"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border ${
          checked ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300"
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

// Avatar initiales — même rendu dans la liste et sur la fiche.
export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "h-14 w-14 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-theme-xs"
        : "h-10 w-10 text-theme-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 ${cls}`}
    >
      {initials}
    </span>
  );
}
