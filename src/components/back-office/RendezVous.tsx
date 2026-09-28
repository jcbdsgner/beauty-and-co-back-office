"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarRange, ChevronRight, ListChecks, Plus, UsersRound } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import Alert from "@/components/ui/alert/Alert";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { DatePicker } from "@/components/ui/molecules/date-picker";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { cn } from "@/lib/utils";
import { useClientsData } from "@/context/ClientsContext";
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
  clientMatchesQuery,
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
import { fullName, memberById } from "@/lib/mock/staff";
import {
  RDV_STATUS_META,
  allRendezvous,
  autoAssign,
  frFullDate,
  minutesToTime,
  timeToMinutes,
  rdvCountByStaffDay,
  rdvEnd,
  type RdvDetail,
  type RdvPrestation,
  type RdvStatus,
} from "@/lib/mock/rendezvous";
import DayTimeline, { type TimelineRow } from "@/components/back-office/rendezvous/DayTimeline";
import WeekTimeline, { type WeekRow } from "@/components/back-office/rendezvous/WeekTimeline";
import DayList from "@/components/back-office/rendezvous/DayList";
import ReservationCalendar from "@/components/back-office/rendezvous/ReservationCalendar";
import { initialsOf } from "@/components/back-office/shared/PersonCard";
import { ChipFilter, Legend } from "@/components/back-office/shared/board";
import { PriseRdvModal } from "@/components/prise-rdv/prise-rdv-modal";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";
import AbsenceDialog from "@/components/back-office/planning/AbsenceDialog";

