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
import { BackButton as SharedBackButton } from "../fidelite/ui";

export function BackButton({
  onClick,
  label = "Stock",
}: {
  onClick: () => void;
  label?: string;
}) {
  return <SharedBackButton onClick={onClick} label={label} />;
}
