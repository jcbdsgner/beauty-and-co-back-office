// Adaptateur entre les données du back-office et l'écran Planning copié de
// point-de-vente (`components/planning/`). Point-de-vente lit un store
// (`Praticienne`, `Shift[]`, `RendezVousRow`) ; ici, la même grammaire est
// dérivée de `@/lib/mock/staff` (équipe), `@/lib/mock/planning` (présence
// jour par jour, absences et ajustements du `PlanningContext`) et
// `@/lib/mock/rendezvous` (une ligne par prestation, rattachée à SA
// praticienne — `RdvPrestation.staff` ne porte qu'un nom complet).

import { isClosed, salons, type SalonId } from "@/lib/mock/beautyandco";
import { addDays, presenceFor, type PlanningData } from "@/lib/mock/planning";
import { timeToMinutes, minutesToTime, type RdvDetail, type RdvPrestation } from "@/lib/mock/rendezvous";
import { fullName, members, type Member } from "@/lib/mock/staff";

/** Heures du salon (trame `standardHours` de `beautyandco.ts`) — la grille court de
 *  l'ouverture à 21h, la tranche après fermeture grisée « Fermé » (même principe que
 *  point-de-vente, ADR 0036 là-bas). */
export const SALON_OPENING = "10:00";
export const SALON_CLOSING = "20:00";
export const GRID_END = "21:00";

export { timeToMinutes, minutesToTime };

export type Shift = { start: string; end: string; salonId: SalonId };

/** Une prestation positionnée dans le Planning — l'équivalent de `RendezVousRow`. */
export type PlanningRow = {
  key: string;
  rdv: RdvDetail;
  prestation: RdvPrestation;
  dateIso: string;
  salonId: SalonId;
  start: string;
  durationMin: number;
  staffId: string | null;
  secondStaffId: string | null;
};

const idByName = new Map(members.map((m) => [fullName(m), m.id]));

export function planningRows(list: RdvDetail[]): PlanningRow[] {
  return list
    .filter((r) => r.status !== "annulé")
    .flatMap((rdv) =>
      rdv.prestations.map((p) => ({
        key: `${rdv.id}-${p.id}`,
        rdv,
        prestation: p,
        dateIso: rdv.date.slice(0, 10),
        salonId: rdv.salon,
        start: p.start,
        durationMin: p.durationMin,
        staffId: p.staff ? (idByName.get(p.staff) ?? null) : null,
        secondStaffId: p.secondStaff ? (idByName.get(p.secondStaff) ?? null) : null,
      })),
    );
}

export const rowEnd = (r: PlanningRow) => minutesToTime(timeToMinutes(r.start) + r.durationMin);

/** Plage du jour d'un membre : sa présence résolue (absence > ajustement > trame
 *  habituelle), d'un seul tenant. Absente ou en repos → aucune plage. */
export function shiftsFor(memberId: string, iso: string, data: PlanningData): Shift[] {
  const p = presenceFor(memberId, iso, data);
  if (p.state !== "present") return [];
  return [{ start: p.start, end: p.end, salonId: p.salonId }];
}

export function absenceLabel(memberId: string, iso: string, data: PlanningData): string | null {
  const p = presenceFor(memberId, iso, data);
  return p.state === "absent" ? "Absente" : null;
}

/** Salons où un membre travaille au moins un jour de la semaine commençant `monday`. */
export function salonsOfWeek(memberId: string, monday: string, data: PlanningData): SalonId[] {
  const ids = new Set<SalonId>();
  for (let i = 0; i < 7; i++) shiftsFor(memberId, addDays(monday, i), data).forEach((s) => ids.add(s.salonId));
  return [...ids];
}

export const salonLabel = (id: SalonId) => salons.find((s) => s.id === id)?.name ?? "Autre salon";
/** « À Sea Plaza » / « Aux Almadies ». */
export const atSalonLabel = (id: SalonId) => (id === "almadies" ? "Aux Almadies" : `À ${salonLabel(id)}`);

export { isClosed };

/** Équipe planifiable, comme point-de-vente : coiffeurs, puis esthéticiens, puis ménage
 *  (la caisse / l'accueil et la manager n'y figurent pas). Ordre de `staff.ts` à
 *  l'intérieur d'un métier. */
const METIER_RANK: Record<Member["category"], number> = { coiffure: 0, esthetique: 1, staff: 2 };
export const schedulableMembers = (): Member[] =>
  members
    .filter((m) => m.active && (m.roles.includes("praticienne") || m.roles.includes("menage")))
    .sort((a, b) => METIER_RANK[a.category] - METIER_RANK[b.category]);

export const formatHour = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

/* ---------------------------------------------------------------- dates */

export const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dateOf = (iso: string) => new Date(`${iso}T00:00:00`);
