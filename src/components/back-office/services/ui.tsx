"use client";

// Primitives du parcours « Services ». Les briques de formulaire / liste éditable
// sont partagées avec Fidélité (`../fidelite/ui`) — même grammaire visuelle,
// réexportées ici pour que chaque panneau n'ait qu'un point d'import.

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
  label = "Services",
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
