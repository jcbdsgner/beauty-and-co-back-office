// Logique de l'éditeur des horaires (Équipe › Planning › Horaires, 2026-09-28) :
// transformations pures de l'état de présence (absences, ajustements du jour,
// horaires habituels) — le composant ne fait que les appeler et pousser le
// résultat dans `PlanningContext`. Tout reste en mémoire de session.

import { salonConfig, type SalonId } from "@/lib/mock/beautyandco";
import {
  absenceWithout,
  addDays,
  baseHoursOf,
  isoWeekday,
  newAbsenceId,
  presenceFor,
  sameShift,
  type Absence,
  type AbsenceType,
  type PlanningData,
  type ShiftOverride,
} from "@/lib/mock/planning";
import { minutesToTime, timeToMinutes } from "@/lib/mock/rendezvous";
import type { DayShift, Member } from "@/lib/mock/staff";
import type { BaseHoursMap } from "@/context/PlanningContext";
import type { PlanningRow } from "../planning-board/data";

export type ScheduleState = {
  absences: Absence[];
  overrides: ShiftOverride[];
  baseHours: BaseHoursMap;
};

export const toData = (s: ScheduleState): PlanningData => ({
  absences: s.absences,
  shiftOverrides: s.overrides,
  baseHours: s.baseHours,
});

/** Ce que la propriétaire décide pour une case. */
export type DayTarget =
  | { kind: "work"; salonId: SalonId; start: string; end: string }
  | { kind: "off" }
  | { kind: "absent"; type: AbsenceType; reason: string };

/* ------------------------------------------------------------ heures */

const STEP = 30;

/** Heures d'ouverture du salon ce jour-là, `null` s'il est fermé (trame hebdo). */
export function openingOf(salonId: SalonId, iso: string): { open: string; close: string } | null {
  const h = salonConfig(salonId).hours[isoWeekday(iso)];
  return h.closed ? null : { open: h.open, close: h.close };
}

/** Pas de 30 min de l'ouverture à la fermeture (bornes incluses). */
export function timeSteps(open: string, close: string): string[] {
  const out: string[] = [];
  for (let t = timeToMinutes(open); t <= timeToMinutes(close); t += STEP) out.push(minutesToTime(t));
  return out;
}

export const minutesBetween = (start: string, end: string) => timeToMinutes(end) - timeToMinutes(start);

/** « 10 h », « 7 h 30 ». */
export function hoursLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/* ---------------------------------------------------------- édition */

const overrideFor = (memberId: string, iso: string, shift: DayShift, habitual: DayShift): ShiftOverride =>
  shift.off
    ? {
        id: `so-${memberId}-${iso}`,
        memberId,
        date: iso,
        salonId: habitual.off ? "almadies" : habitual.salonId,
        start: "10:00",
        end: "20:00",
        off: true,
      }
    : { id: `so-${memberId}-${iso}`, memberId, date: iso, salonId: shift.salonId, start: shift.start, end: shift.end };

/**
 * Applique la décision d'une case. `everyWeek` : la décision devient l'horaire
 * habituel de ce jour de la semaine (et l'éventuel ajustement de la date saute).
 * Sinon, un ajustement de ce jour seulement — supprimé s'il ne diffère plus de
 * l'horaire habituel. Travailler / repos sur un jour d'absence retire ce seul
 * jour de l'absence (une plage peut se couper en deux).
 */
