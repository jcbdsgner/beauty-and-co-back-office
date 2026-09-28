"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { initialsOf } from "@/components/back-office/shared/PersonCard";
import { cn } from "@/lib/utils";
import { productKind, productName } from "@/lib/mock/services";
import {
  fcfa,
  rdvEndTime,
  rdvStartTime,
  rdvTotal,
  reservationComposition,
  timeToMinutes,
  type RdvDetail,
  type RdvPrestation,
} from "@/lib/mock/rendezvous";

// Liste des rendez-vous — reprise de l'Accueil de point-de-vente, qui fait
// autorité (`components/journee/accueil-day-list.tsx`) : groupés par jour (en-
// tête de date seulement si la période couvre plusieurs jours), puis par
// tranche de 2 h sur un rail horaire à gauche (la tranche en cours marquée),
// grille fixe de 3 cartes. Une carte = une réservation : payeuse ·
// composition (« 1 femme + 1 enfant ») en tête, heure à droite, jusqu'à 3
// lignes (prestations puis extras — boisson, produit à emporter), le reste
// résumé en « + N de plus », Total, puis « Voir les détails ». Écart
// back-office : pas d'« Encaisser » (pas de caisse ici).

const MAX_VISIBLE_ITEMS = 3;
const SLOT_MIN = 120;

type ItemRow = { key: string; label: string; note: string; warn?: boolean };

const formatHour = (min: number) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

type SlotState = "past" | "current" | "upcoming";

function SlotRail({ start, state, last }: { start: number; state: SlotState; last: boolean }) {
  const current = state === "current";
  const past = state === "past";
  return (
    <div className="relative w-32 shrink-0 pt-4">
      {!last && <span aria-hidden className="absolute top-8 -bottom-14 left-[11px] w-0.5 bg-primary/25" />}
      <div className="sticky top-6 flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-base-100",
            current ? "border-primary ring-4 ring-primary/15" : past ? "border-primary/30" : "border-primary",
          )}
        >
          {current && <span className="size-2.5 rounded-full bg-primary" />}
          {past && <span className="size-2 rounded-full bg-primary/30" />}
        </span>
        <div className="leading-tight">
          <p className={cn("text-2xl font-semibold tabular-nums", past ? "text-base-content/50" : "text-base-content")}>
            {formatHour(start)}
          </p>
          <p className={cn("mt-1 text-sm tabular-nums", past ? "text-base-content/45" : "text-base-content/65")}>
            <span aria-hidden>→</span>
            <span className="sr-only">jusqu&apos;à</span> {formatHour(start + SLOT_MIN)}
          </p>
          {current && <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">En cours</p>}
        </div>
      </div>
    </div>
  );
}

function dateGroupLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Aujourd'hui";
  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${iso}T00:00:00`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const staffLine = (p: RdvPrestation) =>
  p.staff ? (p.secondStaff ? `${p.staff.split(" ")[0]} + ${p.secondStaff.split(" ")[0]}` : p.staff.split(" ")[0]) : null;

function itemsOf(r: RdvDetail): ItemRow[] {
  const items: ItemRow[] = r.prestations.map((p) => {
    const staff = staffLine(p);
    return { key: p.id, label: p.name, note: staff ?? "Aucune praticienne", warn: !staff };
  });
  for (const e of r.extras ?? []) {
    const name = productName(e.productId);
    items.push({
      key: e.id,
      label: e.qty > 1 ? `${e.qty}× ${name}` : name,
      note: productKind(e.productId) === "boisson" ? "Boisson" : "Produit à emporter",
    });
  }
  return items;
}

export default function DayList({
  rdvs,
  todayIso,
  nowTime,
  onOpen,
}: {
  rdvs: RdvDetail[];
  todayIso: string;
  nowTime: string;
  onOpen: (id: string) => void;
}) {
  const now = timeToMinutes(nowTime);

  // Par jour puis par tranche de 2 h — à heure égale, par nom de payeuse.
  const dateGroups = useMemo(() => {
    const sorted = [...rdvs].sort(
      (a, b) =>
        a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)) ||
        rdvStartTime(a).localeCompare(rdvStartTime(b)) ||
        a.client.name.localeCompare(b.client.name, "fr"),
    );
    const byDate = new Map<string, RdvDetail[]>();
    for (const r of sorted) {
      const d = r.date.slice(0, 10);
      byDate.set(d, [...(byDate.get(d) ?? []), r]);
    }
    return [...byDate.entries()].map(([date, list]) => {
      const slots = new Map<number, RdvDetail[]>();
      for (const r of list) {
        const s = Math.floor(timeToMinutes(rdvStartTime(r)) / SLOT_MIN) * SLOT_MIN;
        slots.set(s, [...(slots.get(s) ?? []), r]);
      }
      return { date, slots: [...slots.entries()] };
    });
  }, [rdvs]);
  const showDateHeaders = dateGroups.length > 1;

  return (
    <div className="flex flex-col gap-8">
      {dateGroups.map(({ date, slots }, i) => (
        <div key={date} className={cn("flex flex-col gap-6", showDateHeaders && i > 0 && "border-t border-base-300 pt-8")}>
          {showDateHeaders && <p className="pl-1 text-base font-semibold text-base-content">{dateGroupLabel(date, todayIso)}</p>}
          {slots.map(([slotStart, slotRdvs], slotIndex) => {
            const slotEnd = slotStart + SLOT_MIN;
            const slotState: SlotState =
              date !== todayIso
                ? date < todayIso
                  ? "past"
                  : "upcoming"
                : slotEnd <= now
                  ? "past"
                  : slotStart <= now
                    ? "current"
                    : "upcoming";
            return (
              <div key={slotStart} className="flex gap-6">
                <SlotRail start={slotStart} state={slotState} last={slotIndex === slots.length - 1} />
                <div className="grid min-w-0 flex-1 grid-cols-3 gap-4">
                  {slotRdvs.map((r) => {
                    const items = itemsOf(r);
                    const visible = items.slice(0, MAX_VISIBLE_ITEMS);
                    const hidden = items.length - visible.length;
                    const start = rdvStartTime(r);
                    const end = rdvEndTime(r);
                    const cancelled = r.status === "annulé";
                    const past =
                      r.status !== "à venir" || date < todayIso || (date === todayIso && timeToMinutes(end) <= now);
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "flex h-full flex-col gap-3 rounded-field border border-base-300 bg-base-100 p-4",
                          (past || cancelled) && "opacity-70",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onOpen(r.id)}
                          className="flex min-w-0 items-start justify-between gap-3 text-left transition active:opacity-70"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar
                              initial={initialsOf(r.client.name)}
                              size={32}
                              className="mt-0.5 shrink-0 bg-accent text-xs font-bold text-base-content"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-xl font-medium text-base-content">{r.client.name}</span>
                              <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-base-content/65">
                                {cancelled ? "Annulé" : reservationComposition(r)}
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right leading-tight">
                            <span className="block text-base font-medium tabular-nums text-base-content">{start}</span>
                            <span className="mt-0.5 block text-sm tabular-nums text-base-content/55">→ {end}</span>
                          </span>
                        </button>

                        <div className="flex flex-col gap-1.5 border-t border-base-300 pt-3">
                          {visible.map((item) => (
                            <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-base-content/75">{item.label}</span>
                              <span className={cn("shrink-0", item.warn ? "font-medium text-warning" : "text-base-content/60")}>
                                {item.note}
                              </span>
                            </div>
                          ))}
                          {hidden > 0 && <div className="text-sm text-base-content/60">+ {hidden} de plus</div>}
                        </div>

                        <div className="flex items-center justify-between border-t border-base-300 pt-3 text-sm font-semibold">
                          <span className="text-base-content/65">Total</span>
                          <span className="tabular-nums text-base-content">{fcfa(rdvTotal(r))}</span>
                        </div>

                        <div className="mt-auto pt-1">
                          <Button variant="outline" className="w-full" onClick={() => onOpen(r.id)}>
                            Voir les détails
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
