// Pointage de l'équipe : heures d'arrivée et de départ réellement badgées à la
// caisse, jour par jour, en regard de l'horaire prévu par le planning.
//
// Indépendant du barrel : importer directement `@/lib/mock/pointage`. Aucune
// saisie ici — le back-office consulte ; le badgeage se fait sur le poste de
// caisse. Les pointages sont synthétisés de façon déterministe (même résultat
// à chaque rendu) à partir de la présence prévue (`presenceFor`, seeds du
// planning) : la plupart des jours à l'heure, quelques retards, un départ
// anticipé de temps en temps, et de rares oublis de pointage au départ.

import { today, type SalonId, type SalonScope } from "./beautyandco";
import {
  TODAY_ISO,
  addDays,
  baseHoursOf,
  isoWeekday,
  mondayOf,
  presenceFor,
  type AbsenceType,
} from "./planning";
import { members, type Member } from "./staff";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type PointageDay =
  | {
      kind: "worked";
      date: string; // ISO
      salonId: SalonId;
      plannedStart: string; // « HH:MM »
      plannedEnd: string;
      arrival: string | null; // null = arrivée non badgée
      departure: string | null; // null = pas encore partie (aujourd'hui) ou oubli
      ongoing: boolean; // aujourd'hui, encore en poste
    }
  | {
      kind: "absent";
      date: string;
      salonId: SalonId | null; // salon où elle était attendue ce jour-là
      type: AbsenceType;
      reason?: string;
    };

export type PointagePeriod = "semaine" | "semaine-precedente" | "30j";

export const POINTAGE_PERIOD_OPTIONS: { value: PointagePeriod; label: string }[] = [
  { value: "semaine", label: "Cette semaine" },
  { value: "semaine-precedente", label: "Semaine dernière" },
  { value: "30j", label: "30 derniers jours" },
];

// Au-delà de ces marges, l'écart est signalé.
export const LATE_TOLERANCE_MIN = 5;
export const EARLY_TOLERANCE_MIN = 10;

/* ------------------------------------------------------------------ */
/* Minutes                                                            */
/* ------------------------------------------------------------------ */

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// « 9 h 05 », « 45 min », « 38 h ».
export const hoursLabel = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/* Génération déterministe                                            */
/* ------------------------------------------------------------------ */

// Petit hash stable (FNV-1a) → [0, 1).
const rand = (key: string): number => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};
const between = (r: number, lo: number, hi: number) => Math.round(lo + r * (hi - lo));

const HISTORY_DAYS = 42; // six semaines d'historique

function pointageFor(memberId: string, iso: string): PointageDay | null {
  const p = presenceFor(memberId, iso);
  if (p.state === "off") return null;
  if (p.state === "absent") {
    const member = members.find((m) => m.id === memberId);
    const shift = member ? baseHoursOf(member)[isoWeekday(iso)] : null;
    return {
      kind: "absent",
      date: iso,
      salonId: shift && !shift.off ? shift.salonId : null,
      type: p.type,
      reason: p.reason,
    };
  }

  const start = toMin(p.start);
  const end = toMin(p.end);

  const ra = rand(`${memberId}|${iso}|a`);
  const arrivalOffset =
    ra < 0.68
      ? between(ra / 0.68, -14, 2) // en avance ou pile à l'heure
      : ra < 0.86
        ? between((ra - 0.68) / 0.18, 3, LATE_TOLERANCE_MIN) // dans la marge
        : between((ra - 0.86) / 0.14, 9, 42); // retard
  const arrival = start + arrivalOffset;

  const now = toMin(today.currentTime);
  if (iso === TODAY_ISO) {
    if (arrival > now) return null; // pas encore arrivée : rien à afficher
    return {
      kind: "worked",
      date: iso,
      salonId: p.salonId,
      plannedStart: p.start,
      plannedEnd: p.end,
      arrival: toHHMM(arrival),
      departure: null,
      ongoing: true,
    };
  }

  const rd = rand(`${memberId}|${iso}|d`);
  const departure =
    rd < 0.8
      ? end + between(rd / 0.8, -4, 22) // à l'heure ou un peu après
      : rd < 0.94
        ? end - between((rd - 0.8) / 0.14, 15, 50) // départ anticipé
        : null; // oubli de pointage

  return {
    kind: "worked",
    date: iso,
    salonId: p.salonId,
    plannedStart: p.start,
    plannedEnd: p.end,
    arrival: toHHMM(arrival),
    departure: departure === null ? null : toHHMM(departure),
    ongoing: false,
  };
}

// Registre complet d'un membre, du plus récent au plus ancien (jours de repos
// exclus : il n'y a rien à pointer).
export function pointagesFor(memberId: string): PointageDay[] {
  const out: PointageDay[] = [];
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const day = pointageFor(memberId, addDays(TODAY_ISO, -i));
    if (day) out.push(day);
  }
  return out;
}

export function periodRange(period: PointagePeriod): { from: string; to: string } {
  const monday = mondayOf(TODAY_ISO);
  if (period === "semaine") return { from: monday, to: TODAY_ISO };
  if (period === "semaine-precedente") return { from: addDays(monday, -7), to: addDays(monday, -1) };
  return { from: addDays(TODAY_ISO, -29), to: TODAY_ISO };
}

