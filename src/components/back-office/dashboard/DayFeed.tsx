"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarX2, ChevronDown, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/atoms/button";
import { accentForStaffName } from "@/lib/mock/staff-colors";
import { RDV_STATUS_META } from "@/lib/mock/rendezvous";
import { isClosed, scopeIds, singleSalon, type SalonScope } from "@/lib/mock/beautyandco";
import { TODAY_ISO } from "@/lib/mock/planning";
import { NOW, visitSalon, type TodayVisit } from "@/components/back-office/dashboard/today";

// « La journée » : un seul fil, tous salons confondus, du matin au soir. Le
// passé est replié derrière une ligne (il occupait la moitié de la colonne à
// 13:20) ; le trait « maintenant » sépare ce qui est fait de ce qui reste.

function StaffCell({ v }: { v: TodayVisit }) {
  if (v.closed) {
    return (
      <span className="text-sm text-base-content/60">{RDV_STATUS_META[v.rdv.status].label}</span>
    );
  }
  if (v.staffNames.length === 0) {
    return <span className="text-sm font-medium text-warning-700">Aucune praticienne disponible</span>;
  }
  const [first, ...rest] = v.staffNames;
  const accent = accentForStaffName(first);
  return (
    <span className="min-w-0 text-sm">
      <span className="flex items-center gap-2 text-base-content/80">
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: accent.dot }} />
        <span className="truncate">
          {first}
          {rest.length > 0 && <span className="text-base-content/60"> + {rest.length}</span>}
        </span>
      </span>
      {v.pendingAssign > 0 && (
        <span className="block pl-4 font-medium text-warning-700">
          {v.pendingAssign} sans praticienne disponible
        </span>
      )}
    </span>
  );
}

function VisitRow({
  v,
  showSalon,
  label,
  muted = false,
}: {
  v: TodayVisit;
  showSalon: boolean;
  label?: string;
  muted?: boolean;
}) {
  const prestations = v.rdv.prestations.map((p) => p.name).join(", ");
  const people = new Set(v.rdv.prestations.map((p) => p.beneficiaryName)).size;
  return (
    <li>
      <Link
        href={`/rendez-vous/${v.rdv.id}`}
        className={`group grid grid-cols-[60px_minmax(0,1fr)_minmax(0,11rem)_16px] items-center gap-4 px-6 py-3.5 transition-colors hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none ${
          label ? "bg-accent/40" : ""
        }`}
      >
        <span className={`tabular-nums ${muted || v.closed ? "text-base-content/50" : "text-base-content"}`}>
          <span className="block text-[15px] font-semibold">{v.start}</span>
          <span className="block text-xs text-base-content/60">{v.end}</span>
        </span>
        <span className="min-w-0">
          <span
            className={`block truncate text-[15px] font-semibold ${
              v.closed ? "text-base-content/50 line-through" : muted ? "text-base-content/70" : "text-base-content"
            }`}
          >
            {v.rdv.client.name}
          </span>
          <span className="block truncate text-sm text-base-content/60">
            {label && <span className="font-semibold text-secondary">{label} · </span>}
            {prestations}
            {people > 1 && ` · ${people} personnes`}
            {showSalon && ` · ${visitSalon(v)}`}
          </span>
        </span>
        <StaffCell v={v} />
        <ChevronRight
          className="size-4 text-base-content/30 transition-colors group-hover:text-base-content/60"
          aria-hidden
        />
      </Link>
    </li>
  );
}

function NowLine() {
  return (
    <li aria-label={`Maintenant, ${NOW}`} className="flex items-center gap-3 px-6 py-2">
      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-secondary">
        Maintenant · {NOW}
      </span>
      <span aria-hidden className="h-px flex-1 bg-brand-200" />
    </li>
  );
}

export default function DayFeed({ visits, scope }: { visits: TodayVisit[]; scope: SalonScope }) {
  const [showPast, setShowPast] = useState(false);
  const showSalon = singleSalon(scope) === null;
  const past = visits.filter((v) => v.phase === "past");
  const current = visits.filter((v) => v.phase !== "past");
  const nextId = current.find((v) => v.phase === "upcoming" && !v.closed)?.rdv.id;
  const closedToday = scope !== "all" && scopeIds(scope).every((id) => isClosed(id, TODAY_ISO));

  return (
    <section
      aria-labelledby="feed-title"
      className="overflow-hidden rounded-box border border-base-300 bg-base-100"
    >
      <header className="flex items-baseline justify-between gap-3 px-6 pt-5 pb-4">
        <h2 id="feed-title" className="text-[20px] font-semibold text-base-content">
          La journée
        </h2>
        <Link
          href="/rendez-vous"
          className="flex items-center gap-1 text-sm font-medium text-secondary hover:underline hover:underline-offset-4"
        >
          Ouvrir l&apos;agenda
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </header>

      {visits.length === 0 ? (
        <div className="flex items-start gap-4 border-t border-base-300 px-6 py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/60">
            <CalendarX2 className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-base-content">
              {closedToday ? "Le salon est fermé aujourd'hui" : "Aucun rendez-vous aujourd'hui"}
            </p>
            {!closedToday && (
              <Link
                href="/rendez-vous?nouveau=1"
                className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-3`}
              >
                Nouveau rendez-vous
              </Link>
            )}
          </div>
        </div>
      ) : (
        <ul className="border-t border-base-300">
          {past.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setShowPast((s) => !s)}
                aria-expanded={showPast}
                className="flex w-full items-center gap-2 px-6 py-3 text-left text-sm text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content focus-visible:bg-base-200 focus-visible:outline-none"
              >
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${showPast ? "" : "-rotate-90"}`}
                  aria-hidden
                />
                <span className="tabular-nums">
                  {`${past.length} rendez-vous plus tôt, de ${past[0].start} à ${past.reduce((m, v) => (v.end > m ? v.end : m), "")}`}
                </span>
              </button>
            </li>
          )}
          {showPast && (
            <li>
              <ul className="divide-y divide-base-300 border-t border-base-300">
                {past.map((v) => (
                  <VisitRow key={v.rdv.id} v={v} showSalon={showSalon} muted />
                ))}
              </ul>
            </li>
          )}

          <NowLine />

          {current.length === 0 ? (
            <li className="px-6 pt-2 pb-6 text-sm text-base-content/60">
              Plus aucun rendez-vous d&apos;ici ce soir.
            </li>
          ) : (
            <li>
              <ul className="divide-y divide-base-300">
                {current.map((v) => (
                  <VisitRow
                    key={v.rdv.id}
                    v={v}
                    showSalon={showSalon}
                    label={v.phase === "ongoing" ? "En cours" : v.rdv.id === nextId ? "Prochain" : undefined}
                  />
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
