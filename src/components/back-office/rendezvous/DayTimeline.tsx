"use client";

import { useState } from "react";
import { accentForStaffName, type StaffAccent } from "@/lib/mock/staff-colors";
import { prestationSlots, type RdvDetail } from "@/lib/mock/rendezvous";

// Agenda « Jour » — une ligne par praticienne, le temps défile horizontalement,
// les prestations sont positionnées dedans (début + durée cumulée des
// prestations précédentes du même rendez-vous). Remplace la grille FullCalendar
// (verticale, générique) par une frise propre au métier : on voit d'un coup
// d'œil qui est occupée, quand, et qui est libre. Couleur = identité de la
// praticienne (`@/lib/mock/staff-colors`), pas le type de poste — on suit une
// personne, pas une salle.
//
// Glisser-déposer : on peut prendre n'importe quel bloc d'un rendez-vous (même
// à plusieurs prestations / plusieurs praticiennes) et le lâcher plus loin sur
// N'IMPORTE QUELLE ligne — puisque les prestations s'enchaînent depuis
// `RdvDetail.date`, déplacer un bloc déplace tout le rendez-vous en conservant
// l'écart entre prestations ; on ne change pas l'affectation, seulement l'heure.

const SLOT_MIN = 15;
const SLOT_W = 34; // px par tranche de 15 min
const LABEL_W = 200;
const ROW_H = 68;

export type TimelineRow = {
  key: string; // memberId, ou "pending" pour la file « à affecter »
  label: string;
  sublabel: string;
  accent: StaffAccent;
  pending?: boolean;
  absent?: boolean;
  /** Plage travaillée ce jour-là (grise le hors-horaire) — absente si repos. */
  hours?: { start: string; end: string };
};

type Props = {
  iso: string;
  windowStart: string; // "HH:MM"
  windowEnd: string;
  isToday: boolean;
  nowTime: string; // "HH:MM"
  rows: TimelineRow[];
  rdvs: RdvDetail[]; // déjà filtrés (salon, jour, hors annulés)
  onOpen: (id: string) => void;
  onMove: (id: string, newStartIso: string) => void;
};

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const minOfIso = (iso: string) => toMin(iso.slice(11, 16));

type Block = {
  rdv: RdvDetail;
  prestationId: string;
  name: string;
  start: number; // minutes depuis minuit
  end: number;
  offsetFromRdvStart: number; // minutes — pour recalculer la date au drop
  pending: boolean;
};

function blocksForRow(rdvs: RdvDetail[], match: (staffName: string | null) => boolean): Block[] {
  const out: Block[] = [];
  for (const rdv of rdvs) {
    const rdvStartMin = minOfIso(rdv.date);
    for (const { prestation, start } of prestationSlots(rdv)) {
      if (!match(prestation.staff)) continue;
      out.push({
        rdv,
        prestationId: prestation.id,
        name: prestation.name,
        start: minOfIso(start),
        end: minOfIso(start) + prestation.durationMin,
        offsetFromRdvStart: minOfIso(start) - rdvStartMin,
        pending: prestation.staff === null,
      });
    }
  }
  return out;
}

// Empile en sous-lignes verticales les blocs qui se chevauchent (chevauchement
// = double affectation par erreur — ça reste lisible plutôt que de se masquer).
function pack(items: Block[]): { block: Block; lane: number }[] {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const laneEnds: number[] = [];
  return sorted.map((block) => {
    let lane = laneEnds.findIndex((e) => e <= block.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(block.end);
    } else {
      laneEnds[lane] = block.end;
    }
    return { block, lane };
  });
}

