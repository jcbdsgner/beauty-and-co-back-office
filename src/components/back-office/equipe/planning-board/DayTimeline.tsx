"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeftRight, Eye, GripVertical, MoreHorizontal, Undo2, UserX, Users } from "lucide-react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { IconButton } from "@/components/ui/atoms/icon-button";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SalonId } from "@/lib/mock/beautyandco";
import type { PlanningData } from "@/lib/mock/planning";
import { staffAccent } from "@/lib/mock/staff-colors";
import { initials, type Member } from "@/lib/mock/staff";
import {
  GRID_END,
  SALON_CLOSING,
  SALON_OPENING,
  absenceLabel,
  atSalonLabel,
  formatHour,
  minutesToTime,
  rowEnd,
  salonLabel,
  shiftsFor,
  timeToMinutes,
  type PlanningRow,
  type Shift,
} from "./data";

/**
 * « Planning · Jour » — copie de point-de-vente (`components/planning/day-timeline.tsx`,
 * reconstruit là-bas du Figma node 270:2466) : une colonne par praticienne, le temps
 * défile verticalement, les prestations sont positionnées dedans (début + durée), côte à
 * côte en sous-colonnes quand deux se chevauchent (`pack`). Un bloc affiche l'heure et la
 * bénéficiaire ; la prestation suit en gris si le bloc a la hauteur. Zone grisée = hors
 * horaire du jour ; colonne grisée = repos. Poignée de glisser-déposer, isolement et
 * absence sur l'en-tête de colonne. Adaptations back-office : données de `./data`,
 * absence lue dans `PlanningContext` (datée, pas un simple drapeau « aujourd'hui »).
 */
const SLOT_MIN = 30;
const SLOT_H = 56; // px par 30 min
const TIME_COL_W = 52;
const HEADER_H = 72;
const SHOW_SERVICE_MIN_H = 60;
const LANE_W = 192;

type Props = {
  iso: string;
  /** Salon regardé — `null` = « Tous les salons ». */
  salonId: SalonId | null;
  isToday: boolean;
  staff: Member[];
  accentIndex: Map<string, number>;
  rows: PlanningRow[];
  data: PlanningData;
  isolatedId: string | null;
  onOpenRdv: (rdvId: string) => void;
  onIsolate: (id: string) => void;
  onShowAll: () => void;
  onMarkAbsent: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
};

type Placed = { row: PlanningRow; start: number; end: number; lane: number };

