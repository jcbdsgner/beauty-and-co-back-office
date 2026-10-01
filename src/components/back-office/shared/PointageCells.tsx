import { cn } from "@/lib/utils";
import {
  earlyLeaveMinutes,
  hoursLabel,
  lateMinutes,
  offsetMinutes,
  type PointageDay,
  type PointageSummary,
} from "@/lib/mock/pointage";

// Morceaux de lecture d'un pointage, partagés par l'onglet Présence de la fiche
// membre et le Journal › Pointage : l'heure badgée reste discrète quand elle
// est à l'heure, l'écart ressort en ocre, l'oubli de badge en rouge.

type Worked = Extract<PointageDay, { kind: "worked" }>;

export function ArrivalValue({ day }: { day: Worked }) {
  if (!day.arrival) return <span className="text-sm font-medium text-error-700">Non badgée</span>;
  const late = lateMinutes(day);
  return (
    <>
      <span className={late ? "font-semibold text-warning-700" : "text-base-content"}>
        {day.arrival}
      </span>
      {late > 0 && (
        <span className="ml-2 text-sm text-warning-700">
          +{offsetMinutes(day.arrival, day.plannedStart)} min
        </span>
      )}
    </>
  );
}

export function DepartureValue({ day }: { day: Worked }) {
  if (day.ongoing) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-success-700">
        <span aria-hidden className="size-2 rounded-full bg-success-500" />
        En poste
      </span>
    );
  }
  if (!day.departure) {
    return <span className="text-sm font-medium text-error-700">Départ non badgé</span>;
  }
  const early = earlyLeaveMinutes(day);
  return (
    <>
      <span className={early ? "font-semibold text-warning-700" : "text-base-content"}>
        {day.departure}
      </span>
      {early > 0 && <span className="ml-2 text-sm text-warning-700">−{early} min</span>}
    </>
  );
}

export function PointageFigure({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "warning";
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm text-base-content/60">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "warning" ? "text-warning-700" : "text-base-content",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-sm text-base-content/60">{note}</p>
    </div>
  );
}

// Bilan d'une période : temps de présence, jours, retards, départs anticipés
// — puis, à part, les départs non badgés (jamais inventés).
export function PointageSummaryBar({ summary }: { summary: PointageSummary }) {
  const deltaMin = summary.presenceMin - summary.plannedMin;
  return (
    <>
      <div className="grid grid-cols-4 divide-x divide-base-300 rounded-box border border-base-300 bg-white">
        <PointageFigure
          label="Temps de présence"
          value={summary.workedDays === 0 ? "—" : hoursLabel(summary.presenceMin)}
          note={
            summary.plannedMin === 0
              ? "Aucune journée terminée"
              : deltaMin === 0
                ? `Prévu : ${hoursLabel(summary.plannedMin)}`
                : `${deltaMin > 0 ? "+" : "−"}${hoursLabel(Math.abs(deltaMin))} par rapport au prévu`
          }
        />
        <PointageFigure
          label="Jours travaillés"
          value={String(summary.workedDays)}
          note={
            summary.absentDays === 0
              ? "Aucune absence"
              : `${summary.absentDays} jour${summary.absentDays > 1 ? "s" : ""} d'absence`
          }
        />
        <PointageFigure
          label="Retards"
          value={String(summary.lateCount)}
          tone={summary.lateCount > 0 ? "warning" : undefined}
          note={
            summary.lateCount === 0
              ? "Toujours à l'heure"
              : `${hoursLabel(summary.lateTotalMin)} cumulées`
          }
        />
        <PointageFigure
          label="Départs anticipés"
          value={String(summary.earlyCount)}
          tone={summary.earlyCount > 0 ? "warning" : undefined}
          note="Plus de 10 min avant l'heure prévue"
        />
      </div>
      {summary.missingCount > 0 && (
        <p className="text-sm text-error-700">
          {summary.missingCount === 1
            ? "1 départ n'a pas été badgé : le temps de présence de ce jour n'est pas compté."
            : `${summary.missingCount} départs n'ont pas été badgés : le temps de présence de ces jours n'est pas compté.`}
        </p>
      )}
    </>
  );
}