export function applyDay(
  s: ScheduleState,
  member: Member,
  iso: string,
  target: DayTarget,
  everyWeek: boolean,
): ScheduleState {
  const wd = isoWeekday(iso);
  const overrides = s.overrides.filter((o) => !(o.memberId === member.id && o.date === iso));
  const existing = s.absences.find((a) => a.memberId === member.id && iso >= a.from && iso <= a.to);

  if (target.kind === "absent") {
    const reason = target.reason.trim() || undefined;
    const absences = existing
      ? s.absences.map((a) => (a === existing ? { ...a, type: target.type, reason } : a))
      : [...s.absences, { id: newAbsenceId() + member.id, memberId: member.id, from: iso, to: iso, type: target.type, reason }];
    return { ...s, absences, overrides };
  }

  const absences = existing ? s.absences.flatMap((a) => (a === existing ? absenceWithout(a, iso) : [a])) : s.absences;
  const shift: DayShift =
    target.kind === "off" ? { off: true } : { off: false, salonId: target.salonId, start: target.start, end: target.end };
  const current = baseHoursOf(member, toData(s));

  if (everyWeek) {
    return { absences, overrides, baseHours: { ...s.baseHours, [member.id]: { ...current, [wd]: shift } } };
  }
  const habitual = current[wd];
  return {
    ...s,
    absences,
    overrides: sameShift(habitual, shift) ? overrides : [...overrides, overrideFor(member.id, iso, shift, habitual)],
  };
}

/** Retire toute exception de ce jour (ajustement, jour d'absence) : retour à l'habituel. */
export function restoreDay(s: ScheduleState, memberId: string, iso: string): ScheduleState {
  return {
    ...s,
    overrides: s.overrides.filter((o) => !(o.memberId === memberId && o.date === iso)),
    absences: s.absences.flatMap((a) => (a.memberId === memberId ? absenceWithout(a, iso) : [a])),
  };
}

const weekDates = (monday: string) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

/** Rend à la semaine ses horaires habituels (les absences restent). */
export function resetWeek(s: ScheduleState, monday: string): ScheduleState {
  const days = new Set(weekDates(monday));
  return { ...s, overrides: s.overrides.filter((o) => !days.has(o.date)) };
}

/**
 * Recopie la semaine précédente, jour par jour, pour les membres donnés. Les
 * jours d'absence (de l'une ou l'autre semaine) ne sont pas touchés : une
 * absence n'est pas un horaire à reconduire.
 */
export function copyPreviousWeek(s: ScheduleState, team: Member[], monday: string): ScheduleState {
  const data = toData(s);
  let next = s;
  for (const m of team) {
    for (const iso of weekDates(monday)) {
      const prev = presenceFor(m.id, addDays(iso, -7), data);
      if (prev.state === "absent") continue;
      if (s.absences.some((a) => a.memberId === m.id && iso >= a.from && iso <= a.to)) continue;
      const target: DayTarget =
        prev.state === "present" ? { kind: "work", salonId: prev.salonId, start: prev.start, end: prev.end } : { kind: "off" };
      next = applyDay(next, m, iso, target, false);
    }
  }
  return next;
}

/** Nombre de cases de la semaine qui s'écartent de l'habituel, par nature. */
export function weekChanges(s: ScheduleState, monday: string, memberIds: Set<string>) {
  const days = weekDates(monday);
  const sunday = days[6];
  const adjusted = s.overrides.filter((o) => memberIds.has(o.memberId) && o.date >= monday && o.date <= sunday).length;
  let absentDays = 0;
  for (const a of s.absences) {
    if (!memberIds.has(a.memberId)) continue;
    absentDays += days.filter((d) => d >= a.from && d <= a.to).length;
  }
  return { adjusted, absentDays };
}

/* ------------------------------------------------------- rendez-vous */

/** Prestations déjà affectées au membre ce jour-là qui ne tiendraient plus dans la décision. */
export function rdvOutside(rows: PlanningRow[], memberId: string, iso: string, target: DayTarget): PlanningRow[] {
  const mine = rows.filter((r) => r.dateIso === iso && (r.staffId === memberId || r.secondStaffId === memberId));
  if (target.kind !== "work") return mine;
  const from = timeToMinutes(target.start);
  const to = timeToMinutes(target.end);
  return mine.filter((r) => {
    const s = timeToMinutes(r.start);
    return r.salonId !== target.salonId || s < from || s + r.durationMin > to;
  });
}
