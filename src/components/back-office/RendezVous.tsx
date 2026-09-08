"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import PageHeader from "@/components/back-office/PageHeader";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import {
  POSTE_TYPES,
  POSTE_TYPE_LABELS,
  clients,
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
import {
  fullName,
  membersForPrestation,
  membersInScope,
} from "@/lib/mock/staff";
import { presenceFor } from "@/lib/mock/planning";
import { prestationSeeds, prestationsForSalon } from "@/lib/mock/services";
import {
  RDV_STATUS_META,
  allRendezvous,
  durationLabel,
  fcfa,
  frFullDate,
  newRdvId,
  posteTypeForCategory,
  rdvDuration,
  rdvEnd,
  rdvTotal,
  rendezvousRows,
  type RdvDetail,
  type RdvPrestation,
  type RdvRow,
  type RdvStatus,
} from "@/lib/mock/rendezvous";

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
const FIRST_AVAILABLE = "__any__";

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

const VIEW_OPTIONS: SegmentedOption<"liste" | "agenda">[] = [
  { value: "liste", label: "Liste" },
  { value: "agenda", label: "Agenda" },
];

const COLOR_OPTIONS: SegmentedOption<"poste" | "praticienne">[] = [
  { value: "poste", label: "Par poste" },
  { value: "praticienne", label: "Par praticienne" },
];

const badgeColor: Record<RdvStatus, "info" | "success" | "warning" | "error" | "light"> = {
  "à venir": "info",
  terminé: "light",
  annulé: "error",
  absence: "warning",
};

const POSTE_HEX: Record<PosteType, string> = {
  coiffure: "#886666",
  esthetique: "#c98b84",
  onglerie: "#a97e7e",
};
const ASSIGN_HEX = "#f79009"; // warning — prestation sans praticienne
const STAFF_PALETTE = ["#886666", "#0086c9", "#7a5195", "#2f9e70", "#bc5090", "#c98b84"];

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const weekdayOf = (iso: string): Weekday =>
  WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];

const SEEDED_IDS = new Set(allRendezvous().map((r) => r.id));
let refSeq = 4200; // suffixe de référence des rendez-vous créés dans la session
const ACTIVE_PRESTATIONS = prestationSeeds.filter((p) => p.active);

// Catégorie « catalogue » d'une prestation à partir de son service parent —
// sert à dériver le poste de travail d'un rendez-vous saisi au salon.
const CATEGORY_BY_SERVICE: Record<string, string> = {
  "s-coiffure": "Coiffure",
  "s-manucure": "Manucure & pédicure",
  "s-onglerie": "Onglerie",
  "s-spa": "Spa",
  "s-visage": "Soin du visage",
  "s-epilation": "Épilation",
  "s-mini": "Coiffure",
  "s-brows": "Soin du visage",
};
const categoryOfService = (serviceId: string | null) =>
  (serviceId && CATEGORY_BY_SERVICE[serviceId]) || "Soin du visage";

/* -------------------------------------------------------------- helpers */

const staffHex = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return STAFF_PALETTE[h % STAFF_PALETTE.length];
};

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

/* -------------------------------------------------------------- liste */

type SortKey = "date" | "client" | "status" | "total";

const AssignPill = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-theme-xs font-medium text-warning-700">
    <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
    À affecter
  </span>
);

