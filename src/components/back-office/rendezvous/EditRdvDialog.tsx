"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { type SalonId } from "@/lib/mock/beautyandco";
import { fullName } from "@/lib/mock/staff";
import { presentPractitionersForPrestation, type PlanningData } from "@/lib/mock/planning";
import { prestationSeeds, prestationsForSalon, serviceSeeds, type Prestation } from "@/lib/mock/services";
import {
  durationLabel,
  fcfa,
  isStaffFreeForWindow,
  posteTypeForCategory,
  timeToMinutes,
  type RdvDetail,
  type RdvPrestation,
} from "@/lib/mock/rendezvous";
import { TextInput, btnGhost, btnPrimary } from "../fidelite/ui";

// Édition d'un rendez-vous existant — inspiré de
// point-de-vente/components/planning/edit-rendez-vous-dialog.tsx : par ligne,
// changer la prestation / l'horaire / la praticienne (+ 2ᵉ praticienne) / le
// bénéficiaire, ajouter ou retirer une ligne, puis annuler tout le rendez-vous
// avec un motif. Contrairement à point-de-vente, pas d'annulation par ligne
// séparée (juste « Retirer ») — ça reste suffisant pour éditer une composition
// sans dupliquer un second niveau d'annulation.

const ACTIVE_PRESTATIONS = prestationSeeds.filter((p) => p.active);
const NO_SECOND = "__none__";

let newLineSeq = 1;
const newEditLineId = () => `p-edit-${newLineSeq++}`;

const categoryLabel = (serviceId: string | null) =>
  serviceSeeds.find((s) => s.id === serviceId)?.name ?? "Autres prestations";

const field =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

function useGroupedPrestations(salon: SalonId) {
  return useMemo(() => {
    const list = prestationsForSalon(ACTIVE_PRESTATIONS, salon);
    const map = new Map<string, Prestation[]>();
    for (const p of list) {
      const label = categoryLabel(p.serviceId);
      const group = map.get(label) ?? [];
      group.push(p);
      map.set(label, group);
    }
    return { list, grouped: [...map.entries()] };
  }, [salon]);
}

