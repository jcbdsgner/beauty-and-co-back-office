"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import Alert from "@/components/ui/alert/Alert";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { usePlanningData } from "@/context/PlanningContext";
import {
  ABSENCE_LABELS,
  addDays,
  mondayOf,
  shiftRangeLabel,
  weekPresence,
} from "@/lib/mock/planning";
import {
  POSTE_TYPES,
  POSTE_TYPE_LABELS,
  frShortDate,
  isClosed,
  salonConfig,
  salonName,
  salons,
  type PosteType,
  type SalonId,
  type SalonScope,
  type Weekday,
} from "@/lib/mock/beautyandco";
import { accentForMemberId, accentForStaffName } from "@/lib/mock/staff-colors";
import { fullName, members, memberById } from "@/lib/mock/staff";
import {
  RDV_STATUS_META,
  allRendezvous,
  frFullDate,
  rdvCountByStaffDay,
  rdvEnd,
  rendezvousRows,
  type RdvDetail,
  type RdvPrestation,
  type RdvStatus,
} from "@/lib/mock/rendezvous";
import DayTimeline, { type TimelineRow } from "@/components/back-office/rendezvous/DayTimeline";
import WeekTimeline, { type WeekRow } from "@/components/back-office/rendezvous/WeekTimeline";
import ListView from "@/components/back-office/rendezvous/ListView";
import BookingDialog from "@/components/back-office/rendezvous/BookingDialog";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";
import AbsenceDialog from "@/components/back-office/planning/AbsenceDialog";

// Écran « Rendez-vous » — une destination, deux vues (Liste + Agenda).
// 1. Où en est la propriétaire ? Coup d'œil courant (« qui vient aujourd'hui,
//    à quelle heure, pour quoi, qui s'en occupe »), ou gestion d'un imprévu
//    (affecter une praticienne, déplacer, annuler). Souvent pressée.
// 2. Ce qui doit sauter aux yeux : la cliente qui vient, puis l'heure, puis ce
//    qui demande une action — les prestations encore sans praticienne.
// 3. Quand ça se passe mal : journée vide → les clientes réservent en ligne ;
//    praticienne demandée absente → alerte sur la fiche ; salon fermé → bandeau ;
//    rendez-vous annulés → toujours consultables via le filtre « Annulés ».
//
// Un rendez-vous n'a pas d'étape de confirmation : dès qu'une cliente réserve,
// il est « à venir ». L'acompte demandé à la réservation est le même pour toutes
// (réglé dans Paiement) — il n'est donc pas affiché rendez-vous par rendez-vous.

const TODAY_ISO = "2026-09-03";
const NOW_TIME = "13:20";

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

const VIEW_OPTIONS: SegmentedOption<"liste" | "agenda">[] = [
  { value: "liste", label: "Liste" },
  { value: "agenda", label: "Agenda" },
];

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const weekdayOf = (iso: string): Weekday =>
  WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];

/* -------------------------------------------------------------- helpers */

// Fenêtre horaire de l'agenda = amplitude d'ouverture des salons du périmètre.
const dayWindow = (scopeIds: SalonId[], iso: string) => {
  const wd = weekdayOf(iso);
  let min = "23:59";
  let max = "00:00";
  for (const id of scopeIds) {
    const h = salonConfig(id).hours[wd];
    if (h.closed) continue;
    if (h.open < min) min = h.open;
    if (h.close > max) max = h.close;
  }
  return min >= max ? { min: "08:00", max: "20:00" } : { min, max };
};

// Occupation par type de poste à un instant de référence (chevauchements).
const occupancyAt = (
  list: RdvDetail[],
  salonId: SalonId,
  iso: string,
  refTime: string,
): Record<PosteType, number> => {
  const ref = new Date(`${iso}T${refTime}:00`).getTime();
  const counts: Record<PosteType, number> = { coiffure: 0, esthetique: 0, onglerie: 0 };
  for (const r of list) {
    if (r.salon !== salonId || r.date.slice(0, 10) !== iso) continue;
    if (RDV_STATUS_META[r.status].closed) continue;
    const start = new Date(r.date.replace(" ", "T")).getTime();
    const end = new Date(rdvEnd(r)).getTime();
    if (ref < start || ref >= end) continue;
    for (const t of new Set(r.prestations.map((p) => p.posteType))) counts[t] += 1;
  }
  return counts;
};

