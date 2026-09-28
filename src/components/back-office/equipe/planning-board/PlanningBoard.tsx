"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { useLocation } from "@/context/LocationContext";
import { usePlanningData } from "@/context/PlanningContext";
import { salons, type SalonId, type SalonScope } from "@/lib/mock/beautyandco";
import { TODAY_ISO, addDays, mondayOf, newAbsenceId } from "@/lib/mock/planning";
import { allRendezvous, autoAssign } from "@/lib/mock/rendezvous";
import { initials, type Member } from "@/lib/mock/staff";
import { DayTimeline } from "./DayTimeline";
import { WeekTimeline } from "./WeekTimeline";
import { PeriodNav, type PlanningPeriod } from "./PeriodNav";
import {
  dateOf,
  isClosed,
  planningRows,
  salonLabel,
  salonsOfWeek,
  schedulableMembers,
  shiftsFor,
  type PlanningRow,
} from "./data";

/**
 * Onglet « Planning » de l'écran Équipe — copie de l'écran Planning de point-de-vente
 * (`components/planning/planning-board.tsx`, demande explicite de la propriétaire le
 * 2026-09-27) à la place de l'ancienne matrice de présence (`PlanningPanel` + `PlanningGrid`).
 * Le programme de chaque praticienne sur une seule surface : vue Jour (une colonne par
 * praticienne, le temps en vertical) et Semaine (une ligne par praticienne, 7 cellules).
 *
 * Adaptations back-office : filtre salon = le filtre global (`useLocation`) ; présence lue
 * dans `PlanningContext` (partagée avec l'agenda `/rendez-vous` — « Marquer absente
 * aujourd'hui » pose une vraie absence datée, visible des deux côtés) ; rendez-vous = les
 * fixtures `@/lib/mock/rendezvous` ; clic sur un rendez-vous → sa fiche en panneau latéral
 * (`/rendez-vous/[id]`, route interceptée) au lieu de la feuille d'encaissement de
 * point-de-vente (pas de caisse dans le back-office).
 */

type MetierFilter = "tous" | "coiffure" | "esthetique";
const METIER_OPTIONS: { value: MetierFilter; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "coiffure", label: "Coiffeurs" },
  { value: "esthetique", label: "Esthéticiens" },
];

const SALON_OPTIONS = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as string, label: s.name })),
];

