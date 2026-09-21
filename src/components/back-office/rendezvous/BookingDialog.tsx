"use client";

import { useMemo, useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import ClientSearchField, { type ClientPick } from "@/components/back-office/shared/ClientSearchField";
import {
  salonConfig,
  salons,
  type PosteType,
  type SalonId,
  type SalonScope,
  type Weekday,
} from "@/lib/mock/beautyandco";
import { fullName } from "@/lib/mock/staff";
import { presentPractitionersForPrestation } from "@/lib/mock/planning";
import { prestationSeeds, prestationsForSalon, serviceSeeds, type Prestation } from "@/lib/mock/services";
import {
  durationLabel,
  fcfa,
  newRdvId,
  posteTypeForCategory,
  rdvEnd,
  type RdvDetail,
  type RdvPrestation,
} from "@/lib/mock/rendezvous";

// Parcours de prise de rendez-vous manuel (« saisi au salon »), inspiré du
// dialog centré unique de point-de-vente (create-reservation-dialog.tsx) :
// pas de stepper — cliente, date, N prestations (chacune avec sa
// praticienne ou « première disponible »), puis un seul horaire de départ
// pour toute la visite, calculé sur la durée cumulée des prestations et les
// capacités par poste du salon (mêmes règles que le bandeau de capacité de
// l'agenda). Remplace l'ancien formulaire à une seule prestation sans
// créneau réel.

const TODAY_ISO = "2026-09-03";
const NOW_TIME = "13:20";
const SLOT_STEP_MIN = 15;
const FIRST_AVAILABLE = "__any__";

const ACTIVE_PRESTATIONS = prestationSeeds.filter((p) => p.active);

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const weekdayOf = (iso: string): Weekday =>
  WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];

// Nom du service parent = la « catégorie » attendue par posteTypeForCategory
// (« Coiffure », « Soin du visage »…) — plus fiable que de la redériver.
const categoryLabel = (serviceId: string | null) =>
  serviceSeeds.find((s) => s.id === serviceId)?.name ?? "Autres prestations";

type DraftLine = {
  id: string;
  prestationId: string;
  staff: string | null; // null = première praticienne disponible
};

let lineSeq = 1;
const newLineId = () => `booking-line-${lineSeq++}`;
let refSeq = 4300;

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const minutesToTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Occupation par type de poste à un instant donné — mêmes règles que le
// bandeau de capacité de l'agenda (RendezVous.tsx), dupliquées ici pour ne
// pas dépendre du remontage final de l'écran.
function occupancyAt(
  rdvs: RdvDetail[],
  salonId: SalonId,
  iso: string,
  refTime: string,
): Record<PosteType, number> {
  const ref = new Date(`${iso}T${refTime}:00`).getTime();
  const counts: Record<PosteType, number> = { coiffure: 0, esthetique: 0, onglerie: 0 };
  for (const r of rdvs) {
    if (r.salon !== salonId || r.date.slice(0, 10) !== iso || r.status === "annulé") continue;
    const start = new Date(r.date.replace(" ", "T")).getTime();
    const end = new Date(rdvEnd(r)).getTime();
    if (ref < start || ref >= end) continue;
    for (const t of new Set(r.prestations.map((p) => p.posteType))) counts[t] += 1;
  }
  return counts;
}

function availableSlots(
  rdvs: RdvDetail[],
  salonId: SalonId,
  iso: string,
  totalDurationMin: number,
  postesNeeded: PosteType[],
): string[] {
  if (totalDurationMin <= 0) return [];
  const hours = salonConfig(salonId).hours[weekdayOf(iso)];
  if (hours.closed) return [];
  const capacity = salonConfig(salonId).postes;
  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const nowMin = iso === TODAY_ISO ? timeToMinutes(NOW_TIME) : -1;

  const slots: string[] = [];
  for (let t = openMin; t + totalDurationMin <= closeMin; t += SLOT_STEP_MIN) {
    if (t <= nowMin) continue;
    const time = minutesToTime(t);
    const occ = occupancyAt(rdvs, salonId, iso, time);
    const full = postesNeeded.some((p) => occ[p] >= (capacity[p] ?? 0));
    if (!full) slots.push(time);
  }
  return slots;
}

const field =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

type Props = {
  scope: SalonScope;
  rdvs: RdvDetail[];
  onCancel: () => void;
  onCreate: (r: RdvDetail) => void;
};

