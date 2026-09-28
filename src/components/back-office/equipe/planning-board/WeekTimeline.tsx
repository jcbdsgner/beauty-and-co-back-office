"use client";

import { ArrowLeftRight, Eye, MoreHorizontal, Undo2, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { IconButton } from "@/components/ui/atoms/icon-button";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SalonId } from "@/lib/mock/beautyandco";
import type { PlanningData } from "@/lib/mock/planning";
import { staffAccent } from "@/lib/mock/staff-colors";
import { initials, type Member } from "@/lib/mock/staff";
import {
  absenceLabel,
  atSalonLabel,
  dateOf,
  formatHour,
  isClosed,
  salonLabel,
  salonsOfWeek,
  shiftsFor,
  type PlanningRow,
} from "./data";

/**
 * « Planning · Semaine » — copie de point-de-vente (`components/planning/week-timeline.tsx`) :
 * même grammaire que la vue Jour (une ligne par praticienne), chaque ligne tient ses 7 jours
 * en cellules compactes : horaire du jour + nombre de rendez-vous, ou « Repos ». Salon
 * regardé : un jour passé dans l'autre salon est hachuré et nommé, un jour de fermeture du
 * salon est grisé « Fermé ». « Tous les salons » : sous l'horaire, le salon du jour — pour
 * celles qui tournent seulement.
 */
const HATCH = "repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in oklab, var(--color-base-content) 7%, transparent) 7px 8px)";
const LABEL_W = 208;
const DAY_W = 132;

function dayHead(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(dateOf(iso)).replace(".", "").toUpperCase();
}

type Props = {
  weekDays: string[];
  salonId: SalonId | null;
  todayIso: string;
  staff: Member[];
  accentIndex: Map<string, number>;
  allRows: PlanningRow[];
  data: PlanningData;
  isolatedId: string | null;
  onPickDay: (iso: string, staffId?: string) => void;
  onIsolate: (id: string) => void;
  onShowAll: () => void;
  onMarkAbsent: (id: string) => void;
};

