// Données fictives « Planning » — front-end uniquement, aucune API, aucune persistance.
// Indépendant du barrel `@/lib/mock` : importer directement `@/lib/mock/planning`.
//
// Planning ne décrit PAS des rendez-vous — il décrit la PRÉSENCE de l'équipe :
// qui travaille, où, quand, cette semaine. La trame de référence vient des
// horaires habituels de chaque membre (`staff.ts`) ; ce fichier ne porte que les
// EXCEPTIONS — absences (congé, repos, maladie, formation) et ajustements
// ponctuels d'horaire — puis les recoupe avec les heures d'ouverture et les
// fermetures exceptionnelles des salons (`beautyandco.ts`).
//
// Le comptage des rendez-vous par personne est superposé PAR L'ÉCRAN Planning :
// ce fichier n'importe rien de `rendezvous.ts`.

import {
  type SalonId,
  type SalonScope,
  type Weekday,
  WEEKDAYS,
  closuresFor,
  inScope,
  scopeIds,
  isClosed,
  salonName,
} from "./beautyandco";
import { type DayShift, type Member, members } from "./staff";

// Repère temporel figé pour la démo (aligné sur `beautyandco.ts`).
export const TODAY_ISO = "2026-09-03";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type AbsenceType = "conge" | "repos" | "maladie" | "formation";

export const ABSENCE_LABELS: Record<AbsenceType, string> = {
  conge: "Congé",
  repos: "Repos",
  maladie: "Maladie",
  formation: "Formation",
};

export const ABSENCE_TYPE_OPTIONS: { value: AbsenceType; label: string }[] = (
  ["conge", "repos", "maladie", "formation"] as AbsenceType[]
).map((value) => ({ value, label: ABSENCE_LABELS[value] }));

// Absence sur une plage de dates (bornes ISO incluses).
export type Absence = {
  id: string;
  memberId: string;
  from: string; // ISO yyyy-mm-dd
  to: string; // ISO yyyy-mm-dd
  type: AbsenceType;
  reason?: string;
};

// Ajustement ponctuel d'horaire pour un jour donné : remplace la trame habituelle
// (heure de début tardive, journée écourtée, renfort sur l'autre salon…).
// `off: true` (2026-09-28) = repos exceptionnel ce jour-là, sans motif d'absence
// (salonId / start / end sont alors ignorés).
export type ShiftOverride = {
  id: string;
  memberId: string;
  date: string; // ISO yyyy-mm-dd
  salonId: SalonId;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  off?: true;
};

/* ------------------------------------------------------------------ */
/* Fixtures                                                           */
/* ------------------------------------------------------------------ */

export const absences: Absence[] = [
  // Adja en formation jeudi 03 et vendredi 04/09 : aux Almadies, ses
  // rendez-vous d'onglerie reviennent à Henry.
  {
    id: "ab-adja-formation",
    memberId: "m-adja",
    from: "2026-09-03",
    to: "2026-09-04",
    type: "formation",
    reason: "Formation pose gel — centre partenaire",
  },
  // Congé posé la semaine suivante — Sea Plaza reste couvert (Bineta + Marie Dominique).
  {
    id: "ab-fatou-conge",
    memberId: "m-fatou",
    from: "2026-09-08",
    to: "2026-09-12",
    type: "conge",
  },
  // Journée maladie isolée — vendredi 04/09, Almadies garde Henry et Gnagna.
  {
    id: "ab-michelle-maladie",
    memberId: "m-michelle",
    from: "2026-09-04",
    to: "2026-09-04",
    type: "maladie",
  },
];

