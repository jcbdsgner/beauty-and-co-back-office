import { salonName, today, type SalonScope } from "@/lib/mock/beautyandco";
import { TODAY_ISO, type PlanningData } from "@/lib/mock/planning";
import {
  allRendezvous,
  autoAssign,
  rdvEnd,
  RDV_STATUS_META,
  timeToMinutes,
  type RdvDetail,
} from "@/lib/mock/rendezvous";

// Lecture « aujourd'hui » du tableau de bord, calculée sur les vrais
// rendez-vous (`rendezvous.ts`) — plus sur la liste parallèle `salonsToday` de
// `beautyandco.ts`, qui montrait des prestations absentes du catalogue et ne
// menait nulle part.

export type VisitPhase = "past" | "ongoing" | "upcoming";

export type TodayVisit = {
  rdv: RdvDetail;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  phase: VisitPhase;
  closed: boolean; // annulé / absence : affiché, jamais compté
  staffNames: string[];
  pendingAssign: number; // prestations qu'aucune praticienne ne peut prendre (conflit)
};

export const NOW = today.currentTime;
export const NOW_MIN = timeToMinutes(NOW);

// « Jeudi 3 septembre » — le jour de la semaine est dérivé de la date ISO.
export const todayTitle = (() => {
  const dt = new Date(`${TODAY_ISO}T12:00:00`);
  const label = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
})();

// Praticiennes affectées automatiquement, en tenant compte des absences
// posées pendant la session (`PlanningContext`).
export function todayVisits(scope: SalonScope, planning?: PlanningData): TodayVisit[] {
  return autoAssign(allRendezvous(), planning)
    .filter((r) => r.date.startsWith(TODAY_ISO) && (scope === "all" || r.salon === scope))
    .map((rdv) => {
      const starts = rdv.prestations.map((p) => p.start).sort();
      const start = starts[0] ?? rdv.date.slice(11, 16);
      const end = rdvEnd(rdv).slice(11, 16);
      const phase: VisitPhase =
        timeToMinutes(end) <= NOW_MIN
          ? "past"
          : timeToMinutes(start) <= NOW_MIN
            ? "ongoing"
            : "upcoming";
      return {
        rdv,
        start,
        end,
        phase,
        closed: RDV_STATUS_META[rdv.status].closed && rdv.status !== "terminé",
        staffNames: [
          ...new Set(
            rdv.prestations
              .flatMap((p) => [p.staff, p.secondStaff])
              .filter((s): s is string => Boolean(s)),
          ),
        ],
        pendingAssign:
          rdv.status === "à venir" ? rdv.prestations.filter((p) => p.staff === null).length : 0,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export const visitSalon = (v: TodayVisit) => salonName(v.rdv.salon);
