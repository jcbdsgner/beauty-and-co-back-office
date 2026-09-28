// Palette d'accent par praticienne — un identifiant visuel (pas la couleur de
// marque) pour repérer une même personne d'un coup d'œil sur le Planning et
// l'Agenda des rendez-vous : bordure de ligne, avatar, pastille de créneau.
// Indépendant du barrel : importer directement `@/lib/mock/staff-colors`.
//
// Assignée par POSITION dans l'équipe planifiable (ordre de `members`), pas
// par hash du nom : stable tant que l'équipe n'est pas réordonnée, et deux
// praticiennes voisines dans la liste ne se retrouvent jamais avec la même
// teinte par malchance de hash.

import { members, type Member } from "./staff";

export type StaffAccent = { bg: string; border: string; text: string; dot: string };

const PALETTE: StaffAccent[] = [
  { bg: "#feebe6", border: "#ef4444", text: "#b92819", dot: "#dc4632" }, // rouge
  { bg: "#e0f2f1", border: "#14b8a6", text: "#0d786e", dot: "#149688" }, // sarcelle
  { bg: "#edf6fb", border: "#49a4ca", text: "#1e6eaa", dot: "#3891cc" }, // bleu
  { bg: "#fff7e6", border: "#f59e0b", text: "#a0640a", dot: "#d99320" }, // ambre
  { bg: "#f3e8ff", border: "#8b5cf6", text: "#6432b9", dot: "#7c50d2" }, // violet
  { bg: "#fde2eb", border: "#ec4899", text: "#aa1e55", dot: "#d23c78" }, // rose
  { bg: "#dcfce7", border: "#22c55e", text: "#168048", dot: "#22a05a" }, // vert
  { bg: "#f1f4f5", border: "#778d9c", text: "#414b82", dot: "#5a69a0" }, // ardoise
];

// Ordre stable : praticiennes actives, dans l'ordre du fichier `staff.ts`.
const ORDERED_PRACTITIONERS: Member[] = members.filter(
  (m) => m.active && m.roles.includes("praticienne"),
);

const INDEX_BY_ID = new Map<string, number>(ORDERED_PRACTITIONERS.map((m, i) => [m.id, i]));
const INDEX_BY_FULLNAME = new Map<string, number>(
  ORDERED_PRACTITIONERS.map((m, i) => [`${m.firstName} ${m.lastName}`, i]),
);

export function staffAccent(index: number): StaffAccent {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

export function accentForMemberId(memberId: string): StaffAccent {
  return staffAccent(INDEX_BY_ID.get(memberId) ?? 0);
}

// Le rendez-vous ne référence une praticienne que par son nom complet
// (`RdvPrestation.staff: string | null`) — résolution par nom.
export function accentForStaffName(name: string | null): StaffAccent {
  if (name === null) return { bg: "#fff7e6", border: "#f79009", text: "#a0640a", dot: "#f79009" }; // aucune praticienne disponible (conflit) — ton warning
  return staffAccent(INDEX_BY_FULLNAME.get(name) ?? 0);
}