function pack(items: PlanningRow[]): { placed: Placed[]; lanes: number } {
  const sorted = [...items].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const laneEnds: number[] = [];
  const placed = sorted.map((row) => {
    const start = timeToMinutes(row.start);
    const end = timeToMinutes(rowEnd(row));
    let lane = laneEnds.findIndex((e) => e <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { row, start, end, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function subscribeNever() {
  return () => {};
}

function useMounted() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

/** Plages nominales, ou — si aucune mais que des prestations existent quand même ce jour-là —
 *  une plage dérivée, pour ne jamais griser une colonne qui a un rendez-vous dedans. */
function effectiveShifts(nominal: Shift[], col: PlanningRow[]): Shift[] {
  if (nominal.length > 0) return nominal;
  if (col.length === 0) return [];
  const starts = col.map((r) => timeToMinutes(r.start));
  const ends = col.map((r) => timeToMinutes(rowEnd(r)));
  return [{ start: minutesToTime(Math.min(...starts)), end: minutesToTime(Math.max(...ends)), salonId: col[0].salonId }];
}

type Zone = { from: number; to: number; kind: "off" | "elsewhere" | "transit"; label?: string; sub?: string };

function zonesFor(shifts: Shift[], salonId: SalonId | null, from: number, to: number): Zone[] {
  const zones: Zone[] = [];
  let cursor = from;
  shifts.forEach((s, i) => {
    const start = timeToMinutes(s.start);
    const end = timeToMinutes(s.end);
    const prev = shifts[i - 1];
    if (start > cursor) {
      const transit = prev && prev.salonId !== s.salonId;
      zones.push(
        transit
          ? { from: cursor, to: start, kind: "transit", label: "Trajet", sub: salonId ? undefined : `vers ${salonLabel(s.salonId)}` }
          : { from: cursor, to: start, kind: "off" },
      );
    }
    if (salonId && s.salonId !== salonId) zones.push({ from: start, to: end, kind: "elsewhere", label: atSalonLabel(s.salonId) });
    cursor = Math.max(cursor, end);
  });
  if (cursor < to) zones.push({ from: cursor, to, kind: "off" });
  return zones;
}

const HATCH = "repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in oklab, var(--color-base-content) 7%, transparent) 7px 8px)";

function shiftCaption(shifts: Shift[], salonId: SalonId | null): { hours: string; salons?: string; moves: boolean; title: string } {
  const hours = (s: Shift) => `${formatHour(s.start)}–${formatHour(s.end)}`;
  const title = shifts.map((s) => `${salonLabel(s.salonId)} ${hours(s)}`).join(", ");
  const salonIds = [...new Set(shifts.map((s) => s.salonId))];
  const here = salonId ? shifts.filter((s) => s.salonId === salonId) : shifts;
  const span = !salonId && salonIds.length > 1;
  return {
    // Amplitude plutôt que plages : la pause déjeuner du back-office coupe la journée en deux
    // plages du même salon, qui ne tiendraient pas dans l'en-tête — la zone grisée la montre.
    hours: span || here.length > 1
      ? `${formatHour((span ? shifts : here)[0].start)}–${formatHour((span ? shifts : here).at(-1)!.end)}`
      : here.map(hours).join(" · "),
    salons: salonId ? undefined : span ? salonLabel(shifts[shifts.length - 1].salonId) : salonLabel(salonIds[0]),
    moves: salonIds.length > 1,
    title,
  };
}

export function DayTimeline({
  iso,
  salonId,
  isToday,
  staff,
  accentIndex,
  rows,
  data,
  isolatedId,
  onOpenRdv,
  onIsolate,
  onShowAll,
  onMarkAbsent,
  onReorder,
}: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const { gridStart, gridEnd } = useMemo(() => {
    const marks = rows.flatMap((r) => [timeToMinutes(r.start), timeToMinutes(rowEnd(r))]);
    const lo = Math.min(timeToMinutes(SALON_OPENING), ...marks);
    const hi = Math.max(timeToMinutes(GRID_END), ...marks);
    return { gridStart: Math.floor(lo / 60) * 60, gridEnd: Math.ceil(hi / 60) * 60 };
  }, [rows]);

  const y = (min: number) => ((min - gridStart) / SLOT_MIN) * SLOT_H;
  const bodyH = y(gridEnd);
  const closing = timeToMinutes(SALON_CLOSING);
  const closedTop = y(closing);
  const hourMarks: number[] = [];
  for (let m = gridStart; m <= gridEnd; m += 60) hourMarks.push(m);

  const mounted = useMounted();
  const now = nowMinutes();
  const showNow = mounted && isToday && now > gridStart && now < gridEnd;

  const columns = useMemo(
    () =>
      staff.map((p) => {
        const col = rows.filter((r) => r.staffId === p.id || r.secondStaffId === p.id);
        const absent = absenceLabel(p.id, iso, data) !== null;
        const shifts = absent ? [] : effectiveShifts(shiftsFor(p.id, iso, data), col);
        const { placed, lanes } = pack(col);
        const colW = Math.max(LANE_W, lanes * (LANE_W - 8) + 16);
        const accent = staffAccent(accentIndex.get(p.id) ?? 0);
        const zones = shifts.length ? zonesFor(shifts, salonId, gridStart, closing) : [];
        const caption = shifts.length ? shiftCaption(shifts, salonId) : null;
        return { p, shifts, placed, colW, absent, accent, zones, caption };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staff, rows, iso, data, salonId, accentIndex, gridStart, gridEnd],
  );

  if (staff.length === 0) {
    return <div className="px-6 py-14 text-center text-sm text-base-content/45">Aucune praticienne sélectionnée.</div>;
  }

  const totalContentW = TIME_COL_W + columns.reduce((sum, c) => sum + c.colW, 0);

  return (
    <div className="max-h-[65vh] overflow-auto [scrollbar-width:thin]">
      <div className="relative" style={{ minWidth: totalContentW }}>
        <div className="flex">
          {/* ── règle horaire ── */}
          <div className="sticky left-0 z-20 shrink-0" style={{ width: TIME_COL_W }}>
            <div className="sticky top-0 z-30 border-b border-r border-base-300 bg-base-200" style={{ height: HEADER_H }} />
            <div className="relative border-r border-base-300 bg-base-200" style={{ height: bodyH }}>
              <div aria-hidden className="absolute inset-x-0 bottom-0 border-t border-base-content/15 bg-base-300/80" style={{ top: closedTop }}>
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-base-content/45">
                  Fermé
                </span>
              </div>
              {hourMarks
                .filter((m) => m <= closing)
                .map((m) => (
                  <span
                    key={m}
                    className="absolute right-1.5 -translate-y-1/2 text-[0.68rem] font-semibold tabular-nums text-base-content/45"
                    style={{ top: y(m) }}
                  >
                    {formatHour(`${Math.floor(m / 60)}:00`)}
                  </span>
                ))}
            </div>
          </div>

          {/* ── colonnes ── */}
          {columns.map(({ p, shifts, placed, colW, absent, accent, zones, caption }) => (
            <div key={p.id} className="flex shrink-0 flex-col border-r border-base-300 last:border-r-0" style={{ width: colW }}>
              <div
                draggable
                onDragStart={(e) => {
                  setDraggedId(p.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  if (!draggedId || draggedId === p.id) return;
                  e.preventDefault();
                  setOverId(p.id);
                }}
                onDragLeave={() => setOverId((id) => (id === p.id ? null : id))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId && draggedId !== p.id) onReorder(draggedId, p.id);
                  setDraggedId(null);
                  setOverId(null);
                }}
                className={cn(
                  "sticky top-0 z-10 flex items-center gap-2 border-b border-t-[3px] border-base-300 bg-base-100 px-2.5",
                  absent && "bg-warning/5",
                  draggedId === p.id && "opacity-40",
                  overId === p.id && draggedId && draggedId !== p.id && "ring-2 ring-inset ring-primary/60",
                )}
                style={{ height: HEADER_H, borderTopColor: absent ? undefined : accent.border }}
              >
                <GripVertical aria-hidden className="size-3.5 shrink-0 cursor-grab text-base-content/25 active:cursor-grabbing" />
                <Avatar
                  initial={initials(p)}
                  size={32}
                  className={cn("shrink-0 text-[0.72rem] font-semibold", absent && "bg-base-200 text-base-content/40")}
                  style={absent ? undefined : { backgroundColor: accent.border, color: "#fff" }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="flex items-center gap-1.5 truncate font-[family-name:var(--font-heading)] text-[13px] font-semibold"
                    style={{ color: absent ? undefined : accent.text }}
                  >
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: absent ? undefined : accent.dot }} />
                    {p.firstName}
                  </p>
                  <p
                    title={!absent && caption ? caption.title : undefined}
                    className={cn(
                      "flex items-center gap-1 truncate text-[0.7rem] tabular-nums",
                      absent ? "font-semibold text-warning" : "text-base-content/45",
                    )}
                  >
                    {!absent && caption?.moves && !caption.salons && (
                      <ArrowLeftRight aria-hidden className="size-3 shrink-0 text-base-content/55" />
                    )}
                    <span className="truncate">{absent ? "Absente" : caption ? caption.hours : "Repos"}</span>
                  </p>
                  {!absent && caption?.salons && (
                    <p className="flex items-center gap-1 truncate text-[0.66rem] text-base-content/50">
                      {caption.moves && <ArrowLeftRight aria-hidden className="size-3 shrink-0" />}
                      <span className="truncate">{caption.salons}</span>
                    </p>
                  )}
                </div>
                <DropdownMenu
                  align="end"
                  trigger={
                    <IconButton
                      aria-label={`Actions pour ${p.firstName}`}
                      className="size-7 shrink-0 rounded-full text-base-content/40 hover:bg-base-200"
                    >
                      <MoreHorizontal className="size-4" />
                    </IconButton>
                  }
                  items={[
                    { label: "Isoler cette colonne", icon: <Eye className="size-4" />, onSelect: () => onIsolate(p.id) },
                    ...(isolatedId
                      ? [{ label: "Afficher toute l'équipe", icon: <Undo2 className="size-4" />, onSelect: onShowAll }]
                      : []),
                    ...(isToday
                      ? [
                          {
                            label: "Marquer absente aujourd'hui",
                            icon: <UserX className="size-4" />,
                            tone: "danger" as const,
                            disabled: absent,
                            onSelect: () => onMarkAbsent(p.id),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <div className="relative" style={{ height: bodyH }}>
                {shifts.length === 0 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center bg-base-300/60"
                    style={{ height: closedTop }}
                  >
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-base-content/40">
                      {absent ? "Absente" : "Repos"}
                    </span>
                  </div>
                )}
                {zones.map((z) => {
                  const h = y(z.to) - y(z.from);
                  return (
                    <div
                      key={`${z.kind}-${z.from}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center gap-0.5 bg-base-300/60 px-2 text-center"
                      style={{ top: y(z.from), height: h, backgroundImage: z.kind === "elsewhere" ? HATCH : undefined }}
                    >
                      {z.label && h >= 36 && (
                        <span className="rounded-full bg-base-100/85 px-2 py-0.5 text-[0.66rem] font-semibold text-base-content/55">
                          {z.label}
                        </span>
                      )}
                      {z.sub && h >= 56 && <span className="text-[0.64rem] text-base-content/45">{z.sub}</span>}
                    </div>
                  );
                })}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-base-content/15 bg-base-300/80" style={{ top: closedTop }} />
                {hourMarks.map((m) =>
                  m === gridStart ? null : (
                    <div key={m} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-base-300/60" style={{ top: y(m) }} />
                  ),
                )}
                {absent && <div aria-hidden className="pointer-events-none absolute inset-0 bg-warning/10" />}

                {placed.map(({ row, lane }) => {
                  const top = y(timeToMinutes(row.start));
                  const h = Math.max((row.durationMin / SLOT_MIN) * SLOT_H, SLOT_H - 6);
                  const isSecond = row.secondStaffId === p.id && row.staffId !== p.id;
                  const who = row.prestation.beneficiaryName || row.rdv.client.name;
                  return (
                    <button
                      key={row.key + p.id}
                      type="button"
                      onClick={() => onOpenRdv(row.rdv.id)}
                      title={`${row.start} · ${who} · ${row.prestation.name}`}
                      style={{
                        top,
                        left: 8 + lane * (LANE_W - 8),
                        width: LANE_W - 14,
                        height: h,
                        backgroundColor: accent.bg,
                        borderColor: accent.border,
                        borderLeftColor: accent.border,
                      }}
                      className={cn(
                        "absolute flex flex-col justify-start gap-0.5 overflow-hidden rounded-field border border-l-[3px] px-2.5 py-1.5 text-left shadow-sm transition hover:z-10 hover:shadow-md hover:brightness-[0.97] active:opacity-70",
                        isSecond && "opacity-75",
                      )}
                    >
                      <span className="flex items-center gap-1 text-[0.64rem] font-bold tabular-nums" style={{ color: accent.text }}>
                        {row.start}
                        {row.secondStaffId && <Users aria-hidden className="size-3" />}
                      </span>
                      <span className="truncate text-xs font-semibold text-base-content">{who}</span>
                      {h >= SHOW_SERVICE_MIN_H && (
                        <span className="line-clamp-2 text-[0.68rem] leading-snug text-base-content/50">{row.prestation.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {showNow && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-20 h-px bg-primary"
            style={{ top: HEADER_H + y(now), left: TIME_COL_W, width: totalContentW - TIME_COL_W }}
          >
            <span className="absolute -left-[3px] -top-[3px] size-[7px] rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