export default function PlanningBoard() {
  const router = useRouter();
  const { scope, setScope } = useLocation();
  const { data, addAbsence } = usePlanningData();

  const todayIso = TODAY_ISO;
  const [iso, setIso] = useState(TODAY_ISO);
  const [period, setPeriod] = useState<PlanningPeriod>("jour");
  const [metierFilter, setMetierFilter] = useState<MetierFilter>("tous");
  const [visibleIds, setVisibleIds] = useState<Set<string> | null>(null);
  const [order, setOrder] = useState<string[]>(() => schedulableMembers().map((m) => m.id));

  const isToday = iso === todayIso;
  const salonId: SalonId | null = scope === "all" ? null : scope;
  const isWeek = period === "semaine";

  const base = useMemo(() => schedulableMembers(), []);
  // Index d'accent = position dans l'équipe planifiable (même règle que `staff-colors.ts`),
  // indépendant du réordonnancement et des filtres.
  const accentIndex = useMemo(() => new Map(base.map((m, i) => [m.id, i] as const)), [base]);
  const schedulable = useMemo(
    () => order.map((id) => base.find((m) => m.id === id)).filter((m): m is Member => Boolean(m)),
    [order, base],
  );

  const weekDays = useMemo(() => {
    const monday = mondayOf(iso);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [iso]);

  // Praticiennes réaffectées d'office si une absence vient d'être posée.
  const rowsAll = useMemo(() => planningRows(autoAssign(allRendezvous(), data)), [data]);
  const dayRows = useMemo(
    () => rowsAll.filter((r) => r.dateIso === iso && (!salonId || r.salonId === salonId)),
    [rowsAll, iso, salonId],
  );

  // Pas de salon fixe : un salon regardé retient, pour le jour affiché, celles qui y ont une
  // plage ou un rendez-vous — plus, en repos ce jour-là, celles qui y travaillent dans la
  // semaine. En semaine : celles qui y travaillent au fil de la semaine.
  const bySalon = useMemo(() => {
    const byMetier = schedulable.filter((p) => metierFilter === "tous" || p.category === metierFilter);
    if (!salonId) return byMetier;
    const hasRowsHere = (p: Member, rows: PlanningRow[]) =>
      rows.some((r) => r.salonId === salonId && (r.staffId === p.id || r.secondStaffId === p.id));
    const monday = weekDays[0];
    if (isWeek) {
      const weekSet = new Set(weekDays);
      const weekRows = rowsAll.filter((r) => weekSet.has(r.dateIso));
      return byMetier.filter((p) => salonsOfWeek(p.id, monday, data).includes(salonId) || hasRowsHere(p, weekRows));
    }
    return byMetier.filter((p) => {
      const shifts = shiftsFor(p.id, iso, data);
      return (
        shifts.some((s) => s.salonId === salonId) ||
        hasRowsHere(p, dayRows) ||
        (shifts.length === 0 && salonsOfWeek(p.id, monday, data).includes(salonId))
      );
    });
  }, [schedulable, metierFilter, salonId, isWeek, weekDays, rowsAll, dayRows, iso, data]);

  const closedSalon = !isWeek && salonId && isClosed(salonId, iso) ? salonId : null;
  const otherSalon = salons.find((s) => s.id !== salonId);
  const elsewhereToday = closedSalon
    ? schedulable.filter((p) => shiftsFor(p.id, iso, data).some((s) => s.salonId !== closedSalon))
    : [];

  const allIds = useMemo(() => new Set(bySalon.map((p) => p.id)), [bySalon]);
  const activeVisible = visibleIds ?? allIds;
  const staff = bySalon.filter((p) => activeVisible.has(p.id));
  const isolatedId = activeVisible.size === 1 ? [...activeVisible][0] : null;

  const isolate = (id: string) => setVisibleIds(new Set([id]));
  const showAll = () => setVisibleIds(null);
  const changeSalonFilter = (value: string) => {
    setScope(value as SalonScope);
    setVisibleIds(null);
  };
  const changeMetierFilter = (value: string) => {
    setMetierFilter(value as MetierFilter);
    setVisibleIds(null);
  };
  const pickDay = (d: string, staffId?: string) => {
    setIso(d);
    setPeriod("jour");
    if (staffId) isolate(staffId);
  };
  const markAbsent = (memberId: string) =>
    addAbsence({ id: newAbsenceId(), memberId, from: todayIso, to: todayIso, type: "repos", reason: "Absente aujourd'hui" });
  const reorder = (draggedId: string, targetId: string) =>
    setOrder((list) => {
      const next = list.filter((id) => id !== draggedId);
      next.splice(next.indexOf(targetId), 0, draggedId);
      return next;
    });
  const openRdv = (id: string) => router.push(`/rendez-vous/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <SegmentedToggle
          size="sm"
          value={metierFilter}
          onChange={changeMetierFilter}
          options={METIER_OPTIONS}
          aria-label="Filtrer par métier"
        />
        <SegmentedToggle
          size="sm"
          value={scope}
          onChange={changeSalonFilter}
          options={SALON_OPTIONS}
          aria-label="Filtrer par salon"
        />
      </div>

      <PeriodNav period={period} onPeriodChange={setPeriod} iso={iso} onDateChange={setIso} todayIso={todayIso} />

      <div className="min-w-0 overflow-hidden rounded-box border border-base-300 bg-base-100">
        {isWeek ? (
          <WeekTimeline
            weekDays={weekDays}
            salonId={salonId}
            todayIso={todayIso}
            staff={staff}
            accentIndex={accentIndex}
            allRows={rowsAll}
            data={data}
            isolatedId={isolatedId}
            onPickDay={pickDay}
            onIsolate={isolate}
            onShowAll={showAll}
            onMarkAbsent={markAbsent}
          />
        ) : closedSalon ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-base-200 text-base-content/45">
              <Store aria-hidden className="size-6" />
            </span>
            <div>
              <p className="font-[family-name:var(--font-heading)] text-[15px] font-semibold text-base-content">
                {salonLabel(closedSalon)} est fermé le{" "}
                {new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(dateOf(iso))}
              </p>
              <p className="mt-1 text-sm text-base-content/50">Aucun rendez-vous ne s&apos;y tient ce jour-là.</p>
            </div>
            {elsewhereToday.length > 0 && otherSalon && (
              <div className="flex items-center gap-2 rounded-full bg-base-200/70 py-1 pl-1 pr-3 text-sm text-base-content/65">
                <span className="flex -space-x-2">
                  {elsewhereToday.map((p) => (
                    <Avatar
                      key={p.id}
                      initial={initials(p)}
                      size={26}
                      className="bg-base-300 text-[0.65rem] font-semibold ring-2 ring-base-100"
                    />
                  ))}
                </span>
                {elsewhereToday.map((p) => p.firstName).join(", ")}{" "}
                {elsewhereToday.length > 1 ? "travaillent" : "travaille"} à {otherSalon.name}
              </div>
            )}
            {otherSalon && (
              <Button variant="outline" size="sm" onClick={() => changeSalonFilter(otherSalon.id)}>
                Voir {otherSalon.name}
              </Button>
            )}
          </div>
        ) : (
          <DayTimeline
            iso={iso}
            salonId={salonId}
            isToday={isToday}
            staff={staff}
            accentIndex={accentIndex}
            rows={dayRows}
            data={data}
            isolatedId={isolatedId}
            onOpenRdv={openRdv}
            onIsolate={isolate}
            onShowAll={showAll}
            onMarkAbsent={markAbsent}
            onReorder={reorder}
          />
        )}
      </div>
    </div>
  );
}