export const shiftOverrides: ShiftOverride[] = [
  // Fatou vient exceptionnellement son jour de repos (mercredi 02/09), le matin.
  {
    id: "so-fatou-0902",
    memberId: "m-fatou",
    date: "2026-09-02",
    salonId: "seaplaza",
    start: "10:00",
    end: "14:00",
  },
  // Michelle démarre en milieu de journée le mercredi 09/09 (rendez-vous personnel).
  {
    id: "so-michelle-0909",
    memberId: "m-michelle",
    date: "2026-09-09",
    salonId: "almadies",
    start: "12:00",
    end: "16:30",
  },
  // Adja écourte sa journée du mardi 02/09.
  {
    id: "so-adja-0902",
    memberId: "m-adja",
    date: "2026-09-02",
    salonId: "almadies",
    start: "10:00",
    end: "15:00",
  },
];

/* ------------------------------------------------------------------ */
/* Présence résolue                                                   */
/* ------------------------------------------------------------------ */

export type Presence =
  | { state: "off" }
  | { state: "absent"; type: AbsenceType; reason?: string }
  | {
      state: "present";
      salonId: SalonId;
      start: string;
      end: string;
    };

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

export const isoWeekday = (iso: string): Weekday =>
  WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];

export const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Lundi de la semaine contenant `iso`.
export const mondayOf = (iso: string): string => {
  const js = new Date(`${iso}T00:00:00`).getDay(); // 0 = dimanche
  return addDays(iso, js === 0 ? -6 : 1 - js);
};

export const PLANNING_DEFAULT_MONDAY = mondayOf(TODAY_ISO);


// Absences / ajustements pris en compte. Les écrans qui éditent ces listes en
// mémoire de session passent leur propre état ; par défaut, les seeds.
// `baseHours` (2026-09-28) : horaires habituels modifiés depuis l'éditeur du
// Planning, par membre — remplace `Member.baseHours` des seeds quand présent.
export type PlanningData = {
  absences: Absence[];
  shiftOverrides: ShiftOverride[];
  baseHours?: Record<string, Record<Weekday, DayShift>>;
};

const SEED_DATA: PlanningData = { absences, shiftOverrides };

// Trame habituelle d'un membre (session si modifiée, sinon seeds).
export const baseHoursOf = (
  member: Member,
  data: PlanningData = SEED_DATA,
): Record<Weekday, DayShift> => data.baseHours?.[member.id] ?? member.baseHours;

// Présence d'un membre un jour donné.
// Priorité : absence > ajustement ponctuel > horaire habituel ; puis recoupe les
// heures d'ouverture du salon (salon fermé ce jour-là → repos).
export function presenceFor(
  memberId: string,
  iso: string,
  data: PlanningData = SEED_DATA,
): Presence {
  const member = members.find((m) => m.id === memberId);
  if (!member || !member.active) return { state: "off" };

  const absence = data.absences.find(
    (a) => a.memberId === memberId && iso >= a.from && iso <= a.to,
  );
  if (absence) return { state: "absent", type: absence.type, reason: absence.reason };

  const override = data.shiftOverrides.find(
    (o) => o.memberId === memberId && o.date === iso,
  );
  if (override) {
    if (override.off || isClosed(override.salonId, iso)) return { state: "off" };
    return {
      state: "present",
      salonId: override.salonId,
      start: override.start,
      end: override.end,
    };
  }

  const shift = baseHoursOf(member, data)[isoWeekday(iso)];
  if (shift.off) return { state: "off" };
  if (isClosed(shift.salonId, iso)) return { state: "off" };

  return {
    state: "present",
    salonId: shift.salonId,
    start: shift.start,
    end: shift.end,
  };
}

/* ------------------------------------------------------------------ */
/* Semaine                                                            */
/* ------------------------------------------------------------------ */

export type WeekDayHead = {
  iso: string;
  weekday: Weekday;
  closed: boolean; // fermé pour le périmètre demandé
  closure?: string; // motif d'une fermeture exceptionnelle
};

export type WeekRow = { member: Member; cells: Presence[] };

// Ordre d'affichage : praticiennes d'abord (par prénom), puis le reste de
// l'équipe.
const byDisplayOrder = (a: Member, b: Member) => {
  const pa = a.roles.includes("praticienne") ? 0 : 1;
  const pb = b.roles.includes("praticienne") ? 0 : 1;
  if (pa !== pb) return pa - pb;
  return a.firstName.localeCompare(b.firstName, "fr");
};