/* -------------------------------------------------------------- agenda */

function AgendaView({
  rdvs,
  scope,
  onOpen,
  onMove,
}: {
  rdvs: RdvDetail[];
  scope: SalonScope;
  onOpen: (id: string) => void;
  onMove: (id: string, startIso: string) => void;
}) {
  const [period, setPeriod] = useState<"jour" | "semaine">("jour");
  const [selectedIso, setSelectedIso] = useState(TODAY_ISO);
  // Isoler une praticienne / réordonner les lignes — pur confort d'affichage,
  // pas partagé avec l'onglet Planning (chaque écran garde sa propre vue).
  const [isolated, setIsolated] = useState<string | null>(null);
  const [rowOrder, setRowOrder] = useState<string[]>([]);
  const { data: planningData, addAbsence } = usePlanningData();
  const [absenceMemberId, setAbsenceMemberId] = useState<string | null>(null);

  const scopeIds: SalonId[] = scope === "all" ? salons.map((s) => s.id) : [scope];
  const win = dayWindow(scopeIds, selectedIso);
  const monday = mondayOf(selectedIso);
  const { days, rows: presenceRows } = useMemo(
    () => weekPresence(scope, monday, planningData),
    [scope, monday, planningData],
  );
  const unorderedPractitionerRows = useMemo(
    () => presenceRows.filter((r) => r.member.roles.includes("praticienne")),
    [presenceRows],
  );
  const practitionerRows = useMemo(() => {
    if (rowOrder.length === 0) return unorderedPractitionerRows;
    const byId = new Map(unorderedPractitionerRows.map((r) => [r.member.id, r]));
    const ordered = rowOrder.map((id) => byId.get(id)).filter((r): r is (typeof unorderedPractitionerRows)[number] => Boolean(r));
    const rest = unorderedPractitionerRows.filter((r) => !rowOrder.includes(r.member.id));
    return [...ordered, ...rest];
  }, [unorderedPractitionerRows, rowOrder]);
  const dayIndex = days.findIndex((d) => d.iso === selectedIso);

  const reorderRows = (draggedId: string, targetId: string) => {
    const base = rowOrder.length > 0 ? rowOrder : unorderedPractitionerRows.map((r) => r.member.id);
    const withoutDragged = base.filter((id) => id !== draggedId);
    const targetIdx = withoutDragged.indexOf(targetId);
    withoutDragged.splice(targetIdx === -1 ? withoutDragged.length : targetIdx, 0, draggedId);
    setRowOrder(withoutDragged);
  };

  // Rendez-vous non annulés de la praticienne visée par le dialogue d'absence,
  // par jour — pour l'alerte de conflit (même logique que `equipe/PlanningPanel`).
  const absenceMember = absenceMemberId ? memberById(absenceMemberId) : null;
  const absenceRdvDays = useMemo(() => {
    if (!absenceMember) return [];
    return rdvCountByStaffDay("all")
      .filter((r) => r.staffFirstName === absenceMember.firstName)
      .map((r) => ({ date: r.date, count: r.count }));
  }, [absenceMember]);

  const rdvCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rdvCountByStaffDay(scope)) map.set(`${r.date}__${r.staffFirstName}`, r.count);
    return map;
  }, [scope]);

  const dayRdvs = rdvs.filter(
    (r) => (scope === "all" || r.salon === scope) && r.date.slice(0, 10) === selectedIso && r.status !== "annulé",
  );
  const pendingCount = dayRdvs.reduce(
    (sum, r) => sum + r.prestations.filter((p) => p.staff === null).length,
    0,
  );

  const timelineRows: TimelineRow[] = useMemo(() => {
    const base: TimelineRow[] = practitionerRows.map((r) => {
      const pres = r.cells[dayIndex];
      const accent = accentForMemberId(r.member.id);
      const label = fullName(r.member);
      if (pres?.state === "present") {
        return {
          key: r.member.id,
          label,
          sublabel: scope === "all" ? `${shiftRangeLabel(pres)} · ${salonName(pres.salonId)}` : shiftRangeLabel(pres),
          accent,
          hours: { start: pres.start, end: pres.end },
        };
      }
      if (pres?.state === "absent") {
        return { key: r.member.id, label, sublabel: ABSENCE_LABELS[pres.type], accent, absent: true };
      }
      return { key: r.member.id, label, sublabel: "Repos", accent };
    });
    if (pendingCount > 0) {
      base.unshift({
        key: "pending",
        label: "À affecter",
        sublabel: `${pendingCount} prestation${pendingCount > 1 ? "s" : ""} sans praticienne`,
        accent: accentForStaffName(null),
        pending: true,
      });
    }
    return base;
  }, [practitionerRows, dayIndex, scope, pendingCount]);
  const visibleTimelineRows = isolated ? timelineRows.filter((r) => r.key === isolated) : timelineRows;

  const weekRows: WeekRow[] = useMemo(
    () =>
      practitionerRows.map((r) => ({
        memberId: r.member.id,
        label: fullName(r.member),
        cells: days.map((d, i) => {
          const pres = r.cells[i];
          const count = rdvCountMap.get(`${d.iso}__${r.member.firstName}`) ?? 0;
          if (pres.state === "present") return { hours: { start: pres.start, end: pres.end }, count };
          if (pres.state === "absent") return { count: 0, absent: true };
          return { count: 0, off: true };
        }),
      })),
    [practitionerRows, days, rdvCountMap],
  );
  const visibleWeekRows = isolated ? weekRows.filter((r) => r.memberId === isolated) : weekRows;

  const closedDays = scopeIds.every((id) => isClosed(id, selectedIso));
  const isToday = selectedIso === TODAY_ISO;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedIso((iso) => addDays(iso, period === "jour" ? -1 : -7))}
            aria-label="Période précédente"
            className="flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setSelectedIso((iso) => addDays(iso, period === "jour" ? 1 : 7))}
            aria-label="Période suivante"
            className="flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            ›
          </button>
          <span className="min-w-56 text-theme-sm font-semibold text-gray-800">
            {period === "jour" ? frFullDate(selectedIso) : `Semaine du ${frShortDate(monday)}`}
          </span>
          {selectedIso !== TODAY_ISO && (
            <button
              type="button"
              onClick={() => setSelectedIso(TODAY_ISO)}
              className="rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-brand-600 transition hover:bg-brand-50"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>
        <SegmentedControl
          options={
            [
              { value: "jour", label: "Jour" },
              { value: "semaine", label: "Semaine" },
            ] as SegmentedOption<"jour" | "semaine">[]
          }
          value={period}
          onChange={setPeriod}
          aria-label="Vue Jour ou Semaine"
        />
      </div>

      <CapacityBanner rdvs={rdvs} scopeIds={scopeIds} iso={selectedIso} />
      {closedDays && period === "jour" && (
        <Alert
          variant="info"
          title="Salon fermé ce jour-là"
          message="Aucun créneau réservable. Les rendez-vous existants restent consultables."
        />
      )}

      {period === "jour" ? (
        <DayTimeline
          iso={selectedIso}
          windowStart={win.min}
          windowEnd={win.max}
          isToday={isToday}
          nowTime={NOW_TIME}
          rows={visibleTimelineRows}
          rdvs={dayRdvs}
          onOpen={onOpen}
          onMove={onMove}
          isolated={isolated}
          onIsolate={setIsolated}
          onShowAll={() => setIsolated(null)}
          onMarkAbsent={(key) => setAbsenceMemberId(key)}
          onReorderRow={reorderRows}
        />
      ) : (
        <WeekTimeline
          days={days}
          rows={visibleWeekRows}
          todayIso={TODAY_ISO}
          onPickDay={(iso, memberId) => {
            setSelectedIso(iso);
            setPeriod("jour");
            if (memberId) setIsolated(memberId);
          }}
          isolated={isolated}
          onIsolate={setIsolated}
          onShowAll={() => setIsolated(null)}
          onMarkAbsent={(memberId) => setAbsenceMemberId(memberId)}
        />
      )}

      <AbsenceDialog
        open={absenceMemberId !== null}
        member={absenceMember}
        defaultDate={TODAY_ISO}
        rdvDays={absenceRdvDays}
        onClose={() => setAbsenceMemberId(null)}
        onSubmit={(absence) => {
          addAbsence(absence);
          setAbsenceMemberId(null);
        }}
      />
    </div>
  );
}

