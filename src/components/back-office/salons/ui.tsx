"use client";

// Primitives du parcours « Salons » — mêmes briques que Fidélité / Services,
// réexportées pour un point d'import unique, + quelques dérivés d'affichage.

import type { SalonClosure, SalonConfig, Weekday } from "@/lib/mock/beautyandco";

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
  label = "Salons",
}: {
  onClick: () => void;
  label?: string;
}) {
  return <SharedBackButton onClick={onClick} label={label} />;
}

export const timeFieldClass =
  "input input-sm w-auto bg-base-100 text-sm";

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

// État d'ouverture d'un salon à une date, calculé sur la config LOCALE (l'écran
// édite en mémoire ; les helpers du mock lisent, eux, les fixtures figées).
export type SalonOpenState = "inactif" | "ouvert" | "ferme";

export function salonOpenState(
  config: SalonConfig,
  iso: string,
  closures: SalonClosure[],
): SalonOpenState {
  if (!config.active) return "inactif";
  const weekday = WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];
  if (config.hours[weekday].closed) return "ferme";
  const covered = closures.some(
    (c) =>
      iso >= c.from && iso <= c.to && (c.scope === "all" || c.scope === config.id),
  );
  return covered ? "ferme" : "ouvert";
}

// Prochaine fermeture exceptionnelle à venir pour ce salon.
export function nextClosure(
  config: SalonConfig,
  iso: string,
  closures: SalonClosure[],
): SalonClosure | null {
  return (
    closures
      .filter((c) => c.to >= iso && (c.scope === "all" || c.scope === config.id))
      .sort((a, b) => (a.from < b.from ? -1 : 1))[0] ?? null
  );
}

const posteCount = (config: SalonConfig) =>
  (config.postes.coiffure ?? 0) +
  (config.postes.esthetique ?? 0) +
  (config.postes.onglerie ?? 0);

// « 8 postes : 4 coiffure · 2 cabines · 2 onglerie »
export function posteSummary(config: SalonConfig): string {
  const n = posteCount(config);
  if (n === 0) return "Aucun poste — aucune réservation possible";
  const parts: string[] = [];
  if (config.postes.coiffure) parts.push(`${config.postes.coiffure} coiffure`);
  if (config.postes.esthetique)
    parts.push(
      `${config.postes.esthetique} cabine${config.postes.esthetique > 1 ? "s" : ""}`,
    );
  if (config.postes.onglerie) parts.push(`${config.postes.onglerie} onglerie`);
  return `${n} poste${n > 1 ? "s" : ""} : ${parts.join(" · ")}`;
}

export { posteCount };