export default function BookingDialog({ scope, rdvs, onCancel, onCreate }: Props) {
  const defaultSalon: SalonId = scope === "all" ? "almadies" : scope;
  const [salon, setSalon] = useState<SalonId>(defaultSalon);
  const [pick, setPick] = useState<ClientPick | null>(null);
  const [date, setDate] = useState(TODAY_ISO);
  const [time, setTime] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([
    { id: newLineId(), prestationId: "", staff: null },
  ]);

  const salonPrestations = useMemo(
    () => prestationsForSalon(ACTIVE_PRESTATIONS, salon),
    [salon],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Prestation[]>();
    for (const p of salonPrestations) {
      const label = categoryLabel(p.serviceId);
      const list = map.get(label) ?? [];
      list.push(p);
      map.set(label, list);
    }
    return [...map.entries()];
  }, [salonPrestations]);

  const resolvedLines = lines
    .map((l) => ({ draft: l, prestation: salonPrestations.find((p) => p.id === l.prestationId) ?? null }))
    .filter((l): l is { draft: DraftLine; prestation: Prestation } => l.prestation !== null);

  const totalDuration = resolvedLines.reduce((sum, l) => sum + l.prestation.durationMin, 0);
  const totalPrice = resolvedLines.reduce((sum, l) => sum + l.prestation.priceFcfa, 0);
  const postesNeeded = useMemo(
    () => [...new Set(resolvedLines.map((l) => posteTypeForCategory(categoryLabel(l.prestation.serviceId))))],
    [resolvedLines],
  );

  const slots = useMemo(
    () => availableSlots(rdvs, salon, date, totalDuration, postesNeeded),
    [rdvs, salon, date, totalDuration, postesNeeded],
  );

  const changeSalon = (s: SalonId) => {
    setSalon(s);
    setLines((ls) => ls.map((l) => ({ ...l, staff: null })));
    setTime(null);
  };
  const changeDate = (d: string) => {
    setDate(d);
    setLines((ls) => ls.map((l) => ({ ...l, staff: null })));
    setTime(null);
  };

  const updateLine = (id: string, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLine = () => setLines((ls) => [...ls, { id: newLineId(), prestationId: "", staff: null }]);
  const removeLine = (id: string) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));

  const clientOk =
    !!pick && (pick.kind === "existing" || pick.name.trim() !== "");
  const linesOk = lines.length > 0 && resolvedLines.length === lines.length;
  const timeOk = time !== null && slots.includes(time);
  const valid = clientOk && linesOk && timeOk;

  const submit = () => {
    if (!valid || !pick || !time) return;

    const prestations: RdvPrestation[] = resolvedLines.map((l, i) => {
      const category = categoryLabel(l.prestation.serviceId);
      return {
        id: `p${i + 1}`,
        prestationId: l.prestation.id,
        category,
        name: l.prestation.name,
        durationMin: l.prestation.durationMin,
        price: l.prestation.priceFcfa,
        posteType: posteTypeForCategory(category),
        staff: l.draft.staff,
      };
    });

    const client =
      pick.kind === "existing"
        ? {
            id: pick.client.id,
            name: pick.client.name,
            email: pick.client.email,
            phone: pick.client.phone,
            whatsapp: null,
            loyaltyPoints: pick.client.loyaltyPoints,
          }
        : {
            id: "c-nouvelle",
            name: pick.name.trim(),
            email: "",
            phone: pick.phone.trim(),
            whatsapp: null,
            loyaltyPoints: 0,
          };

    const salonEntry = salons.find((s) => s.id === salon)!;

    onCreate({
      id: newRdvId(),
      ref: `#bo-${refSeq++}`,
      status: "à venir",
      date: `${date}T${time}:00`,
      salon,
      salonLabel: salonEntry.name,
      client,
      staffGlobal: null,
      prestations,
      questions: [],
      advantages: [],
      events: [
        { at: `${TODAY_ISO}T${NOW_TIME}:00`, label: "Rendez-vous créé", detail: "Saisi au salon" },
      ],
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/20" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-6rem)] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800">Nouveau rendez-vous</h2>
        <p className="mt-1 text-theme-xs text-gray-500">
          Démo — le rendez-vous est ajouté au planning de la session, sans envoi d&apos;email.
        </p>

        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-theme-sm">
              <span className="mb-1 block font-medium text-gray-700">Salon</span>
              <select value={salon} onChange={(e) => changeSalon(e.target.value as SalonId)} className={field}>
                {salons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-theme-sm">
              <span className="mb-1 block font-medium text-gray-700">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => changeDate(e.target.value)}
                className={field}
              />
            </label>
            <div className="col-span-2">
              <ClientSearchField scope={scope} value={pick} onChange={setPick} label="Cliente" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                Prestations
              </p>
              {totalDuration > 0 && (
                <p className="text-theme-xs text-gray-500">
                  {durationLabel(totalDuration)} · <span className="font-medium text-gray-700">{fcfa(totalPrice)}</span>
                </p>
              )}
            </div>
            <div className="space-y-3">
              {lines.map((l) => {
                const prestation = salonPrestations.find((p) => p.id === l.prestationId) ?? null;
                const staffOptions = prestation
                  ? presentPractitionersForPrestation(prestation.id, salon, date)
                  : [];
                const staffValue = l.staff
                  ? staffOptions.find((m) => fullName(m) === l.staff)?.id ?? ""
                  : FIRST_AVAILABLE;
                return (
                  <div key={l.id} className="space-y-2 rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={l.prestationId}
                        onChange={(e) => updateLine(l.id, { prestationId: e.target.value, staff: null })}
                        className={field}
                      >
                        <option value="">Choisir une prestation…</option>
                        {grouped.map(([label, list]) => (
                          <optgroup key={label} label={label}>
                            {list.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(l.id)}
                          aria-label="Retirer cette prestation"
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-error-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {prestation && (
                      <>
                        <select
                          value={staffValue}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === FIRST_AVAILABLE || v === "") updateLine(l.id, { staff: null });
                            else {
                              const m = staffOptions.find((x) => x.id === v);
                              updateLine(l.id, { staff: m ? fullName(m) : null });
                            }
                          }}
                          className={field}
                        >
                          <option value={FIRST_AVAILABLE}>Première praticienne disponible</option>
                          {staffOptions.map((m) => (
                            <option key={m.id} value={m.id}>
                              {fullName(m)}
                            </option>
                          ))}
                        </select>
                        {staffOptions.length === 0 && (
                          <p className="text-theme-xs text-warning-700">
                            Aucune praticienne compétente et présente ce jour-là.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-theme-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600"
            >
              + Ajouter une prestation
            </button>
          </div>

          {totalDuration > 0 && (
            <div>
              <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                Horaire de la visite
              </p>
              {slots.length === 0 ? (
                <Alert
                  variant="warning"
                  title="Aucun créneau disponible"
                  message="Ce salon est complet ou fermé sur cette date avec ces prestations — essayez un autre jour."
                />
              ) : (
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTime(s)}
                      className={`rounded-full px-3 py-1.5 text-theme-sm font-medium tabular-nums transition ${
                        time === s
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
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