function ListView({
  rows,
  onOpen,
}: {
  rows: RdvRow[];
  onOpen: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let d = 0;
      if (sortKey === "date") d = a.date.localeCompare(b.date);
      else if (sortKey === "client") d = a.clientName.localeCompare(b.clientName, "fr");
      else if (sortKey === "status") d = a.status.localeCompare(b.status, "fr");
      else d = a.total - b.total;
      return asc ? d : -d;
    });
    return copy;
  }, [rows, sortKey, asc]);

  const th = (key: SortKey, label: string, end = false) => (
    <button
      type="button"
      onClick={() => (key === sortKey ? setAsc((v) => !v) : (setSortKey(key), setAsc(true)))}
      className={`inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-800 ${
        end ? "flex-row-reverse" : ""
      }`}
    >
      {label}
      <span className="text-gray-400">{key === sortKey ? (asc ? "↑" : "↓") : ""}</span>
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-theme-sm text-gray-500">
        Aucun rendez-vous ne correspond à ce filtre.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-theme-sm">
          <thead className="border-b border-gray-100 text-theme-xs">
            <tr>
              <th className="px-5 py-3 text-start">{th("client", "Cliente")}</th>
              <th className="px-5 py-3 text-start">{th("date", "Date & heure")}</th>
              <th className="px-5 py-3 text-start font-medium text-gray-500">Prestations</th>
              <th className="px-5 py-3 text-start font-medium text-gray-500">Praticienne(s)</th>
              <th className="px-5 py-3 text-start">{th("status", "Statut")}</th>
              <th className="px-5 py-3 text-end">{th("total", "Total", true)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={() => onOpen(row.id)}
                className={`cursor-pointer hover:bg-gray-50 ${row.cancelled ? "opacity-60" : ""}`}
              >
                <td className="px-5 py-4">
                  <span className="font-semibold text-gray-800">{row.clientName}</span>
                  <span className="mt-0.5 block text-theme-xs tabular-nums text-gray-400">
                    {row.clientPhone}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-gray-700">
                  <span className="font-medium text-gray-800">
                    {frShortDate(row.date.slice(0, 10))}
                  </span>
                  <span className="ml-2 tabular-nums text-gray-500">{row.time}</span>
                </td>
                <td className="max-w-xs px-5 py-4 text-gray-600">
                  <span className="line-clamp-1">{row.prestationNames}</span>
                  <span className="text-theme-xs text-gray-400">{row.salonLabel}</span>
                </td>
                <td className="px-5 py-4">
                  {row.pendingAssign > 0 && !row.cancelled ? (
                    <AssignPill />
                  ) : (
                    <span className="text-gray-600">{row.staffLabel}</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge size="sm" color={badgeColor[row.status]}>
                    {RDV_STATUS_META[row.status].label}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-end font-semibold tabular-nums text-gray-800">
                  {fcfa(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- agenda */

function AgendaView({
  rdvs,
  scope,
  colorMode,
  onDate,
  onOpen,
  onMove,
}: {
  rdvs: RdvDetail[];
  scope: SalonScope;
  colorMode: "poste" | "praticienne";
  onDate: (iso: string) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, startIso: string) => void;
}) {
  const calRef = useRef<FullCalendar>(null);
  const [visibleIso, setVisibleIso] = useState(TODAY_ISO);
  const scopeIds: SalonId[] = scope === "all" ? salons.map((s) => s.id) : [scope];
  const win = dayWindow(scopeIds, visibleIso);

  // L'agenda montre ce qui a lieu : les rendez-vous annulés en sont retirés
  // (ils restent consultables dans la vue Liste, filtre « Annulés »).
  const events = rdvs
    .filter((r) => scope === "all" || r.salon === scope)
    .filter((r) => r.status !== "annulé")
    .map((r) => {
      const pending = r.prestations.some((p) => p.staff === null);
      const color = pending
        ? ASSIGN_HEX
        : colorMode === "poste"
          ? POSTE_HEX[r.prestations[0]?.posteType ?? "esthetique"]
          : staffHex(r.prestations[0]?.staff ?? "—");
      return {
        id: r.id,
        title: `${r.client.name} · ${r.prestations.map((p) => p.name).join(", ")}`,
        start: r.date.replace(" ", "T"),
        end: rdvEnd(r),
        backgroundColor: color,
        borderColor: color,
        textColor: "#fff",
        editable: !RDV_STATUS_META[r.status].closed,
      };
    });

  const closedDays = scopeIds.every((id) => isClosed(id, visibleIso));

  return (
    <div className="space-y-4">
      <CapacityBanner rdvs={rdvs} scopeIds={scopeIds} iso={visibleIso} />
      {closedDays && (
        <Alert
          variant="info"
          title="Salon fermé ce jour-là"
          message="Aucun créneau réservable. Les rendez-vous existants restent consultables."
        />
      )}
      <div className="custom-calendar rounded-2xl border border-gray-200 bg-white p-4">
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          initialDate={TODAY_ISO}
          locale="fr"
          firstDay={1}
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridDay,timeGridWeek" }}
          buttonText={{ today: "Aujourd'hui", day: "Jour", week: "Semaine" }}
          allDaySlot={false}
          slotMinTime={`${win.min}:00`}
          slotMaxTime={`${win.max}:00`}
          nowIndicator
          now={`${TODAY_ISO}T${NOW_TIME}:00`}
          height="auto"
          expandRows
          events={events}
          eventClick={(arg: EventClickArg) => onOpen(arg.event.id)}
          eventDrop={(arg: EventDropArg) => {
            const s = arg.event.start;
            if (!s) return;
            const p = (n: number) => String(n).padStart(2, "0");
            const iso = `${s.getFullYear()}-${p(s.getMonth() + 1)}-${p(s.getDate())}T${p(
              s.getHours(),
            )}:${p(s.getMinutes())}:00`;
            onMove(arg.event.id, iso);
          }}
          datesSet={(arg: DatesSetArg) => {
            const iso = arg.start.toISOString().slice(0, 10);
            setVisibleIso(iso);
            onDate(iso);
          }}
        />
      </div>
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

/* -------------------------------------------------------------- drawer */

function Drawer({
  detail,
  onClose,
  onAssign,
  onStatus,
  onDelete,
}: {
  detail: RdvDetail;
  onClose: () => void;
  onAssign: (prestationId: string, staff: string | null) => void;
  onStatus: (status: RdvStatus) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = RDV_STATUS_META[detail.status];
  const day = detail.date.slice(0, 10);
  const total = rdvTotal(detail);

  // Praticienne demandée mais absente ce jour-là ?
  const requestedAbsent = detail.prestations
    .map((p) => p.requestedStaff)
    .filter((n): n is string => Boolean(n))
    .filter((name) => {
      const m = membersInScope(detail.salon).find((x) => fullName(x) === name);
      return !m || presenceFor(m.id, day).state !== "present";
    });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-800">{detail.client.name}</h2>
            <p className="mt-0.5 text-theme-xs tabular-nums text-gray-500">{detail.client.phone}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge size="sm" color={badgeColor[detail.status]}>
                {meta.label}
              </Badge>
              <span className="text-theme-xs text-gray-400">{detail.ref}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-theme-sm">
            <p className="font-medium text-gray-800">{frFullDate(detail.date)}</p>
            <p className="tabular-nums text-gray-500">
              {detail.date.slice(11, 16)} → {rdvEnd(detail).slice(11, 16)} ·{" "}
              {durationLabel(rdvDuration(detail))} · {detail.salonLabel}
            </p>
          </div>

          {detail.status === "annulé" && (
            <Alert
              variant="error"
              title="Rendez-vous annulé"
              message="Ce créneau est libéré. Vous pouvez le rétablir si la cliente rappelle."
            />
          )}

          {requestedAbsent.length > 0 && detail.status === "à venir" && (
            <Alert
              variant="warning"
              title="Praticienne demandée absente"
              message={`La cliente a demandé ${requestedAbsent.join(
                ", ",
              )}, absente ce jour-là. Affectez quelqu'un d'autre ou proposez un autre créneau.`}
            />
          )}

          {isClosed(detail.salon, day) && detail.status !== "annulé" && (
            <Alert
              variant="warning"
              title="Hors ouverture"
              message="Ce rendez-vous tombe un jour de fermeture du salon."
            />
          )}

          <div>
            <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
              Prestations
            </p>
            <ul className="space-y-3">
              {detail.prestations.map((p) => {
                const options = membersForPrestation(p.prestationId, detail.salon).filter(
                  (m) => presenceFor(m.id, day).state === "present",
                );
                const value = p.staff
                  ? options.find((m) => fullName(m) === p.staff)?.id ?? ""
                  : FIRST_AVAILABLE;
                return (
                  <li key={p.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-theme-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-theme-xs text-gray-500">
                          {durationLabel(p.durationMin)} · {POSTE_TYPE_LABELS[p.posteType]}
                        </p>
                      </div>
                      <span className="shrink-0 text-theme-sm font-semibold tabular-nums text-gray-800">
                        {fcfa(p.price)}
                      </span>
                    </div>
                    {detail.status === "à venir" ? (
                      <>
                        <select
                          value={value}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === FIRST_AVAILABLE || v === "") onAssign(p.id, null);
                            else {
                              const m = options.find((x) => x.id === v);
                              onAssign(p.id, m ? fullName(m) : null);
                            }
                          }}
                          className="mt-2 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                        >
                          <option value={FIRST_AVAILABLE}>Première praticienne disponible</option>
                          {options.map((m) => (
                            <option key={m.id} value={m.id}>
                              {fullName(m)}
                            </option>
                          ))}
                        </select>
                        {options.length === 0 && (
                          <p className="mt-1.5 text-theme-xs text-warning-700">
                            Aucune praticienne compétente et présente ce jour-là.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-theme-xs text-gray-500">
                        {p.staff ? `Réalisée par ${p.staff}` : "Aucune praticienne affectée"}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-theme-sm">
            <span className="text-gray-500">Total des prestations</span>
            <span className="font-semibold tabular-nums text-gray-800">{fcfa(total)}</span>
          </div>

          {SEEDED_IDS.has(detail.id) && (
            <Link
              href={`/rendez-vous/${detail.id}`}
              className="inline-block text-theme-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Ouvrir la fiche complète →
            </Link>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-4">
          {detail.status === "annulé" ? (
            <button
              type="button"
              onClick={() => onStatus("à venir")}
              className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600"
            >
              Rétablir le rendez-vous
            </button>
          ) : (
            !meta.closed && (
              <button
                type="button"
                onClick={() => onStatus("annulé")}
                className="inline-flex items-center rounded-lg border border-error-200 px-4 py-2 text-theme-sm font-medium text-error-600 hover:bg-error-50"
              >
                Annuler
              </button>
            )
          )}
          {confirmDelete ? (
            <span className="ml-auto flex items-center gap-2 text-theme-xs">
              <span className="text-gray-500">Supprimer ? Aucun email.</span>
              <button
                type="button"
                onClick={onDelete}
                className="font-semibold text-error-600 hover:underline"
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="font-medium text-gray-500 hover:underline"
              >
                Non
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="ml-auto text-theme-sm font-medium text-error-600 hover:underline"
            >
              Supprimer
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

/* -------------------------------------------------------------- nouveau RDV */

function NewRdvForm({
  scope,
  onCancel,
  onCreate,
}: {
  scope: SalonScope;
  onCancel: () => void;
  onCreate: (r: RdvDetail) => void;
}) {
  const defaultSalon: SalonId = scope === "all" ? "almadies" : scope;
  const [salon, setSalon] = useState<SalonId>(defaultSalon);
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [prestationId, setPrestationId] = useState("");
  const [date, setDate] = useState(TODAY_ISO);
  const [time, setTime] = useState("10:00");

  const salonClients = clients(salon);
  const salonPrestations = prestationsForSalon(ACTIVE_PRESTATIONS, salon);

  const resolvedName =
    salonClients.find((c) => c.id === clientId)?.name ?? name.trim();
  const resolvedPhone =
    salonClients.find((c) => c.id === clientId)?.phone ?? phone.trim();
  const chosen = salonPrestations.find((p) => p.id === prestationId);
  const valid = resolvedName !== "" && !!chosen && date !== "" && time !== "";

  const submit = () => {
    if (!chosen) return;
    const category = categoryOfService(chosen.serviceId);
    const prestation: RdvPrestation = {
      id: "p1",
      prestationId: chosen.id,
      category,
      name: chosen.name,
      durationMin: chosen.durationMin,
      price: chosen.priceFcfa,
      posteType: posteTypeForCategory(category),
      staff: null,
    };
    const clientRow = salonClients.find((c) => c.id === clientId);
    onCreate({
      id: newRdvId(),
      ref: `#bo-${refSeq++}`,
      status: "à venir",
      date: `${date}T${time}:00`,
      salon,
      salonLabel: salonName(salon),
      client: {
        id: clientRow?.id ?? "c-nouvelle",
        name: resolvedName,
        email: clientRow?.email ?? "",
        phone: resolvedPhone,
        whatsapp: null,
        loyaltyPoints: clientRow?.loyaltyPoints ?? 0,
      },
      staffGlobal: null,
      prestations: [prestation],
      questions: [],
      advantages: [],
      events: [
        { at: `${TODAY_ISO}T${NOW_TIME}:00`, label: "Rendez-vous créé", detail: "Saisi au salon" },
      ],
    });
  };

  const field =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/20" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800">Nouveau rendez-vous</h2>
        <p className="mt-1 text-theme-xs text-gray-500">
          Démo — le rendez-vous est ajouté au planning de la session, sans envoi d&apos;email.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 block text-theme-sm">
            <span className="mb-1 block font-medium text-gray-700">Salon</span>
            <select value={salon} onChange={(e) => setSalon(e.target.value as SalonId)} className={field}>
              {salons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 block text-theme-sm">
            <span className="mb-1 block font-medium text-gray-700">Cliente</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={field}>
              <option value="">Nouvelle cliente…</option>
              {salonClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {clientId === "" && (
            <>
              <label className="block text-theme-sm">
                <span className="mb-1 block font-medium text-gray-700">Nom</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
              </label>
              <label className="block text-theme-sm">
                <span className="mb-1 block font-medium text-gray-700">Téléphone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
              </label>
            </>
          )}
          <label className="col-span-2 block text-theme-sm">
            <span className="mb-1 block font-medium text-gray-700">Prestation</span>
            <select
              value={prestationId}
              onChange={(e) => setPrestationId(e.target.value)}
              className={field}
            >
              <option value="">Choisir…</option>
              {salonPrestations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fcfa(p.priceFcfa)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-theme-sm">
            <span className="mb-1 block font-medium text-gray-700">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={field}
            />
          </label>
          <label className="block text-theme-sm">
            <span className="mb-1 block font-medium text-gray-700">Heure</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={field}
            />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            disabled={!valid}
            onClick={submit}
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:bg-brand-300"
          >
            Créer le rendez-vous
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-lg px-4 py-2.5 text-theme-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </>
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
  const [rdvs, setRdvs] = useState<RdvDetail[]>(() => allRendezvous());
  const [view, setView] = useState<"liste" | "agenda">("liste");
  const [colorMode, setColorMode] = useState<"poste" | "praticienne">("poste");
  const [listFilter, setListFilter] = useState<ListFilter>("upcoming");
  const [assignOnly, setAssignOnly] = useState(false);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 3200);
  };

  const rows = useMemo(() => rendezvousRows(rdvs, scope), [rdvs, scope]);

  const assignCount = rows.filter((r) => r.needsAssign).length;

  const staffList = useMemo(
    () => membersInScope(scope).filter((m) => m.roles.includes("praticienne")),
    [scope],
  );

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
          description="Le planning des salons — les clientes réservent en ligne, vous affectez une praticienne et ajustez ici."
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Salon
            </span>
            <SegmentedControl
              options={SALON_OPTIONS}
              value={scope}
              onChange={setScope}
              aria-label="Filtrer par salon"
            />
          </div>
          <div className="flex items-center gap-2">
            <SegmentedControl
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
              aria-label="Vue Liste ou Agenda"
            />
            {view === "agenda" && (
              <SegmentedControl
                options={COLOR_OPTIONS}
                value={colorMode}
                onChange={setColorMode}
                aria-label="Couleur des rendez-vous"
                size="sm"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Nouveau rendez-vous
          </button>
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
        <AgendaView
          rdvs={rdvs}
          scope={scope}
          colorMode={colorMode}
          onDate={() => undefined}
          onOpen={setSelectedId}
          onMove={move}
        />
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
        <Drawer
          detail={selected}
          onClose={() => setSelectedId(null)}
          onAssign={(pid, staff) => assign(selected.id, pid, staff)}
          onStatus={(s) => setStatus(selected.id, s)}
          onDelete={() => remove(selected.id)}
        />
      )}

      {newOpen && (
        <NewRdvForm scope={scope} onCancel={() => setNewOpen(false)} onCreate={create} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-theme-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
