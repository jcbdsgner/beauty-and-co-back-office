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
import { presentPractitionersForPrestation, type PlanningData } from "@/lib/mock/planning";
import { prestationSeeds, prestationsForSalon, serviceSeeds, sellableExtras, type Prestation } from "@/lib/mock/services";
import {
  durationLabel,
  fcfa,
  isStaffFreeForWindow,
  minutesToTime,
  newRdvId,
  posteTypeForCategory,
  timeToMinutes,
  type RdvDetail,
  type RdvExtra,
  type RdvPrestation,
} from "@/lib/mock/rendezvous";

// Parcours de prise de rendez-vous manuel (« saisi au salon »), inspiré du
// dialog centré unique de point-de-vente (create-reservation-dialog.tsx) :
// pas de stepper — payeuse, date, N prestations par personne (chacune avec sa
// praticienne, ou « première disponible », et une 2ᵉ praticienne pour les
// prestations « à deux »), boissons pré-commandées en option, puis un seul
// horaire de départ pour toute la visite : les lignes de TOUTES les personnes
// s'enchaînent depuis cet horaire, calculé sur la durée cumulée et les
// capacités par poste du salon (mêmes règles que le bandeau de capacité de
// l'agenda) — en vérifiant en plus que chaque praticienne nommément choisie
// est bien libre sur TOUTE sa fenêtre, pas seulement à l'instant de départ.

const TODAY_ISO = "2026-09-03";
const NOW_TIME = "13:20";
const SLOT_STEP_MIN = 15;
const FIRST_AVAILABLE = "__any__";
const NO_SECOND = "__none__";

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
  secondStaff: string | null; // 2ᵉ praticienne — prestation « à deux »
};

type DraftBeneficiary = {
  id: string;
  pick: ClientPick | null; // qui reçoit ces prestations — vide = pas encore choisi
  lines: DraftLine[];
};

type DraftExtra = { id: string; productId: string; qty: number };

let lineSeq = 1;
const newLineId = () => `booking-line-${lineSeq++}`;
let benSeq = 1;
const newBenId = () => `booking-ben-${benSeq++}`;
let extraSeq = 1;
const newExtraId = () => `booking-extra-${extraSeq++}`;
let refSeq = 4300;

const emptyLine = (): DraftLine => ({ id: newLineId(), prestationId: "", staff: null, secondStaff: null });

// Occupation par type de poste à un instant donné — mêmes règles que le
// bandeau de capacité de l'agenda (RendezVous.tsx), dupliquées ici pour ne
// pas dépendre du remontage final de l'écran.
function occupancyAt(
  rdvs: RdvDetail[],
  salonId: SalonId,
  iso: string,
  refTime: string,
): Record<PosteType, number> {
  const ref = timeToMinutes(refTime);
  const counts: Record<PosteType, number> = { coiffure: 0, esthetique: 0, onglerie: 0 };
  for (const r of rdvs) {
    if (r.salon !== salonId || r.date.slice(0, 10) !== iso || r.status === "annulé") continue;
    const start = timeToMinutes(r.date.slice(11, 16));
    const end = Math.max(...r.prestations.map((p) => timeToMinutes(p.start) + p.durationMin));
    if (ref < start || ref >= end) continue;
    for (const t of new Set(r.prestations.map((p) => p.posteType))) counts[t] += 1;
  }
  return counts;
}

// Capacité par poste dépassée à un moment de la fenêtre de visite [startMin, startMin+durationMin) —
// pas seulement à l'instant de départ (fixe l'écart audité vs point-de-vente : une prestation
// ultérieure de la visite pouvait chevaucher un poste déjà plein sans que ça bloque le créneau).
function windowExceedsCapacity(
  rdvs: RdvDetail[],
  salonId: SalonId,
  iso: string,
  startMin: number,
  durationMin: number,
  postesNeeded: PosteType[],
  capacity: Partial<Record<PosteType, number>>,
): boolean {
  for (let t = startMin; t < startMin + durationMin; t += SLOT_STEP_MIN) {
    const occ = occupancyAt(rdvs, salonId, iso, minutesToTime(t));
    if (postesNeeded.some((p) => occ[p] >= (capacity[p] ?? 0))) return true;
  }
  return false;
}

const field =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

type ResolvedLine = {
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryClientId: string | null;
  draft: DraftLine;
  prestation: Prestation;
};