export function weekPresence(
  scope: SalonScope,
  mondayIso: string,
  data: PlanningData = SEED_DATA,
): { days: WeekDayHead[]; rows: WeekRow[] } {
  const ids = scopeIds(scope);

  const days: WeekDayHead[] = WEEKDAYS.map((weekday, i) => {
    const iso = addDays(mondayIso, i);
    const closed = ids.every((id) => isClosed(id, iso));
    const closure = closuresFor(scope, iso)[0]?.reason;
    return { iso, weekday, closed, closure };
  });

  // Une personne n'est pas rattachée à un salon : filtrer par salon revient à
  // ne garder que celles qui y sont réellement présentes au moins un jour de
  // la semaine affichée (pas à une appartenance fixe).
  const rows: WeekRow[] = members
    .filter((m) => m.active)
    .sort(byDisplayOrder)
    .map((member) => ({
      member,
      cells: days.map((d) => presenceFor(member.id, d.iso, data)),
    }))
    .filter(
      (row) =>
        scope === "all" || row.cells.some((c) => c.state === "present" && inScope(scope, c.salonId)),
    );

  return { days, rows };
}

// Jours où un salon ouvert n'a aucune praticienne présente.
// Pour « Tous les salons », un jour ressort si AU MOINS un salon ouvert est
// sans praticienne.
export function coverageGaps(
  scope: SalonScope,
  mondayIso: string,
  data: PlanningData = SEED_DATA,
): { iso: string; salonId: SalonId }[] {
  const ids = scopeIds(scope);
  const gaps: { iso: string; salonId: SalonId }[] = [];

  for (let i = 0; i < WEEKDAYS.length; i++) {
    const iso = addDays(mondayIso, i);
    for (const salonId of ids) {
      if (isClosed(salonId, iso)) continue;
      const covered = members.some(
        (m) =>
          m.active &&
          m.roles.includes("praticienne") &&
          (() => {
            const p = presenceFor(m.id, iso, data);
            return p.state === "present" && p.salonId === salonId;
          })(),
      );
      if (!covered) gaps.push({ iso, salonId });
    }
  }
  return gaps;
}

export const newAbsenceId = () => `ab-${Date.now().toString(36)}`;
export const newOverrideId = () => `so-${Date.now().toString(36)}`;

// Une semaine a-t-elle au moins une exception (absence ou ajustement) qui la
// recoupe ? Sert au message « cette semaine suit les horaires habituels ».
export function weekHasExceptions(mondayIso: string, data: PlanningData): boolean {
  const sunday = addDays(mondayIso, 6);
  return (
    data.absences.some((a) => a.from <= sunday && a.to >= mondayIso) ||
    data.shiftOverrides.some((o) => o.date >= mondayIso && o.date <= sunday)
  );
}

// Membre dont aucun jour n'est travaillé dans la trame de référence.
export const hasNoBaseHours = (member: Member): boolean =>
  WEEKDAYS.every((d) => member.baseHours[d].off);

/* ------------------------------------------------------------------ */
/* Présence par salon — pour l'affectation d'un rendez-vous            */
/* ------------------------------------------------------------------ */

// Praticiennes actives réellement présentes dans CE salon ce jour-là (pas
// « rattachées » à ce salon — une praticienne peut y être un jour et ailleurs
// le lendemain).
export function presentPractitioners(
  salonId: SalonId,
  iso: string,
  data: PlanningData = SEED_DATA,
): Member[] {
  return members.filter((m) => {
    if (!m.active || !m.roles.includes("praticienne")) return false;
    const p = presenceFor(m.id, iso, data);
    return p.state === "present" && p.salonId === salonId;
  });
}