export const inRange = (days: PointageDay[], range: { from: string; to: string }) =>
  days.filter((d) => d.date >= range.from && d.date <= range.to);

/* ------------------------------------------------------------------ */
/* Lecture d'une journée                                              */
/* ------------------------------------------------------------------ */

type Worked = Extract<PointageDay, { kind: "worked" }>;

export const lateMinutes = (d: Worked): number => {
  if (!d.arrival) return 0;
  const late = toMin(d.arrival) - toMin(d.plannedStart);
  return late > LATE_TOLERANCE_MIN ? late : 0;
};

export const earlyLeaveMinutes = (d: Worked): number => {
  if (!d.departure) return 0;
  const early = toMin(d.plannedEnd) - toMin(d.departure);
  return early > EARLY_TOLERANCE_MIN ? early : 0;
};

// Écart signé à l'heure prévue (+ = après, − = avant), pour l'affichage.
export const offsetMinutes = (actual: string, planned: string) => toMin(actual) - toMin(planned);

export const plannedMinutes = (d: Worked) => toMin(d.plannedEnd) - toMin(d.plannedStart);

// Temps de présence : `null` quand le départ n'a pas été badgé ; en cours
// aujourd'hui = jusqu'à maintenant.
export const presenceMinutes = (d: Worked): number | null => {
  if (!d.arrival) return null;
  if (d.ongoing) return Math.max(0, toMin(today.currentTime) - toMin(d.arrival));
  if (!d.departure) return null;
  return toMin(d.departure) - toMin(d.arrival);
};

export const missingPunch = (d: Worked) => !d.ongoing && (!d.arrival || !d.departure);

export const hasAnomaly = (d: PointageDay) =>
  d.kind === "worked" && (lateMinutes(d) > 0 || earlyLeaveMinutes(d) > 0 || missingPunch(d));

/* ------------------------------------------------------------------ */
/* Bilan d'une période                                                */
/* ------------------------------------------------------------------ */

export type PointageSummary = {
  workedDays: number;
  absentDays: number;
  presenceMin: number; // jours complets uniquement (départ badgé)
  plannedMin: number; // mêmes jours, pour comparer à périmètre égal
  lateCount: number;
  lateTotalMin: number;
  earlyCount: number;
  missingCount: number;
};

export function summarize(days: PointageDay[]): PointageSummary {
  const s: PointageSummary = {
    workedDays: 0,
    absentDays: 0,
    presenceMin: 0,
    plannedMin: 0,
    lateCount: 0,
    lateTotalMin: 0,
    earlyCount: 0,
    missingCount: 0,
  };
  for (const d of days) {
    if (d.kind === "absent") {
      s.absentDays++;
      continue;
    }
    s.workedDays++;
    const late = lateMinutes(d);
    if (late > 0) {
      s.lateCount++;
      s.lateTotalMin += late;
    }
    if (earlyLeaveMinutes(d) > 0) s.earlyCount++;
    if (missingPunch(d)) s.missingCount++;
    const presence = presenceMinutes(d);
    if (presence !== null && !d.ongoing) {
      s.presenceMin += presence;
      s.plannedMin += plannedMinutes(d);
    }
  }
  return s;
}

// Regroupe par semaine (lundi), du plus récent au plus ancien.
export function groupByWeek(days: PointageDay[]): { monday: string; days: PointageDay[] }[] {
  const groups: { monday: string; days: PointageDay[] }[] = [];
  for (const d of days) {
    const monday = mondayOf(d.date);
    const last = groups[groups.length - 1];
    if (last && last.monday === monday) last.days.push(d);
    else groups.push({ monday, days: [d] });
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/* Pointage de toute l'équipe (Journal › Pointage)                    */
/* ------------------------------------------------------------------ */

export type TeamPointage = { member: Member; day: PointageDay };

// Les journées de toute l'équipe active (ou d'une seule personne) sur une
// plage, groupées par jour du plus récent au plus ancien. Dans un jour : les
// présentes par heure prévue d'arrivée, puis les absentes.
export function teamPointagesByDay(
  range: { from: string; to: string },
  scope: SalonScope,
  memberId: string | null = null,
): { date: string; rows: TeamPointage[] }[] {
  const byDate = new Map<string, TeamPointage[]>();
  for (const member of members) {
    if (!member.active || (memberId && member.id !== memberId)) continue;
    for (const day of inRange(pointagesFor(member.id), range)) {
      if (scope !== "all" && day.salonId !== scope) continue;
      const list = byDate.get(day.date) ?? [];
      list.push({ member, day });
      byDate.set(day.date, list);
    }
  }
  const rank = (d: PointageDay) => (d.kind === "absent" ? "99:99" : d.plannedStart);
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, rows]) => ({
      date,
      rows: rows.sort(
        (a, b) =>
          rank(a.day).localeCompare(rank(b.day)) ||
          a.member.firstName.localeCompare(b.member.firstName, "fr"),
      ),
    }));
}