function PrestationLinesEditor({
  lines,
  salon,
  date,
  salonPrestations,
  grouped,
  planningData,
  onUpdate,
  onAdd,
  onRemove,
}: {
  lines: DraftLine[];
  salon: SalonId;
  date: string;
  salonPrestations: Prestation[];
  grouped: [string, Prestation[]][];
  planningData?: PlanningData;
  onUpdate: (id: string, patch: Partial<DraftLine>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="space-y-3">
        {lines.map((l) => {
          const prestation = salonPrestations.find((p) => p.id === l.prestationId) ?? null;
          const staffOptions = prestation
            ? presentPractitionersForPrestation(prestation.id, salon, date, planningData)
            : [];
          const staffValue = l.staff
            ? staffOptions.find((m) => fullName(m) === l.staff)?.id ?? ""
            : FIRST_AVAILABLE;
          const secondOptions = staffOptions.filter((m) => fullName(m) !== l.staff);
          return (
            <div key={l.id} className="space-y-2 rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <select
                  value={l.prestationId}
                  onChange={(e) => onUpdate(l.id, { prestationId: e.target.value, staff: null, secondStaff: null })}
                  className={field}
                >
                  <option value="">Choisir une prestation…</option>
                  {grouped.map(([label, list]) => (
                    <optgroup key={label} label={label}>
                      {list.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                          {p.twoPractitioners ? " · à deux" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(l.id)}
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
                      if (v === FIRST_AVAILABLE || v === "") onUpdate(l.id, { staff: null, secondStaff: null });
                      else {
                        const m = staffOptions.find((x) => x.id === v);
                        onUpdate(l.id, { staff: m ? fullName(m) : null });
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
                  {prestation.twoPractitioners && l.staff && (
                    <label className="block text-theme-xs">
                      <span className="mb-1 block font-medium text-gray-500">
                        2ᵉ praticienne (prestation « à deux »)
                      </span>
                      <select
                        value={l.secondStaff ?? NO_SECOND}
                        onChange={(e) => {
                          const v = e.target.value;
                          onUpdate(l.id, { secondStaff: v === NO_SECOND ? null : v });
                        }}
                        className={field}
                      >
                        <option value={NO_SECOND}>Seule</option>
                        {secondOptions.map((m) => (
                          <option key={m.id} value={fullName(m)}>
                            {fullName(m)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-theme-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600"
      >
        + Ajouter une prestation
      </button>
    </div>
  );
}

type Props = {
  scope: SalonScope;
  rdvs: RdvDetail[];
  onCancel: () => void;
  onCreate: (r: RdvDetail) => void;
  planningData?: PlanningData;
};

export default function BookingDialog({ scope, rdvs, onCancel, onCreate, planningData }: Props) {
  const defaultSalon: SalonId = scope === "all" ? "almadies" : scope;
  const [salon, setSalon] = useState<SalonId>(defaultSalon);
  const [pick, setPick] = useState<ClientPick | null>(null);
  const [date, setDate] = useState(TODAY_ISO);
  const [time, setTime] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [extraBeneficiaries, setExtraBeneficiaries] = useState<DraftBeneficiary[]>([]);
  const [extras, setExtras] = useState<DraftExtra[]>([]);

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

  const pickLabel = (p: ClientPick) => (p.kind === "existing" ? p.client.name : p.name.trim());
  const pickClientId = (p: ClientPick) => (p.kind === "existing" ? p.client.id : null);

  // Toutes les lignes, toutes personnes confondues, dans l'ordre où elles
  // s'enchaîneront depuis l'horaire de départ choisi.
  const resolvedLines: ResolvedLine[] = useMemo(() => {
    const payeuseName = pick ? pickLabel(pick) : "";
    const own: ResolvedLine[] = lines
      .map((draft) => ({
        beneficiaryId: "__payeuse__",
        beneficiaryName: payeuseName,
        beneficiaryClientId: pick ? pickClientId(pick) : null,
        draft,
        prestation: salonPrestations.find((p) => p.id === draft.prestationId) ?? null,
      }))
      .filter((l): l is ResolvedLine => l.prestation !== null);
    const others = extraBeneficiaries.flatMap((b) =>
      b.lines
        .map((draft) => ({
          beneficiaryId: b.id,
          beneficiaryName: b.pick ? pickLabel(b.pick) : "",
          beneficiaryClientId: b.pick ? pickClientId(b.pick) : null,
          draft,
          prestation: salonPrestations.find((p) => p.id === draft.prestationId) ?? null,
        }))
        .filter((l): l is ResolvedLine => l.prestation !== null),
    );
    return [...own, ...others];
  }, [lines, extraBeneficiaries, pick, salonPrestations]);

  const totalDuration = resolvedLines.reduce((sum, l) => sum + l.prestation.durationMin, 0);
  const totalPrice =
    resolvedLines.reduce((sum, l) => sum + l.prestation.priceFcfa, 0) +
    extras.reduce((sum, e) => sum + (sellableExtras.find((p) => p.id === e.productId)?.priceFcfa ?? 0) * e.qty, 0);
  const postesNeeded = useMemo(
    () => [...new Set(resolvedLines.map((l) => posteTypeForCategory(categoryLabel(l.prestation.serviceId))))],
    [resolvedLines],
  );
  // Décalage cumulé de chaque ligne depuis l'horaire de départ de la visite.
  const offsets = useMemo(() => {
    let cursor = 0;
    return resolvedLines.map((l) => {
      const o = cursor;
      cursor += l.prestation.durationMin;
      return o;
    });
  }, [resolvedLines]);

  const slots = useMemo(() => {
    if (totalDuration <= 0) return [];
    const hours = salonConfig(salon).hours[weekdayOf(date)];
    if (hours.closed) return [];
    const capacity = salonConfig(salon).postes;
    const openMin = timeToMinutes(hours.open);
    const closeMin = timeToMinutes(hours.close);
    const nowMin = date === TODAY_ISO ? timeToMinutes(NOW_TIME) : -1;

    const out: string[] = [];
    for (let t = openMin; t + totalDuration <= closeMin; t += SLOT_STEP_MIN) {
      if (t <= nowMin) continue;
      if (windowExceedsCapacity(rdvs, salon, date, t, totalDuration, postesNeeded, capacity)) continue;
      const staffOk = resolvedLines.every((l, i) => {
        const lineStart = t + offsets[i];
        const names = [l.draft.staff, l.draft.secondStaff].filter((n): n is string => Boolean(n));
        return names.every((name) => isStaffFreeForWindow(rdvs, name, date, lineStart, l.prestation.durationMin));
      });
      if (staffOk) out.push(minutesToTime(t));
    }
    return out;
  }, [rdvs, salon, date, totalDuration, postesNeeded, resolvedLines, offsets]);

  const changeSalon = (s: SalonId) => {
    setSalon(s);
    setLines((ls) => ls.map((l) => ({ ...l, staff: null, secondStaff: null })));
    setExtraBeneficiaries((bs) => bs.map((b) => ({ ...b, lines: b.lines.map((l) => ({ ...l, staff: null, secondStaff: null })) })));
    setTime(null);
  };
  const changeDate = (d: string) => {
    setDate(d);
    setLines((ls) => ls.map((l) => ({ ...l, staff: null, secondStaff: null })));
    setExtraBeneficiaries((bs) => bs.map((b) => ({ ...b, lines: b.lines.map((l) => ({ ...l, staff: null, secondStaff: null })) })));
    setTime(null);
  };

  const updateLine = (id: string, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (id: string) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));

  const addBeneficiary = () =>
    setExtraBeneficiaries((bs) => [...bs, { id: newBenId(), pick: null, lines: [emptyLine()] }]);
  const removeBeneficiary = (id: string) => setExtraBeneficiaries((bs) => bs.filter((b) => b.id !== id));
  const updateBeneficiaryPick = (id: string, p: ClientPick) =>
    setExtraBeneficiaries((bs) => bs.map((b) => (b.id === id ? { ...b, pick: p } : b)));
  const updateBenLine = (benId: string, lineId: string, patch: Partial<DraftLine>) =>
    setExtraBeneficiaries((bs) =>
      bs.map((b) => (b.id === benId ? { ...b, lines: b.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) } : b)),
    );
  const addBenLine = (benId: string) =>
    setExtraBeneficiaries((bs) => bs.map((b) => (b.id === benId ? { ...b, lines: [...b.lines, emptyLine()] } : b)));
  const removeBenLine = (benId: string, lineId: string) =>
    setExtraBeneficiaries((bs) =>
      bs.map((b) =>
        b.id === benId ? { ...b, lines: b.lines.length > 1 ? b.lines.filter((l) => l.id !== lineId) : b.lines } : b,
      ),
    );

  const addExtra = () => setExtras((xs) => [...xs, { id: newExtraId(), productId: "", qty: 1 }]);
  const updateExtra = (id: string, patch: Partial<DraftExtra>) =>
    setExtras((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeExtra = (id: string) => setExtras((xs) => xs.filter((x) => x.id !== id));

  const clientOk = !!pick && (pick.kind === "existing" || pick.name.trim() !== "");
  const beneficiariesOk = extraBeneficiaries.every(
    (b) => b.pick && (b.pick.kind === "existing" || b.pick.name.trim() !== ""),
  );
  const linesOk = resolvedLines.length > 0 && resolvedLines.length === lines.length + extraBeneficiaries.reduce((n, b) => n + b.lines.length, 0);
  const timeOk = time !== null && slots.includes(time);
  const valid = clientOk && beneficiariesOk && linesOk && timeOk;

  const submit = () => {
    if (!valid || !pick || !time) return;
    const startMin = timeToMinutes(time);

    const prestations: RdvPrestation[] = resolvedLines.map((l, i) => {
      const category = categoryLabel(l.prestation.serviceId);
      const lineStart = startMin + offsets[i];
      return {
        id: `p${i + 1}`,
        prestationId: l.prestation.id,
        category,
        name: l.prestation.name,
        durationMin: l.prestation.durationMin,
        price: l.prestation.priceFcfa,
        posteType: posteTypeForCategory(category),
        staff: l.draft.staff,
        secondStaff: l.draft.secondStaff,
        start: minutesToTime(lineStart),
        beneficiaryName: l.beneficiaryName,
        beneficiaryClientId: l.beneficiaryClientId,
      };
    });

    const rdvExtras: RdvExtra[] = extras
      .filter((e) => e.productId && e.qty > 0)
      .map((e, i) => ({ id: `ex${i + 1}`, kind: "boisson", productId: e.productId, qty: e.qty }));

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
      extras: rdvExtras,
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
              <ClientSearchField scope={scope} value={pick} onChange={setPick} label="Cliente (payeuse)" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                Prestations — {pick ? pickLabel(pick) : "la payeuse"}
              </p>
            </div>
            <PrestationLinesEditor
              lines={lines}
              salon={salon}
              date={date}
              salonPrestations={salonPrestations}
              grouped={grouped}
              planningData={planningData}
              onUpdate={updateLine}
              onAdd={addLine}
              onRemove={removeLine}
            />
          </div>

          {extraBeneficiaries.map((b) => (
            <div key={b.id} className="rounded-xl border border-dashed border-gray-300 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <ClientSearchField
                    scope={scope}
                    value={b.pick}
                    onChange={(p) => updateBeneficiaryPick(b.id, p)}
                    label="Pour qui ?"
                    placeholder="Nom de la personne…"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeBeneficiary(b.id)}
                  className="mt-6 shrink-0 rounded-lg px-2 py-2 text-theme-xs font-medium text-error-600 hover:bg-error-50"
                >
                  Retirer cette personne
                </button>
              </div>
              <PrestationLinesEditor
                lines={b.lines}
                salon={salon}
                date={date}
                salonPrestations={salonPrestations}
                grouped={grouped}
                planningData={planningData}
                onUpdate={(id, patch) => updateBenLine(b.id, id, patch)}
                onAdd={() => addBenLine(b.id)}
                onRemove={(id) => removeBenLine(b.id, id)}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addBeneficiary}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-theme-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600"
          >
            + Ajouter une personne
          </button>

          <div>
            <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
              Boissons (facultatif)
            </p>
            <div className="space-y-2">
              {extras.map((x) => (
                <div key={x.id} className="flex items-center gap-2">
                  <select
                    value={x.productId}
                    onChange={(e) => updateExtra(x.id, { productId: e.target.value })}
                    className={field}
                  >
                    <option value="">Choisir une boisson…</option>
                    {sellableExtras.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {fcfa(p.priceFcfa ?? 0)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={x.qty}
                    onChange={(e) => updateExtra(x.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-10 w-16 shrink-0 rounded-lg border border-gray-200 bg-white px-2 text-center text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtra(x.id)}
                    aria-label="Retirer cette boisson"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-error-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addExtra}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-theme-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600"
            >
              + Ajouter une boisson
            </button>
          </div>

          {totalDuration > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                  Horaire de la visite
                </p>
                <p className="text-theme-xs text-gray-500">
                  {durationLabel(totalDuration)} · <span className="font-medium text-gray-700">{fcfa(totalPrice)}</span>
                </p>
              </div>
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