export function WeekTimeline({
  weekDays,
  salonId,
  todayIso,
  staff,
  accentIndex,
  allRows,
  data,
  isolatedId,
  onPickDay,
  onIsolate,
  onShowAll,
  onMarkAbsent,
}: Props) {
  const rowsFor = (iso: string, staffId: string) =>
    allRows.filter(
      (r) =>
        r.dateIso === iso &&
        (r.staffId === staffId || r.secondStaffId === staffId) &&
        (!salonId || r.salonId === salonId),
    );
  const closedOn = (iso: string) => Boolean(salonId && isClosed(salonId, iso));
  const todayInWeek = weekDays.includes(todayIso);

  if (staff.length === 0) {
    return <div className="px-6 py-14 text-center text-sm text-base-content/45">Aucune praticienne sélectionnée.</div>;
  }

  return (
    <div className="overflow-x-auto [scrollbar-width:thin]">
      <div style={{ minWidth: LABEL_W + weekDays.length * DAY_W }}>
        <div className="flex border-b border-base-300 bg-base-200">
          <div className="shrink-0 border-r border-base-300" style={{ width: LABEL_W }} />
          {weekDays.map((iso) => {
            const isToday = iso === todayIso;
            const closed = closedOn(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onPickDay(iso)}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 border-r border-base-300 py-1.5 transition last:border-r-0 hover:bg-base-200",
                  isToday && "bg-primary/5",
                  closed && "bg-base-300/60",
                )}
                style={{ minWidth: DAY_W }}
              >
                <span className={cn("text-xs font-bold uppercase tracking-[0.1em]", isToday ? "text-primary" : "text-base-content/45")}>
                  {dayHead(iso)}
                </span>
                <span className={cn("text-sm font-semibold tabular-nums", isToday ? "text-primary" : "text-base-content/70")}>
                  {Number(iso.slice(8, 10))}
                </span>
              </button>
            );
          })}
        </div>

        {staff.map((p) => {
          const accent = staffAccent(accentIndex.get(p.id) ?? 0);
          const rotates = salonsOfWeek(p.id, weekDays[0], data).length > 1;
          const absentToday = absenceLabel(p.id, todayIso, data) !== null;
          return (
            <div key={p.id} className="flex border-b border-l-[3px] border-base-300 last:border-b-0" style={{ borderLeftColor: accent.dot }}>
              <div className="flex shrink-0 items-center gap-2 border-r border-base-300 px-3 py-2" style={{ width: LABEL_W }}>
                <Avatar photoUrl={p.photo} initial={initials(p)} size={28} className="shrink-0 text-xs font-semibold" style={{ backgroundColor: accent.dot, color: "#fff" }} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-base-content">{p.firstName}</span>
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
                    { label: "Isoler cette ligne", icon: <Eye className="size-4" />, onSelect: () => onIsolate(p.id) },
                    ...(isolatedId
                      ? [{ label: "Afficher toute l'équipe", icon: <Undo2 className="size-4" />, onSelect: onShowAll }]
                      : []),
                    ...(todayInWeek
                      ? [
                          {
                            label: "Marquer absente aujourd'hui",
                            icon: <UserX className="size-4" />,
                            tone: "danger" as const,
                            disabled: absentToday,
                            onSelect: () => onMarkAbsent(p.id),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
              {weekDays.map((iso) => {
                const isToday = iso === todayIso;
                const closed = closedOn(iso);
                const absent = absenceLabel(p.id, iso, data) !== null;
                const shifts = shiftsFor(p.id, iso, data);
                const here = salonId ? shifts.filter((s) => s.salonId === salonId) : shifts;
                const away = [...new Set(shifts.filter((s) => !here.includes(s)).map((s) => s.salonId))];
                const items = rowsFor(iso, p.id);
                const onlyAway = !closed && here.length === 0 && away.length > 0;
                const daySalons = !salonId && rotates ? [...new Set(shifts.map((s) => s.salonId))] : [];
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => onPickDay(iso, p.id)}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 border-r border-base-300 px-2 py-2 text-center transition last:border-r-0 hover:bg-base-200",
                      isToday && "bg-primary/5",
                      (closed || (here.length === 0 && !absent)) && "bg-base-300/50",
                      absent && !closed && "bg-warning/10",
                    )}
                    style={{ minWidth: DAY_W, backgroundImage: onlyAway ? HATCH : undefined }}
                  >
                    {closed ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-base-content/35">Fermé</span>
                    ) : absent ? (
                      <span className="text-xs font-semibold text-warning">Absente</span>
                    ) : onlyAway ? (
                      <span className="rounded-full bg-base-100/85 px-2 py-0.5 text-xs font-semibold text-base-content/55">
                        {atSalonLabel(away[0])}
                      </span>
                    ) : here.length > 0 ? (
                      <>
                        <span className="text-xs font-semibold tabular-nums text-base-content/70">
                          {`${formatHour(here[0].start)}–${formatHour(here[here.length - 1].end)}`}
                        </span>
                        {daySalons.length > 0 && (
                          <span className="text-[0.68rem] text-base-content/50">{daySalons.map(salonLabel).join(" → ")}</span>
                        )}
                        {away.length > 0 && (
                          <span
                            title={shifts.map((s) => `${salonLabel(s.salonId)} ${formatHour(s.start)}–${formatHour(s.end)}`).join(", ")}
                            className="flex items-center gap-1 text-[0.68rem] text-base-content/50"
                          >
                            <ArrowLeftRight aria-hidden className="size-3" />
                            {away.map(salonLabel).join(" · ")}
                          </span>
                        )}
                        {items.length > 0 && (
                          <span
                            className="rounded-sm px-1.5 py-px text-xs font-bold tabular-nums"
                            style={{ backgroundColor: accent.bg, color: accent.text }}
                          >
                            {items.length} rdv
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-base-content/30">Repos</span>
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
