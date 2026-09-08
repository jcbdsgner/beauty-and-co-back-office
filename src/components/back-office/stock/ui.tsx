"use client";

// Primitives du parcours « Stock » — mêmes briques que Fidélité / Services,
// réexportées pour un point d'import unique.

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
  label = "Stock",
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
