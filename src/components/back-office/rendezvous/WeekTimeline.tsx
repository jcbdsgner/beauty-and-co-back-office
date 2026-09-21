"use client";

import { accentForMemberId, type StaffAccent } from "@/lib/mock/staff-colors";
import { WEEKDAY_LABELS, type Weekday } from "@/lib/mock/beautyandco";

// Agenda « Semaine » — même grammaire que le Planning de l'onglet Équipe (une
// ligne par praticienne) : ici chaque cellule résume la journée (horaire +
// nombre de rendez-vous) plutôt que de dérouler chaque créneau — la vue
// Semaine sert à repérer un jour chargé ou creux, pas à lire l'heure exacte
// (on bascule en vue Jour pour ça, d'un clic sur la cellule).

export type WeekDayHead = { iso: string; weekday: Weekday; closed: boolean };

export type WeekCell = { hours?: { start: string; end: string }; count: number; absent?: boolean; off?: boolean };

export type WeekRow = {
  memberId: string;
  label: string;
  cells: WeekCell[]; // même ordre que `days`
};

const h = (t: string) => {
  const [hh, mm] = t.split(":");
  return mm === "00" ? `${Number(hh)}h` : `${Number(hh)}h${mm}`;
};

type Props = {
  days: WeekDayHead[];
  rows: WeekRow[];
  todayIso: string;
  onPickDay: (iso: string, memberId?: string) => void;
};

export default function WeekTimeline({ days, rows, todayIso, onPickDay }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center text-theme-sm text-gray-400">
        Personne à planifier cette semaine.
      </div>
    );
  }

  const gridCols = "200px repeat(7, minmax(0, 1fr))";

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white [scrollbar-width:thin]">
      <div className="min-w-[920px]">
        <div className="grid border-b border-gray-100 bg-gray-50/60" style={{ gridTemplateColumns: gridCols }}>
          <div />
          {days.map((d) => {
            const isToday = d.iso === todayIso;
            return (
              <div
                key={d.iso}
                className={`border-l border-gray-100 px-2 py-2.5 text-center ${isToday ? "bg-brand-50/70" : ""}`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-wide ${isToday ? "text-brand-600" : "text-gray-400"}`}>
                  {WEEKDAY_LABELS[d.weekday].slice(0, 3)}
                </p>
                <p className={`text-theme-sm font-semibold tabular-nums ${isToday ? "text-brand-700" : "text-gray-700"}`}>
                  {Number(d.iso.slice(8, 10))}
                </p>
              </div>
            );
          })}
        </div>

        {rows.map((row) => {
          const accent: StaffAccent = accentForMemberId(row.memberId);
          return (
            <div
              key={row.memberId}
              className="grid border-b border-l-[3px] border-gray-100 last:border-b-0"
              style={{ gridTemplateColumns: gridCols, borderLeftColor: accent.dot }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: accent.dot }}
                >
                  {row.label.slice(0, 1)}
                </span>
                <span className="truncate text-theme-sm font-semibold" style={{ color: accent.text }}>
                  {row.label}
                </span>
              </div>
              {days.map((d, i) => {
                const cell = row.cells[i];
                const isToday = d.iso === todayIso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => onPickDay(d.iso, row.memberId)}
                    disabled={d.closed}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 border-l border-gray-100 px-2 py-2 text-center transition ${
                      d.closed ? "bg-gray-50/60" : isToday ? "bg-brand-50/40 hover:bg-brand-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {d.closed ? (
                      <span className="text-[12px] text-gray-300">Fermé</span>
                    ) : cell.absent ? (
                      <span className="text-[12px] font-semibold text-warning-600">Absente</span>
                    ) : cell.off || !cell.hours ? (
                      <span className="text-[12px] text-gray-300">Repos</span>
                    ) : (
                      <>
                        <span className="text-[12px] font-medium tabular-nums text-gray-600">
                          {h(cell.hours.start)}–{h(cell.hours.end)}
                        </span>
                        {cell.count > 0 && (
                          <span
                            className="rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums"
                            style={{ backgroundColor: accent.bg, color: accent.text }}
                          >
                            {cell.count} RDV
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
