"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Tooltip, TooltipProvider } from "@/components/ui/atoms/tooltip";
import { cn } from "@/lib/utils";
import { members, fullName, initials } from "@/lib/mock/staff";
import {
  rdvEndTime,
  rdvStartTime,
  reservationComposition,
  timeToMinutes,
  type RdvDetail,
} from "@/lib/mock/rendezvous";

// Vue « Calendrier » d'une journée — reprise de l'Accueil de point-de-vente,
// qui fait autorité (`components/journee/accueil-calendar.tsx`, ADR 0019 /
// 0033) : rail des heures + une colonne, un bloc = une réservation entière,
// posé à son heure de début, sur un même fond rosé. Chaque bloc liste ses
// prestations (« ×2 » pour une prestation répétée) et ses praticiennes en
// avatars. Un bloc n'est jamais rogné : il grandit si son contenu l'exige, et
// les blocs sont répartis en couloirs selon leur emprise à l'écran — deux
// blocs ne se chevauchent jamais. Fenêtre = ouverture des salons, la fin de
// grille grisée « Fermé ».

const SLOT_MIN = 30;
const SLOT_H = 90; // px par demi-heure
const RAIL_W = 56;
const LANE_MIN_W = 248;
const MAX_AVATARS = 4;
const MAX_SERVICES = 4;
const AVATAR = 34;
const PAD_Y = 12;
const ROW_GAP = 4;
const TIME_H = 16;
const NAME_H = 22;
const COMPO_H = 16;
const SERVICES_TOP = 6;
const SERVICE_H = 18;
const AVATARS_TOP = 10;
const CARD_GAP = 6;
const CAL_CARD = "#fff1f1"; // `--cal-card` de point-de-vente

const hm = (min: number) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

type ServiceLine = { id: string; name: string; count: number };

function serviceLines(r: RdvDetail): ServiceLine[] {
  const lines = new Map<string, ServiceLine>();
  for (const p of r.prestations) {
    const line = lines.get(p.prestationId);
    if (line) line.count += 1;
    else lines.set(p.prestationId, { id: p.prestationId, name: p.name, count: 1 });
  }
  return [...lines.values()];
}

const staffOf = (r: RdvDetail) => {
  const names = new Set<string>();
  for (const p of r.prestations) {
    if (p.staff) names.add(p.staff);
    if (p.secondStaff) names.add(p.secondStaff);
  }
  return [...names].map((n) => members.find((m) => fullName(m) === n)).filter((m) => Boolean(m)) as typeof members;
};

function contentHeight(services: number, hasAvatars: boolean) {
  const shown = Math.min(services, MAX_SERVICES) + (services > MAX_SERVICES ? 1 : 0);
  return (
    PAD_Y * 2 + TIME_H + ROW_GAP + NAME_H + ROW_GAP + COMPO_H +
    (shown > 0 ? SERVICES_TOP + shown * SERVICE_H : 0) +
    (hasAvatars ? AVATARS_TOP + AVATAR : 0)
  );
}

function ClosedBand({ top, label = false }: { top: number; label?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-base-content/15 bg-base-300/60" style={{ top }}>
      {label && (
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[0.68rem] font-semibold tracking-[0.1em] text-base-content/40 uppercase">
          Fermé
        </span>
      )}
    </div>
  );
}