// Idem, restreint à celles compétentes pour une prestation donnée — alimente
// les `select` d'affectation de `/rendez-vous`.
export function presentPractitionersForPrestation(
  prestationId: string,
  salonId: SalonId,
  iso: string,
  data: PlanningData = SEED_DATA,
): Member[] {
  return presentPractitioners(salonId, iso, data).filter((m) =>
    m.skills.includes(prestationId),
  );
}

// Résumé lisible de la semaine d'un membre : « 3j Almadies · 2j Sea Plaza ».
// Sert de remplacement, sur la fiche membre et la liste Équipe, à l'ancien
// badge « salons de rattachement » — dérivé du planning plutôt que figé.
export function weekSalonSummary(
  memberId: string,
  mondayIso: string = PLANNING_DEFAULT_MONDAY,
  data: PlanningData = SEED_DATA,
): string {
  const counts = new Map<SalonId, number>();
  for (let i = 0; i < 7; i++) {
    const p = presenceFor(memberId, addDays(mondayIso, i), data);
    if (p.state === "present") counts.set(p.salonId, (counts.get(p.salonId) ?? 0) + 1);
  }
  if (counts.size === 0) return "Aucun jour planifié cette semaine";
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `${n}j ${salonName(id)}`)
    .join(" · ");
}

/* ------------------------------------------------------------------ */
/* Édition du planning (2026-09-28)                                    */
/* ------------------------------------------------------------------ */

// Lecture détaillée d'une case du planning : la présence résolue ET d'où elle
// vient — la trame habituelle, un ajustement de ce jour, une absence — plus
// l'horaire habituel qui s'appliquerait sans exception. Sert à l'éditeur de
// la semaine (marque « modifié », « Rétablir l'horaire habituel »).
export type DayPlan = {
  presence: Presence;
  source: "habituel" | "ajuste" | "absence";
  habitual: DayShift;
  override?: ShiftOverride;
  absence?: Absence;
  // Salon de l'horaire prévu fermé ce jour-là (fermeture hebdo ou exceptionnelle).
  closedSalon?: SalonId;
};

export function dayPlan(memberId: string, iso: string, data: PlanningData = SEED_DATA): DayPlan {
  const member = members.find((m) => m.id === memberId);
  const habitual: DayShift = member ? baseHoursOf(member, data)[isoWeekday(iso)] : { off: true };
  const presence = presenceFor(memberId, iso, data);
  const absence = data.absences.find((a) => a.memberId === memberId && iso >= a.from && iso <= a.to);
  if (absence) return { presence, source: "absence", habitual, absence };
  const override = data.shiftOverrides.find((o) => o.memberId === memberId && o.date === iso);
  const planned = override ? (override.off ? null : override.salonId) : habitual.off ? null : habitual.salonId;
  const closedSalon = planned && isClosed(planned, iso) ? planned : undefined;
  return { presence, source: override ? "ajuste" : "habituel", habitual, override, closedSalon };
}

// Deux horaires de jour identiques (repos = repos).
export const sameShift = (a: DayShift, b: DayShift): boolean =>
  a.off === b.off && (a.off || (!b.off && a.salonId === b.salonId && a.start === b.start && a.end === b.end));

// Retire un jour d'une absence sur plage : 0, 1 ou 2 absences restantes.
export function absenceWithout(absence: Absence, iso: string): Absence[] {
  if (iso < absence.from || iso > absence.to) return [absence];
  const out: Absence[] = [];
  if (absence.from < iso) out.push({ ...absence, to: addDays(iso, -1) });
  if (absence.to > iso) out.push({ ...absence, id: `${absence.id}-${iso}`, from: addDays(iso, 1) });
  return out;
}

/* ------------------------------------------------------------------ */
/* Format                                                             */
/* ------------------------------------------------------------------ */

// « 10h–18h ».
export const shiftRangeLabel = (p: Extract<Presence, { state: "present" }>): string => {
  const h = (t: string) => {
    const [hh, mm] = t.split(":");
    return mm === "00" ? `${Number(hh)}h` : `${Number(hh)}h${mm}`;
  };
  return `${h(p.start)}–${h(p.end)}`;
};