export default function DayTimeline({
  iso,
  windowStart,
  windowEnd,
  isToday,
  nowTime,
  rows,
  rdvs,
  onOpen,
  onMove,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  const gridStart = Math.floor(toMin(windowStart) / 60) * 60;
  const gridEnd = Math.max(Math.ceil(toMin(windowEnd) / 60) * 60, gridStart + 4 * 60);
  const x = (min: number) => ((min - gridStart) / SLOT_MIN) * SLOT_W;
  const bodyW = x(gridEnd);
  const hourMarks: number[] = [];
  for (let m = gridStart; m <= gridEnd; m += 60) hourMarks.push(m);

  const now = toMin(nowTime);
  const showNow = isToday && now > gridStart && now < gridEnd;

  const dropTime = (clientX: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const min = gridStart + ((clientX - rect.left) / SLOT_W) * SLOT_MIN;
    const snapped = Math.round(min / SLOT_MIN) * SLOT_MIN;
    return Math.min(Math.max(snapped, gridStart), gridEnd);
  };

  const move = (block: Block, clientX: number, container: HTMLElement) => {
    const dropped = dropTime(clientX, container);
    const newStartMin = dropped - block.offsetFromRdvStart;
    const h = Math.floor(newStartMin / 60);
    const m = newStartMin % 60;
    const p = (n: number) => String(n).padStart(2, "0");
    onMove(block.rdv.id, `${iso}T${p(h)}:${p(m)}:00`);
  };

  if (rows.length === 0) {
    return (
      <div className="px-6 py-14 text-center text-theme-sm text-gray-400">
        Personne à planifier ce jour-là.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white [scrollbar-width:thin]">
      <div className="relative" style={{ minWidth: LABEL_W + bodyW }}>
        {/* en-tête des heures */}
        <div className="flex border-b border-gray-100 bg-gray-50/60">
          <div className="sticky left-0 z-10 shrink-0 border-r border-gray-100 bg-gray-50/60" style={{ width: LABEL_W }} />
          <div className="relative shrink-0" style={{ width: bodyW, height: 30 }}>
            {hourMarks.map((m) => (
              <span
                key={m}
                className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-gray-400"
                style={{ left: x(m) + 4 }}
              >
                {String(Math.floor(m / 60)).padStart(2, "0")}h
              </span>
            ))}
          </div>
        </div>

        {rows.map((row) => {
          const raw = row.pending
            ? blocksForRow(rdvs, (staff) => staff === null)
            : blocksForRow(rdvs, (staff) => staff === row.label);
          const placed = pack(raw);
          const lanes = Math.max(1, ...placed.map((p) => p.lane + 1));
          const rowH = Math.max(ROW_H, lanes * 30 + 20);
          const beforeW = row.hours ? x(toMin(row.hours.start)) : 0;
          const afterStart = row.hours ? x(toMin(row.hours.end)) : bodyW;

          return (
            <div key={row.key} className="flex border-b border-gray-100 last:border-b-0">
              <div
                className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-l-[3px] border-gray-100 bg-white px-3"
                style={{ width: LABEL_W, minHeight: rowH, borderLeftColor: row.accent.dot }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: row.accent.dot }}
                >
                  {row.label.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-theme-sm font-semibold" style={{ color: row.accent.text }}>
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: row.accent.dot }} />
                    {row.label}
                  </p>
                  <p className={`truncate text-[12px] ${row.absent ? "font-semibold text-warning-600" : "text-gray-400"}`}>
                    {row.sublabel}
                  </p>
                </div>
              </div>

              <div
                className="relative shrink-0"
                style={{ width: bodyW, minHeight: rowH }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  const block = raw.find((b) => `${b.rdv.id}-${b.prestationId}` === dragId);
                  if (block) move(block, e.clientX, e.currentTarget);
                  setDragId(null);
                }}
              >
                {!row.hours && !row.pending && !row.absent && (
                  <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-50">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-300">Repos</span>
                  </div>
                )}
                {!row.hours && row.absent && (
                  <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center bg-warning-50">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-warning-600">{row.sublabel}</span>
                  </div>
                )}
                {row.hours && beforeW > 0 && (
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 bg-gray-50" style={{ width: beforeW }} />
                )}
                {row.hours && afterStart < bodyW && (
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 bg-gray-50" style={{ left: afterStart, right: 0 }} />
                )}
                {row.absent && <div aria-hidden className="pointer-events-none absolute inset-0 bg-warning-50/60" />}
                {hourMarks.map((m) =>
                  m === gridStart ? null : (
                    <div key={m} aria-hidden className="pointer-events-none absolute inset-y-0 border-l border-gray-100" style={{ left: x(m) }} />
                  ),
                )}

                {placed.map(({ block, lane }) => {
                  const left = x(block.start);
                  const w = Math.max(x(block.end) - x(block.start), SLOT_W - 4);
                  const key = `${block.rdv.id}-${block.prestationId}`;
                  const accent = block.pending ? accentForStaffName(null) : row.accent;
                  return (
                    <button
                      key={key}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setDragId(key);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => onOpen(block.rdv.id)}
                      style={{
                        left,
                        top: 8 + lane * 30,
                        width: w,
                        height: 26,
                        backgroundColor: accent.bg,
                        borderColor: accent.border,
                      }}
                      className="absolute flex flex-col justify-center overflow-hidden rounded-md border border-l-[3px] px-2 text-left shadow-sm transition hover:z-10 hover:shadow-md active:opacity-70"
                    >
                      <span className="truncate text-[11px] font-semibold" style={{ color: accent.text }}>
                        {block.rdv.client.name} · {block.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {showNow && (
          <div aria-hidden className="pointer-events-none absolute z-20 w-px bg-brand-500" style={{ left: LABEL_W + x(now), top: 30, bottom: 0 }}>
            <span className="absolute -left-[3px] -top-[3px] size-[7px] rounded-full bg-brand-500" />
          </div>
        )}
      </div>
    </div>
  );
}
