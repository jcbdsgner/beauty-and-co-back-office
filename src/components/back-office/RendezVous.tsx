"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarRange, ChevronRight, ListChecks, Plus, Search, UsersRound } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { DatePicker } from "@/components/ui/molecules/date-picker";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { cn } from "@/lib/utils";
import { useClientsData } from "@/context/ClientsContext";
import { useLocation } from "@/context/LocationContext";
import { usePlanningData } from "@/context/PlanningContext";
import { useNotifications } from "@/context/NotificationsContext";
import { addDays } from "@/lib/mock/planning";
import {
  clientMatchesQuery,
  isClosed,
  salonConfig,
  salonName,
  salons,
  type SalonId,
  type SalonScope,
  type Weekday,
} from "@/lib/mock/beautyandco";
import {
  allRendezvous,
  autoAssign,
  cancellationNotification,
  cancellationNotificationId,
  type RdvDetail,
  type RdvPrestation,
  type RdvStatus,
} from "@/lib/mock/rendezvous";
import PlanningBoard from "@/components/back-office/equipe/planning-board/PlanningBoard";
import DayList from "@/components/back-office/rendezvous/DayList";
import ReservationCalendar from "@/components/back-office/rendezvous/ReservationCalendar";
import { initialsOf } from "@/components/back-office/shared/PersonCard";
import { Legend } from "@/components/back-office/shared/board";
import { PriseRdvModal } from "@/components/prise-rdv/prise-rdv-modal";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";

// Écran « Rendez-vous » — une destination, trois vues (Liste, Calendrier, Par praticienne).
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
//    rendez-vous annulés → masqués des listes, retrouvables par leur n° de rendez-vous.
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


/* -------------------------------------------------------------- shell */

// Vues de l'écran — « Liste » et « Calendrier » sont celles de l'Accueil de
// point-de-vente (qui fait autorité) ; « Par praticienne » est son écran
// Planning (Jour / Semaine, Coiffeurs / Esthéticiens), repris tel quel.
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
  const { push: pushNotification, remove: removeNotification } = useNotifications();
  // Règle métier : chaque prestation est affectée d'office à une praticienne
  // compétente, présente et libre. Recalculé à chaque changement (rendez-vous
  // déplacé, prestation ajoutée, absence posée…) ; une affectation encore
  // valable n'est jamais déplacée.
  const rdvs = useMemo(() => autoAssign(rawRdvs, planningData), [rawRdvs, planningData]);
  const [view, setView] = useState<RdvView>("liste");
  const [query, setQuery] = useState("");
  const [fromIso, setFromIso] = useState(TODAY_ISO);
  const [toIso, setToIso] = useState(TODAY_ISO);
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
      if (r.status === "annulé") return false;
      if (conflictOnly && !(r.status === "à venir" && r.prestations.some((p) => !p.staff))) return false;
      if (!qq) return true;
      const payer = clientRows("all").find((c) => c.id === r.client.id);
      const payerMatch = payer ? clientMatchesQuery(payer, qq) : r.client.name.toLowerCase().includes(qq);
      const beneficiaryMatch = r.prestations.some((p) => p.beneficiaryName.toLowerCase().includes(qq));
      return payerMatch || beneficiaryMatch;
    });
  }, [rdvs, q, rangeStart, rangeEnd, scope, conflictOnly, clientRows]);

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

  // Annuler un rendez-vous encore à venir remonte une alerte sur l'accueil ;
  // le rétablir la retire.
  const cancelWithReason = (id: string, reason: string) => {
    const current = rawRdvs.find((r) => r.id === id);
    patch(id, (r) => ({ ...r, status: "annulé", cancelReason: reason || undefined }));
    if (current && current.status === "à venir") {
      pushNotification(cancellationNotification({ ...current, cancelReason: reason || undefined }));
    }
    flash("Réservation annulée — cliente prévenue par email.");
  };

  const setStatus = (id: string, status: RdvStatus) => {
    const current = rawRdvs.find((r) => r.id === id);
    patch(id, (r) => ({ ...r, status }));
    if (status === "annulé" && current && current.status === "à venir") {
      pushNotification(cancellationNotification(current));
    }
    if (status === "à venir") {
      removeNotification(cancellationNotificationId(id));
      flash("Réservation rétablie — cliente prévenue par email.");
    }
  };

  const create = (r: RdvDetail) => {
    setRdvs((list) => [...list, r]);
    setNewOpen(false);
    flash("Rendez-vous créé.");
  };

  const toastEl = toast && (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-box bg-neutral px-5 py-3 text-[15px] font-medium text-neutral-content shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.4)]">
      {toast}
    </div>
  );

  // La fiche d'un rendez-vous s'ouvre en page, à la place de la liste, branchée
  // sur l'état de session ; « Retour » ramène la liste telle qu'on l'a laissée.
  if (selected) {
    return (
      <>
        <RendezVousDetail
          key={selected.id}
          detail={selected}
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
        {toastEl}
      </>
    );
  }

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
        // Le Planning de point-de-vente, tel quel (Jour / Semaine, Coiffeurs /
        // Esthéticiens) — même composant que l'onglet Équipe › Planning, branché
        // sur les rendez-vous de la session ; le salon se règle dans le bandeau.
        <PlanningBoard
          rdvs={rdvs}
          onOpenRdv={setSelectedId}
          showSalonFilter={false}
          toolbarEnd={
            <SegmentedToggle value={view} onChange={(v) => setView(v as RdvView)} options={viewOptions} aria-label="Vue" />
          }
        />
      ) : (
        <section>
          {/* Recherche en tête, bascule de vue à droite ; dates Du/Au dessous. La
              recherche est la porte d'entrée de l'écran : plus haute et plus
              contrastée que le `SearchInput` partagé, sans couleur de marque. */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <label className="flex h-14 w-full max-w-[580px] items-center gap-3 rounded-field border border-base-content/20 bg-base-100 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition focus-within:border-primary focus-within:ring-4 focus-within:ring-[#fdcfca]/60">
              <Search aria-hidden className="size-5 shrink-0 text-base-content/60" />
              <input
                type="search"
                placeholder="Cliente ou n° de rendez-vous"
                aria-label="Chercher une cliente ou un n° de rendez-vous"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-full grow bg-transparent text-[17px] text-base-content placeholder:text-base-content/55 focus:outline-none"
              />
            </label>
            <SegmentedToggle value={effectiveView} onChange={(v) => setView(v as RdvView)} options={viewOptions} aria-label="Vue" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2.5">
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

          {conflictCount > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
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
            </div>
          )}

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

      {toastEl}
    </div>
  );
}
