"use client";

import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  type DayOpening,
  type Weekday,
} from "@/lib/mock/beautyandco";
import { Toggle, timeFieldClass } from "./ui";

// Éditeur des heures d'ouverture — 7 lignes. Partagé par la fiche salon et le
// formulaire de création. `close` doit suivre `open`, sinon message inline.

type Hours = Record<Weekday, DayOpening>;

const DEFAULT_OPEN: Extract<DayOpening, { closed: false }> = {
  closed: false,
  open: "10:00",
  close: "20:00",
};

export function dayHasError(d: DayOpening): boolean {
  if (d.closed) return false;
  return d.close <= d.open;
}

export const hoursHaveError = (hours: Hours) =>
  WEEKDAYS.some((w) => dayHasError(hours[w]));

export default function HoursEditor({
  hours,
  onChange,
  closedLabel = "Fermé",
  openLabel = "ouvert",
}: {
  hours: Hours;
  onChange: (next: Hours) => void;
  /** Libellé d'un jour coupé — « Fermé » pour un salon, « Indisponible » pour une prestation. */
  closedLabel?: string;
  openLabel?: string;
}) {
  const setDay = (w: Weekday, next: DayOpening) => onChange({ ...hours, [w]: next });

  return (
    <ul className="space-y-2.5">
      {WEEKDAYS.map((w) => {
        const d = hours[w];
        const err = dayHasError(d);
        return (
          <li key={w} className="rounded-xl border border-base-300 px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-sm font-medium text-base-content">
                {WEEKDAY_LABELS[w]}
              </span>
              <Toggle
                checked={!d.closed}
                onChange={(open) => setDay(w, open ? { ...DEFAULT_OPEN } : { closed: true })}
                aria-label={`${WEEKDAY_LABELS[w]} — ${d.closed ? closedLabel.toLowerCase() : openLabel}`}
              />
              {d.closed ? (
                <span className="text-sm text-base-content/45">{closedLabel}</span>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-base-content/70">
                  <input
                    type="time"
                    aria-label={`${WEEKDAY_LABELS[w]} — ouverture`}
                    value={d.open}
                    onChange={(e) => setDay(w, { ...d, open: e.target.value })}
                    className={timeFieldClass}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    aria-label={`${WEEKDAY_LABELS[w]} — fermeture`}
                    value={d.close}
                    onChange={(e) => setDay(w, { ...d, close: e.target.value })}
                    className={timeFieldClass}
                  />
                </div>
              )}
            </div>
            {err && (
              <p className="mt-2 pl-28 text-xs text-error-600">
                L&apos;heure de fin doit suivre l&apos;heure de début.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