function LineRow({
  prestation,
  salon,
  date,
  rdvs,
  rdvId,
  canRemove,
  planningData,
  onSave,
  onRemove,
}: {
  prestation: RdvPrestation;
  salon: SalonId;
  date: string;
  rdvs: RdvDetail[];
  rdvId: string;
  canRemove: boolean;
  planningData?: PlanningData;
  onSave: (patch: Partial<RdvPrestation>) => void;
  onRemove: () => void;
}) {
  const { list, grouped } = useGroupedPrestations(salon);
  const [serviceId, setServiceId] = useState(prestation.prestationId);
  const [start, setStart] = useState(prestation.start);
  const [staff, setStaff] = useState(prestation.staff);
  const [secondStaff, setSecondStaff] = useState<string | null>(prestation.secondStaff ?? null);
  const [beneficiaryName, setBeneficiaryName] = useState(prestation.beneficiaryName);
  const [error, setError] = useState<string | null>(null);

  const chosen = list.find((p) => p.id === serviceId) ?? null;
  const staffOptions = chosen ? presentPractitionersForPrestation(chosen.id, salon, date, planningData) : [];
  const secondOptions = staffOptions.filter((m) => fullName(m) !== staff);

  const dirty =
    serviceId !== prestation.prestationId ||
    start !== prestation.start ||
    staff !== prestation.staff ||
    secondStaff !== (prestation.secondStaff ?? null) ||
    beneficiaryName !== prestation.beneficiaryName;

  const save = () => {
    if (!chosen) return;
    const names = [staff, secondStaff].filter((n): n is string => Boolean(n));
    const startMin = timeToMinutes(start);
    const conflict = names.find(
      (name) => !isStaffFreeForWindow(rdvs, name, date, startMin, chosen.durationMin, rdvId),
    );
    if (conflict) {
      setError(`${conflict} a déjà un rendez-vous sur ce créneau.`);
      return;
    }
    setError(null);
    const category = categoryLabel(chosen.serviceId);
    onSave({
      prestationId: chosen.id,
      category,
      name: chosen.name,
      durationMin: chosen.durationMin,
      price: chosen.priceFcfa,
      posteType: posteTypeForCategory(category),
      staff,
      secondStaff,
      start,
      beneficiaryName,
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 p-3">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setStaff(null);
            setSecondStaff(null);
          }}
          className={field}
        >
          {grouped.map(([label, group]) => (
            <optgroup key={label} label={label}>
              {group.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className={field}
        />
      </div>
      <input
        type="text"
        value={beneficiaryName}
        onChange={(e) => setBeneficiaryName(e.target.value)}
        placeholder="Bénéficiaire"
        className={field}
      />
      <select
        value={staff ?? "__any__"}
        onChange={(e) => {
          const v = e.target.value;
          setStaff(v === "__any__" ? null : v);
          setSecondStaff(null);
        }}
        className={field}
      >
        <option value="__any__">Première praticienne disponible</option>
        {staffOptions.map((m) => (
          <option key={m.id} value={fullName(m)}>
            {fullName(m)}
          </option>
        ))}
      </select>
      {chosen?.twoPractitioners && staff && (
        <select
          value={secondStaff ?? NO_SECOND}
          onChange={(e) => setSecondStaff(e.target.value === NO_SECOND ? null : e.target.value)}
          className={field}
        >
          <option value={NO_SECOND}>Seule</option>
          {secondOptions.map((m) => (
            <option key={m.id} value={fullName(m)}>
              {fullName(m)}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-theme-xs text-error-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={!dirty || !chosen}
          onClick={save}
          className={`${btnPrimary} !px-3 !py-1.5 text-theme-xs`}
        >
          Enregistrer
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-50"
          >
            Retirer
          </button>
        )}
      </div>
    </div>
  );
}

function AddLineForm({
  salon,
  date,
  planningData,
  onAdd,
}: {
  salon: SalonId;
  date: string;
  planningData?: PlanningData;
  onAdd: (line: RdvPrestation) => void;
}) {
  const { list, grouped } = useGroupedPrestations(salon);
  const [serviceId, setServiceId] = useState("");
  const [start, setStart] = useState("09:00");
  const [staff, setStaff] = useState<string | null>(null);
  const [beneficiaryName, setBeneficiaryName] = useState("");

  const chosen = list.find((p) => p.id === serviceId) ?? null;
  const staffOptions = chosen ? presentPractitionersForPrestation(chosen.id, salon, date, planningData) : [];

  const add = () => {
    if (!chosen) return;
    const category = categoryLabel(chosen.serviceId);
    onAdd({
      id: newEditLineId(),
      prestationId: chosen.id,
      category,
      name: chosen.name,
      durationMin: chosen.durationMin,
      price: chosen.priceFcfa,
      posteType: posteTypeForCategory(category),
      staff,
      start,
      beneficiaryName: beneficiaryName.trim() || "Nouvelle personne",
    });
    setServiceId("");
    setStaff(null);
    setBeneficiaryName("");
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-gray-300 p-3">
      <div className="grid grid-cols-2 gap-2">
        <select value={serviceId} onChange={(e) => (setServiceId(e.target.value), setStaff(null))} className={field}>
          <option value="">Choisir une prestation…</option>
          {grouped.map(([label, group]) => (
            <optgroup key={label} label={label}>
              {group.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
      </div>
      {chosen && (
        <>
          <input
            type="text"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            placeholder="Bénéficiaire (facultatif — sinon la payeuse)"
            className={field}
          />
          <select
            value={staff ?? "__any__"}
            onChange={(e) => setStaff(e.target.value === "__any__" ? null : e.target.value)}
            className={field}
          >
            <option value="__any__">Première praticienne disponible</option>
            {staffOptions.map((m) => (
              <option key={m.id} value={fullName(m)}>
                {fullName(m)}
              </option>
            ))}
          </select>
        </>
      )}
      <button
        type="button"
        disabled={!chosen}
        onClick={add}
        className={`${btnPrimary} !px-3 !py-1.5 text-theme-xs`}
      >
        + Ajouter cette prestation
      </button>
    </div>
  );
}

type Props = {
  open: boolean;
  detail: RdvDetail;
  rdvs: RdvDetail[];
  planningData?: PlanningData;
  onClose: () => void;
  onUpdateLine: (prestationId: string, patch: Partial<RdvPrestation>) => void;
  onAddLine: (line: RdvPrestation) => void;
  onRemoveLine: (prestationId: string) => void;
  onCancelRdv: (reason: string) => void;
};

export default function EditRdvDialog({
  open,
  detail,
  rdvs,
  planningData,
  onClose,
  onUpdateLine,
  onAddLine,
  onRemoveLine,
  onCancelRdv,
}: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reason, setReason] = useState("");
  const salon = detail.salon;
  const date = detail.date.slice(0, 10);

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton={false} className="max-w-xl m-4">
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold text-gray-800">Modifier le rendez-vous</h3>
        <p className="mt-1 text-theme-sm text-gray-500">
          {detail.client.name} · {detail.ref}
        </p>

        <div className="mt-5 space-y-3">
          {detail.prestations.map((p) => (
            <LineRow
              key={p.id}
              prestation={p}
              salon={salon}
              date={date}
              rdvs={rdvs}
              rdvId={detail.id}
              canRemove={detail.prestations.length > 1}
              planningData={planningData}
              onSave={(patch) => onUpdateLine(p.id, patch)}
              onRemove={() => onRemoveLine(p.id)}
            />
          ))}
          <AddLineForm salon={salon} date={date} planningData={planningData} onAdd={onAddLine} />
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          {confirmCancel ? (
            <div className="space-y-3">
              <TextInput
                label="Motif de l'annulation (facultatif)"
                value={reason}
                onChange={setReason}
                placeholder="La cliente a un empêchement…"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCancelRdv(reason.trim());
                    setConfirmCancel(false);
                    setReason("");
                  }}
                  className="inline-flex items-center rounded-lg bg-error-600 px-4 py-2.5 text-theme-sm font-medium text-white hover:bg-error-700"
                >
                  Annuler le rendez-vous
                </button>
                <button type="button" className={btnGhost} onClick={() => setConfirmCancel(false)}>
                  Retour
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="text-theme-sm font-medium text-error-600 hover:underline"
            >
              Annuler ce rendez-vous
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-5">
          <button type="button" className={btnPrimary} onClick={onClose}>
            Terminé
          </button>
        </div>
      </div>
    </Modal>
  );
}
