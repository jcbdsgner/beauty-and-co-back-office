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
  open: "09:00",
  close: "19:00",
};

export function dayHasError(d: DayOpening): boolean {
  if (d.closed) return false;
  if (d.close <= d.open) return true;
  if (d.breakStart && d.breakEnd && d.breakEnd <= d.breakStart) return true;
  return false;
}

export const hoursHaveError = (hours: Hours) =>
  WEEKDAYS.some((w) => dayHasError(hours[w]));

export default function HoursEditor({
  hours,
  onChange,
}: {
  hours: Hours;
  onChange: (next: Hours) => void;
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
                aria-label={`${WEEKDAY_LABELS[w]} — ${d.closed ? "fermé" : "ouvert"}`}
              />
              {d.closed ? (
                <span className="text-sm text-base-content/45">Fermé</span>
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
                  {d.breakStart != null && d.breakEnd != null ? (
                    <span className="flex items-center gap-2">
                      <span className="text-base-content/45">coupure</span>
                      <input
                        type="time"
                        aria-label={`${WEEKDAY_LABELS[w]} — début de coupure`}
                        value={d.breakStart}
                        onChange={(e) => setDay(w, { ...d, breakStart: e.target.value })}
                        className={timeFieldClass}
                      />
                      <span>–</span>
                      <input
                        type="time"
                        aria-label={`${WEEKDAY_LABELS[w]} — fin de coupure`}
                        value={d.breakEnd}
                        onChange={(e) => setDay(w, { ...d, breakEnd: e.target.value })}
                        className={timeFieldClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDay(w, { closed: false, open: d.open, close: d.close })
                        }
                        className="text-xs font-medium text-base-content/45 hover:text-error-600"
                      >
                        Retirer
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setDay(w, { ...d, breakStart: "13:00", breakEnd: "14:00" })
                      }
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      + Coupure déjeuner
                    </button>
                  )}
                </div>
              )}
            </div>
            {err && (
              <p className="mt-2 pl-28 text-xs text-error-600">
                L&apos;heure de fermeture doit suivre l&apos;heure d&apos;ouverture.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