// Écran « Rendez-vous » — une destination, deux vues (Liste + Agenda).
// 1. Où en est la propriétaire ? Coup d'œil courant (« qui vient aujourd'hui,
//    à quelle heure, pour quoi, qui s'en occupe »), ou gestion d'un imprévu
//    (changer d'intervenante, déplacer, annuler). Souvent pressée.
// 2. Ce qui doit sauter aux yeux : la cliente qui vient, puis l'heure, puis
//    qui s'en occupe. Les praticiennes sont affectées automatiquement selon
//    la disponibilité de l'équipe (`autoAssign`) : il n'y a rien à « affecter ».
//    Seul signal d'action : une prestation qu'aucune praticienne ne peut
//    prendre (absence posée après la réservation) — un rendez-vous à déplacer.
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
  // par jour — pour l'alerte de conflit (même logique que l'ancien onglet Planning d'Équipe).
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
        label: "Sans praticienne",
        sublabel: `${pendingCount} prestation${pendingCount > 1 ? "s" : ""} · personne de disponible`,
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
            className="flex size-9 items-center justify-center rounded-full border border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setSelectedIso((iso) => addDays(iso, period === "jour" ? 1 : 7))}
            aria-label="Période suivante"
            className="flex size-9 items-center justify-center rounded-full border border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content"
          >
            ›
          </button>
          <span className="min-w-56 text-sm font-semibold text-base-content">
            {period === "jour" ? frFullDate(selectedIso) : `Semaine du ${frShortDate(monday)}`}
          </span>
          {selectedIso !== TODAY_ISO && (
            <button
              type="button"
              onClick={() => setSelectedIso(TODAY_ISO)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-accent"
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
            className="flex items-center gap-3 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs"
          >
            <span className="font-semibold text-base-content/80">{salonName(id)}</span>
            <span className="text-base-content/30">·</span>
            {POSTE_TYPES.map((t) => {
              const cap = postes[t] ?? 0;
              if (cap === 0) return null;
              const used = occ[t];
              const full = used >= cap;
              return (
                <span key={t} className={full ? "font-semibold text-warning-700" : "text-base-content/70"}>
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

// Vues de l'écran — « Liste » et « Calendrier » sont celles de l'Accueil de
// point-de-vente (qui fait autorité) ; « Par praticienne » est l'agenda
// d'équipe du back-office (frise par praticienne, glisser-déposer), gardé en
// plus : c'est là que la propriétaire déplace un rendez-vous.
type RdvView = "liste" | "calendrier" | "equipe";

// Numéro de réservation tel qu'affiché (`RV-1787664806861-hupke9br1`) : l'id
// complet, son suffixe (`hupke9br1`, `#hupke9br1`) ou la réf. courte le
// retrouvent — correspondance exacte, comme point-de-vente.
function reservationNumberMatches(r: RdvDetail, q: string): boolean {
  const wanted = q.replace(/^#/, "").trim().toLowerCase();
  if (!wanted) return false;
  const id = r.id.toLowerCase();
  return id === wanted || id.slice(id.lastIndexOf("-") + 1) === wanted || r.ref.replace(/^#/, "").toLowerCase() === wanted;
}

const isoToDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dateToIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(isoToDate(iso));

const MAX_CLIENT_MATCHES = 4;

export default function RendezVous() {
  const { scope, setScope } = useLocation();
  // Même source que l'agenda (§ AgendaView) et l'onglet Planning d'Équipe —
  // pour que les menus d'affectation (fiche RDV, nouveau rendez-vous) tiennent
  // compte d'une absence tout juste posée, sans attendre un rechargement.
  const { data: planningData } = usePlanningData();
  const { rows: clientRows } = useClientsData();
  const [rawRdvs, setRdvs] = useState<RdvDetail[]>(() => allRendezvous());
  // Règle métier : chaque prestation est affectée d'office à une praticienne
  // compétente, présente et libre. Recalculé à chaque changement (rendez-vous
  // déplacé, prestation ajoutée, absence posée…) ; une affectation encore
  // valable n'est jamais déplacée.
  const rdvs = useMemo(() => autoAssign(rawRdvs, planningData), [rawRdvs, planningData]);
  const [view, setView] = useState<RdvView>("liste");
  const [query, setQuery] = useState("");
  const [fromIso, setFromIso] = useState(TODAY_ISO);
  const [toIso, setToIso] = useState(TODAY_ISO);
  const [showCancelled, setShowCancelled] = useState(false);
  const [conflictOnly, setConflictOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ?nouveau=1 : ouverture directe de la réservation (bouton « Nouveau rendez-vous »
  // du tableau de bord) ; ?client=<id> : payeuse préremplie (depuis sa fiche).
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("client") ?? undefined;
  useEffect(() => {
    if (searchParams.get("nouveau") === "1") setNewOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 3200);
  };

  const [rangeStart, rangeEnd] = fromIso <= toIso ? [fromIso, toIso] : [toIso, fromIso];
  const q = query.trim();

  // Un numéro de rendez-vous est unique : il se retrouve quelles que soient
  // les dates choisies. Sinon : période + salon + recherche (payeuse ou
  // personne servie).
  const visible = useMemo(() => {
    const qq = q.toLowerCase();
    return rdvs.filter((r) => {
      if (qq && reservationNumberMatches(r, qq)) return true;
      const day = r.date.slice(0, 10);
      if (day < rangeStart || day > rangeEnd) return false;
      if (scope !== "all" && r.salon !== scope) return false;
      if (!showCancelled && r.status === "annulé") return false;
      if (conflictOnly && !(r.status === "à venir" && r.prestations.some((p) => !p.staff))) return false;
      if (!qq) return true;
      const payer = clientRows("all").find((c) => c.id === r.client.id);
      const payerMatch = payer ? clientMatchesQuery(payer, qq) : r.client.name.toLowerCase().includes(qq);
      const beneficiaryMatch = r.prestations.some((p) => p.beneficiaryName.toLowerCase().includes(qq));
      return payerMatch || beneficiaryMatch;
    });
  }, [rdvs, q, rangeStart, rangeEnd, scope, showCancelled, conflictOnly, clientRows]);

  // La même recherche retrouve aussi la fiche cliente directement.
  const clientMatches = useMemo(
    () => (q ? clientRows("all").filter((c) => clientMatchesQuery(c, q)).slice(0, MAX_CLIENT_MATCHES) : []),
    [clientRows, q],
  );

  const conflictCount = rdvs.filter(
    (r) =>
      r.status === "à venir" &&
      r.date.slice(0, 10) >= TODAY_ISO &&
      (scope === "all" || r.salon === scope) &&
      r.prestations.some((p) => !p.staff),
  ).length;

  const singleDay = rangeStart === rangeEnd;
  const effectiveView: RdvView = view === "calendrier" && !singleDay ? "liste" : view;
  const periodLabel = singleDay
    ? rangeStart === TODAY_ISO
      ? "aujourd'hui"
      : `le ${shortDate(rangeStart)}`
    : "sur cette période";
  const scopeIds: SalonId[] = scope === "all" ? salons.map((s) => s.id) : [scope];
  const closedSalon = scope !== "all" && singleDay && isClosed(scope, rangeStart) ? salonName(scope) : null;
  const closedWeekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(isoToDate(rangeStart));
  const win = dayWindow(scopeIds, rangeStart);

  const selected = selectedId ? rdvs.find((r) => r.id === selectedId) ?? null : null;

  /* ---- mutations ---- */

  const patch = (id: string, fn: (r: RdvDetail) => RdvDetail) =>
    setRdvs((list) => list.map((r) => (r.id === id ? fn(r) : r)));

  const assign = (id: string, prestationId: string, staff: string) =>
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

  const cancelWithReason = (id: string, reason: string) => {
    patch(id, (r) => ({ ...r, status: "annulé", cancelReason: reason || undefined }));
    flash("Réservation annulée — cliente prévenue par email.");
  };

  const setStatus = (id: string, status: RdvStatus) => {
    patch(id, (r) => ({ ...r, status }));
    if (status === "à venir") flash("Réservation rétablie — cliente prévenue par email.");
  };

  const move = (id: string, startIso: string) => {
    // Toutes les prestations suivent, écart entre elles conservé ; les
    // praticiennes sont réaffectées d'office si besoin (`autoAssign`).
    patch(id, (r) => {
      const delta = timeToMinutes(startIso.slice(11, 16)) - timeToMinutes(r.date.slice(11, 16));
      return {
        ...r,
        date: startIso,
        prestations: r.prestations.map((p) => ({
          ...p,
          start: minutesToTime(timeToMinutes(p.start) + delta),
        })),
      };
    });
    flash("Rendez-vous déplacé — cliente prévenue par email.");
  };

  const create = (r: RdvDetail) => {
    setRdvs((list) => [...list, r]);
    setNewOpen(false);
    flash("Rendez-vous créé.");
  };

  const viewOptions = [
    { value: "liste", label: "Liste", icon: <ListChecks className="size-4" /> },
    ...(singleDay ? [{ value: "calendrier", label: "Calendrier", icon: <CalendarRange className="size-4" /> }] : []),
    { value: "equipe", label: "Par praticienne", icon: <UsersRound className="size-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
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
              className="btn btn-primary btn-sm normal-case text-[15px] font-semibold active:scale-[0.97] disabled:!bg-base-200 disabled:!text-base-content/40 gap-2"
            >
              <Plus className="h-[14px] w-[14px]" />
              Nouveau rendez-vous
            </button>
          </>
        }
      />

      {view === "equipe" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pl-1">
            <span />
            <SegmentedToggle value={view} onChange={(v) => setView(v as RdvView)} options={viewOptions} aria-label="Vue" />
          </div>
          <AgendaView rdvs={rdvs} scope={scope} onOpen={setSelectedId} onMove={move} />
        </section>
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 pl-1">
            <span />
            <SegmentedToggle value={effectiveView} onChange={(v) => setView(v as RdvView)} options={viewOptions} aria-label="Vue" />
          </div>

          {/* Recherche à gauche, dates Du/Au calées à droite (Figma 362:470 de point-de-vente). */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <SearchInput
              placeholder="Cliente ou n° de rendez-vous"
              aria-label="Chercher une cliente ou un n° de rendez-vous"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm flex-1"
            />
            <div className="flex items-center gap-2">
              <DatePicker value={isoToDate(fromIso)} onChange={(d) => setFromIso(dateToIso(d))} placeholder="Du" className="w-44" />
              <span className="text-sm text-base-content/45">au</span>
              <DatePicker value={isoToDate(toIso)} onChange={(d) => setToIso(dateToIso(d))} placeholder="Au" className="w-44" />
              {(fromIso !== TODAY_ISO || toIso !== TODAY_ISO) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFromIso(TODAY_ISO);
                    setToIso(TODAY_ISO);
                  }}
                >
                  Aujourd&apos;hui
                </Button>
              )}
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <ChipFilter
              value={showCancelled ? "annules" : "actifs"}
              onChange={(v) => setShowCancelled(v === "annules")}
              options={[
                { value: "actifs", label: "Sans les annulés" },
                { value: "annules", label: "Afficher les annulés" },
              ]}
            />
            {conflictCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setConflictOnly((v) => !v);
                  if (!conflictOnly) setToIso(addDays(TODAY_ISO, 14));
                }}
                aria-pressed={conflictOnly}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-field border px-3.5 text-[0.8rem] font-semibold transition",
                  conflictOnly ? "border-warning bg-warning/15 text-warning" : "border-warning/40 text-warning hover:bg-warning/10",
                )}
              >
                <span className="tabular-nums">{conflictCount}</span>
                sans praticienne disponible — à déplacer
              </button>
            )}
          </div>

          {clientMatches.length > 0 && (
            <div className="mb-5 flex flex-col gap-2">
              <Legend size="section">Clientes</Legend>
              <div className="grid grid-cols-4 gap-3">
                {clientMatches.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3 transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-[0px_7px_16px_0px_rgba(0,0,0,0.06)]"
                  >
                    <Avatar initial={initialsOf(c.name)} size={36} className="shrink-0 bg-accent text-xs font-semibold text-secondary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-base-content">{c.name}</span>
                      <span className="block truncate text-xs text-base-content/55">{c.phone}</span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-base-content/35" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="rounded-field border border-dashed border-base-300 px-4 py-12 text-center">
              <p className="text-[15px] font-semibold text-base-content/60">
                {q ? "Aucun résultat" : closedSalon ? `${closedSalon} est fermé le ${closedWeekday}` : "Journée libre"}
              </p>
              <p className="mt-1 text-sm text-base-content/45">
                {q
                  ? `Aucun rendez-vous pour « ${q} » ${periodLabel}.`
                  : closedSalon
                    ? "Aucun rendez-vous ne s'y tient ce jour-là."
                    : `Aucun rendez-vous ${periodLabel}.`}
              </p>
            </div>
          ) : effectiveView === "liste" ? (
            <DayList rdvs={visible} todayIso={TODAY_ISO} nowTime={NOW_TIME} onOpen={setSelectedId} />
          ) : (
            <ReservationCalendar
              rdvs={visible}
              opening={win.min}
              closing={win.max}
              showNow={rangeStart === TODAY_ISO}
              nowTime={NOW_TIME}
              onOpen={setSelectedId}
            />
          )}
        </section>
      )}

      {selected && (
        <RendezVousDetail
          detail={selected}
          closeMode="list"
          onClose={() => setSelectedId(null)}
          onAssign={(pid, staff) => assign(selected.id, pid, staff)}
          onStatusChange={(s) => setStatus(selected.id, s)}
          rdvs={rdvs}
          onUpdatePrestation={(pid, patchFields) => updatePrestation(selected.id, pid, patchFields)}
          onAddPrestation={(line) => addPrestation(selected.id, line)}
          onRemovePrestation={(pid) => removePrestation(selected.id, pid)}
          onCancelWithReason={(reason) => cancelWithReason(selected.id, reason)}
          planningData={planningData}
        />
      )}

      {newOpen && (
        <PriseRdvModal
          open
          defaultSalonId={scope === "all" ? null : scope}
          rdvs={rdvs}
          planningData={planningData}
          initialClientId={initialClientId}
          onClose={() => setNewOpen(false)}
          onCreate={create}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-box bg-neutral px-5 py-3 text-[15px] font-medium text-neutral-content shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.4)]">
          {toast}
        </div>
      )}
    </div>
  );
}