function CapacityBanner({
  rdvs,
  scopeIds,
  iso,
}: {
  rdvs: RdvDetail[];
  scopeIds: SalonId[];
  iso: string;
}) {
  const ref = iso === TODAY_ISO ? NOW_TIME : "12:00";
  return (
    <div className="flex flex-wrap gap-3">
      {scopeIds.map((id) => {
        const occ = occupancyAt(rdvs, id, iso, ref);
        const postes = salonConfig(id).postes;
        return (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-theme-xs"
          >
            <span className="font-semibold text-gray-700">{salonName(id)}</span>
            <span className="text-gray-300">·</span>
            {POSTE_TYPES.map((t) => {
              const cap = postes[t] ?? 0;
              if (cap === 0) return null;
              const used = occ[t];
              const full = used >= cap;
              return (
                <span key={t} className={full ? "font-semibold text-warning-700" : "text-gray-600"}>
                  {POSTE_TYPE_LABELS[t]} {used}/{cap}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- shell */

type ListFilter = "upcoming" | "today" | "past" | "cancelled" | "all";

const LIST_FILTERS: [ListFilter, string][] = [
  ["upcoming", "À venir"],
  ["today", "Aujourd'hui"],
  ["past", "Passés"],
  ["cancelled", "Annulés"],
  ["all", "Tous"],
];

export default function RendezVous() {
  const { scope, setScope } = useLocation();
  // Même source que l'agenda (§ AgendaView) et l'onglet Planning d'Équipe —
  // pour que les menus d'affectation (fiche RDV, nouveau rendez-vous) tiennent
  // compte d'une absence tout juste posée, sans attendre un rechargement.
  const { data: planningData } = usePlanningData();
  const [rdvs, setRdvs] = useState<RdvDetail[]>(() => allRendezvous());
  const [view, setView] = useState<"liste" | "agenda">("liste");
  const [listFilter, setListFilter] = useState<ListFilter>("upcoming");
  const [assignOnly, setAssignOnly] = useState(false);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ?nouveau=1 : ouverture directe du dialog de réservation, utilisée par le
  // bouton « Nouveau RDV » du tableau de bord (`dashboard/DashboardHeader`).
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("nouveau") === "1") setNewOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 3200);
  };

  const rows = useMemo(() => rendezvousRows(rdvs, scope), [rdvs, scope]);

  const assignCount = rows.filter((r) => r.needsAssign).length;

  // Indépendant du salon affiché : une praticienne n'est rattachée à aucun
  // salon fixe, la filtrer par salon ici n'aurait pas de sens.
  const staffList = useMemo(() => members.filter((m) => m.roles.includes("praticienne")), []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const day = r.date.slice(0, 10);
      if (listFilter === "upcoming" && r.status !== "à venir") return false;
      if (listFilter === "today" && (day !== TODAY_ISO || r.status === "annulé")) return false;
      if (listFilter === "past" && r.status !== "terminé" && r.status !== "absence") return false;
      if (listFilter === "cancelled" && r.status !== "annulé") return false;
      if (assignOnly && !r.needsAssign) return false;
      if (staffFilter !== "all" && !r.staffNames.includes(staffFilter)) return false;
      return true;
    });
  }, [rows, listFilter, assignOnly, staffFilter]);

  const selected = selectedId ? rdvs.find((r) => r.id === selectedId) ?? null : null;

  /* ---- mutations ---- */

  const patch = (id: string, fn: (r: RdvDetail) => RdvDetail) =>
    setRdvs((list) => list.map((r) => (r.id === id ? fn(r) : r)));

  const assign = (id: string, prestationId: string, staff: string | null) =>
    patch(id, (r) => ({
      ...r,
      prestations: r.prestations.map((p) => (p.id === prestationId ? { ...p, staff } : p)),
    }));

  const updatePrestation = (id: string, prestationId: string, fields: Partial<RdvPrestation>) =>
    patch(id, (r) => ({
      ...r,
      prestations: r.prestations.map((p) => (p.id === prestationId ? { ...p, ...fields } : p)),
    }));

  const addPrestation = (id: string, line: RdvPrestation) =>
    patch(id, (r) => ({ ...r, prestations: [...r.prestations, line] }));

  const removePrestation = (id: string, prestationId: string) =>
    patch(id, (r) => ({ ...r, prestations: r.prestations.filter((p) => p.id !== prestationId) }));

  const cancelWithReason = (id: string, reason: string) =>
    patch(id, (r) => ({ ...r, status: "annulé", cancelReason: reason || undefined }));

  const setStatus = (id: string, status: RdvStatus) => {
    patch(id, (r) => ({ ...r, status }));
    if (status === "annulé") flash("Rendez-vous annulé — cliente prévenue par email.");
    if (status === "à venir") flash("Rendez-vous rétabli — cliente prévenue par email.");
  };

  const remove = (id: string) => {
    setRdvs((list) => list.filter((r) => r.id !== id));
    setSelectedId(null);
    flash("Rendez-vous supprimé — aucun email envoyé.");
  };

  const move = (id: string, startIso: string) => {
    patch(id, (r) => ({ ...r, date: startIso }));
    flash("Rendez-vous déplacé — cliente prévenue par email.");
  };

  const create = (r: RdvDetail) => {
    setRdvs((list) => [...list, r]);
    setNewOpen(false);
    flash("Rendez-vous créé.");
  };

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Rendez-vous"
          actions={
            <>
              <SegmentedControl
                options={SALON_OPTIONS}
                value={scope}
                onChange={setScope}
                aria-label="Filtrer par salon"
                variant="tinted"
              />
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <Plus className="h-[14px] w-[14px]" />
                Nouveau rendez-vous
              </button>
            </>
          }
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            aria-label="Vue Liste ou Agenda"
          />
        </div>

        {assignCount > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setView("liste");
                setAssignOnly((v) => !v);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-theme-xs font-medium transition ${
                assignOnly
                  ? "border-warning-300 bg-warning-100 text-warning-800"
                  : "border-warning-200 bg-warning-50 text-warning-700 hover:brightness-95"
              }`}
            >
              <span className="tabular-nums font-semibold">{assignCount}</span>
              {assignCount > 1 ? "prestations sans praticienne" : "prestation sans praticienne"}
            </button>
          </div>
        )}
      </div>

      {view === "liste" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {LIST_FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setListFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-theme-xs font-medium transition ${
                  listFilter === value
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="ml-1 h-8 rounded-lg border border-gray-200 bg-white px-2 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-hidden"
            >
              <option value="all">Toutes les praticiennes</option>
              {staffList.map((m) => (
                <option key={m.id} value={fullName(m)}>
                  {fullName(m)}
                </option>
              ))}
            </select>
          </div>
          <ListView rows={filteredRows} onOpen={setSelectedId} />
        </div>
      ) : (
        <AgendaView rdvs={rdvs} scope={scope} onOpen={setSelectedId} onMove={move} />
      )}

      {rows.length === 0 && view === "agenda" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-theme-sm text-gray-500">
          Aucun rendez-vous — les clientes réservent en ligne, ou{" "}
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="font-medium text-brand-500 hover:text-brand-600"
          >
            créez-en un
          </button>
          .
        </div>
      )}

      {selected && (
        <RendezVousDetail
          detail={selected}
          closeMode="list"
          onClose={() => setSelectedId(null)}
          onAssign={(pid, staff) => assign(selected.id, pid, staff)}
          onStatusChange={(s) => setStatus(selected.id, s)}
          onDelete={() => remove(selected.id)}
          rdvs={rdvs}
          onUpdatePrestation={(pid, patchFields) => updatePrestation(selected.id, pid, patchFields)}
          onAddPrestation={(line) => addPrestation(selected.id, line)}
          onRemovePrestation={(pid) => removePrestation(selected.id, pid)}
          onCancelWithReason={(reason) => cancelWithReason(selected.id, reason)}
          onOpenBooking={() => setNewOpen(true)}
          planningData={planningData}
        />
      )}

      {newOpen && (
        <BookingDialog
          scope={scope}
          rdvs={rdvs}
          onCancel={() => setNewOpen(false)}
          onCreate={create}
          planningData={planningData}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-theme-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