export default function ReservationCalendar({
  rdvs,
  opening,
  closing,
  showNow,
  nowTime,
  onOpen,
}: {
  rdvs: RdvDetail[];
  opening: string; // « HH:MM »
  closing: string;
  showNow: boolean;
  nowTime: string;
  onOpen: (id: string) => void;
}) {
  const now = timeToMinutes(nowTime);

  const { gridStart, gridEnd } = useMemo(() => {
    const marks = rdvs.flatMap((r) => [timeToMinutes(rdvStartTime(r)), timeToMinutes(rdvEndTime(r))]);
    const lo = Math.min(timeToMinutes(opening), ...marks);
    const hi = Math.max(timeToMinutes(closing) + 120, ...marks);
    return { gridStart: Math.floor(lo / 60) * 60, gridEnd: Math.ceil(hi / 60) * 60 };
  }, [rdvs, opening, closing]);

  const y = (min: number) => ((min - gridStart) / SLOT_MIN) * SLOT_H;

  const { placed, lanes, bottom } = useMemo(() => {
    const yy = (min: number) => ((min - gridStart) / SLOT_MIN) * SLOT_H;
    const sorted = [...rdvs].sort((a, b) => timeToMinutes(rdvStartTime(a)) - timeToMinutes(rdvStartTime(b)));
    const laneEnds: number[] = [];
    const placed = sorted.map((r) => {
      const services = serviceLines(r);
      const staff = staffOf(r);
      const top = yy(timeToMinutes(rdvStartTime(r)));
      const span = yy(timeToMinutes(rdvEndTime(r))) - top;
      const height = Math.max(span, contentHeight(services.length, staff.length > 0) + CARD_GAP);
      let lane = laneEnds.findIndex((e) => e <= top);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(top + height);
      } else laneEnds[lane] = top + height;
      return { r, services, staff, top, height, lane };
    });
    const bottom = Math.max(0, ...placed.map((p) => p.top + p.height));
    return { placed, lanes: Math.max(1, laneEnds.length), bottom };
  }, [rdvs, gridStart]);

  const bodyH = Math.max(y(gridEnd), bottom);
  const hourMarks: number[] = [];
  for (let m = gridStart; y(m) <= bodyH; m += 60) hourMarks.push(m);
  const closedTop = y(timeToMinutes(closing));
  const nowVisible = showNow && now > gridStart && now < gridEnd;

  return (
    <TooltipProvider>
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 p-4 [scrollbar-width:thin]">
      <div className="relative flex" style={{ height: bodyH + 12, paddingTop: 12, minWidth: RAIL_W + lanes * LANE_MIN_W }}>
        <div className="relative shrink-0 border-r border-base-300" style={{ width: RAIL_W }}>
          <ClosedBand top={closedTop} label />
          {hourMarks.map((m, i) => (
            <div key={m} className="relative" style={{ height: i === hourMarks.length - 1 ? 0 : SLOT_H * 2 }}>
              {y(m) <= closedTop && (
                <span className={cn("absolute right-3 text-xs font-semibold tabular-nums text-base-content/40", i === 0 ? "top-0" : "-top-2")}>
                  {hm(m)}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="relative flex-1">
          <ClosedBand top={closedTop} />
          {hourMarks.map((m, i) =>
            i === 0 ? null : (
              <div key={m} aria-hidden className="absolute inset-x-0 border-t border-base-300/70" style={{ top: i * SLOT_H * 2 }} />
            ),
          )}

          {placed.map(({ r, services, staff, top, height, lane }) => {
            const start = rdvStartTime(r);
            const end = rdvEndTime(r);
            const composition = reservationComposition(r);
            const past = r.status !== "à venir" || (showNow && timeToMinutes(end) <= now);
            const conflict = r.status === "à venir" && r.prestations.some((p) => !p.staff);
            const visibleAvatars = staff.slice(0, MAX_AVATARS);
            const hiddenAvatars = staff.length - visibleAvatars.length;
            const visibleServices = services.slice(0, MAX_SERVICES);
            const hiddenServices = services.length - visibleServices.length;
            return (
              <Tooltip
                key={r.id}
                side="right"
                content={
                  <div className="flex flex-col gap-1 py-0.5">
                    <span className="font-semibold">{r.client.name}</span>
                    <span className="tabular-nums opacity-80">
                      {start} → {end}
                    </span>
                    <span className="opacity-80">{composition}</span>
                    {services.map((s) => (
                      <span key={s.id} className="opacity-80">
                        {s.name}
                        {s.count > 1 && ` ×${s.count}`}
                      </span>
                    ))}
                    {staff.length > 0 && <span className="opacity-80">{staff.map((m) => fullName(m)).join(", ")}</span>}
                  </div>
                }
              >
                <button
                  type="button"
                  onClick={() => onOpen(r.id)}
                  style={{
                    top,
                    height: height - CARD_GAP,
                    left: `calc(${(lane / lanes) * 100}% + 5px)`,
                    width: `calc(${100 / lanes}% - 10px)`,
                    background: CAL_CARD,
                  }}
                  className={cn(
                    "absolute flex flex-col gap-1 overflow-hidden rounded-box px-4 py-3 text-left transition hover:z-10 hover:brightness-[0.97] active:opacity-80 [&>*]:shrink-0",
                    past && "opacity-60",
                  )}
                >
                  <span className="flex items-center justify-between gap-1 leading-4">
                    <span className="truncate text-xs font-bold tabular-nums text-primary">
                      {start} – {end}
                    </span>
                    {conflict && (
                      <span
                        title="Aucune praticienne disponible"
                        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-warning ring-2 ring-[#fff1f1]"
                      >
                        <span className="size-1.5 rounded-full bg-base-100" />
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[0.95rem] leading-[22px] font-semibold text-base-content">{r.client.name}</span>
                  <span className="truncate text-xs leading-4 text-base-content/60">{composition}</span>
                  {visibleServices.length > 0 && (
                    <ul className="flex flex-col pt-1.5">
                      {visibleServices.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-xs leading-[18px] text-base-content/80">
                          <span aria-hidden className="size-1 shrink-0 rounded-full bg-primary/60" />
                          <span className="truncate">{s.name}</span>
                          {s.count > 1 && <span className="shrink-0 font-semibold tabular-nums text-base-content/60">×{s.count}</span>}
                        </li>
                      ))}
                      {hiddenServices > 0 && (
                        <li className="pl-3 text-xs leading-[18px] text-base-content/50">
                          +{hiddenServices} autre{hiddenServices > 1 ? "s" : ""}
                        </li>
                      )}
                    </ul>
                  )}
                  {visibleAvatars.length > 0 && (
                    <span className="mt-auto flex items-center pt-2.5">
                      {visibleAvatars.map((m, i) => (
                        <Avatar
                          key={m.id}
                          initial={initials(m)}
                          size={AVATAR}
                          className={cn("bg-base-100 text-sm font-bold text-base-content ring-2 ring-[#fff1f1]", i > 0 && "-ml-3")}
                        />
                      ))}
                      {hiddenAvatars > 0 && (
                        <span
                          className="-ml-3 flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content ring-2 ring-[#fff1f1]"
                          style={{ width: AVATAR, height: AVATAR }}
                        >
                          +{hiddenAvatars}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}

          {nowVisible && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: y(now) }}>
              <span className="size-1.5 shrink-0 rounded-full bg-warning" />
              <span className="h-px flex-1 bg-warning/60" />
            </div>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
