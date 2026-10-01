"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TextInput } from "@/components/ui/atoms/text-input";
import { Field } from "@/components/ui/molecules/field";
import { TrashBinIcon } from "@/icons";
import { TODAY_ISO } from "@/lib/mock/planning";
import { allRendezvous } from "@/lib/mock/rendezvous";
import { newPauseId, pauseRangeLabel, type PrestationPause } from "@/lib/mock/services";
import { btnGhost } from "./ui";

type Props = {
  prestationId: string | null; // null = création, aucun rendez-vous à signaler
  pauses: PrestationPause[];
  onChange: (pauses: PrestationPause[]) => void;
};

// Rendez-vous à venir déjà pris pour cette prestation sur la période : ils sont
// maintenus (rien n'est annulé), mais la propriétaire doit le savoir.
function bookedDuring(prestationId: string | null, from: string, to: string): number {
  if (!prestationId || !from || !to || to < from) return 0;
  return allRendezvous().filter((r) => {
    const day = r.date.slice(0, 10);
    return (
      r.status === "à venir" &&
      day >= from &&
      day <= to &&
      r.prestations.some((p) => p.prestationId === prestationId)
    );
  }).length;
}

// « Périodes d'indisponibilité » de la fiche prestation : des plages de dates
// où la prestation n'est pas proposée du tout, en plus des jours de la semaine.
export default function PausesEditor({ prestationId, pauses, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  const sorted = [...pauses].sort((a, b) => a.from.localeCompare(b.from));
  const current = sorted.filter((p) => p.to >= TODAY_ISO);
  const past = sorted.filter((p) => p.to < TODAY_ISO);

  const rangeError = from && to && to < from ? "La date de fin doit suivre la date de début." : null;
  const overlap =
    from && to && !rangeError ? pauses.find((p) => from <= p.to && to >= p.from) ?? null : null;
  const valid = from !== "" && to !== "" && !rangeError && !overlap;
  const booked = valid ? bookedDuring(prestationId, from, to) : 0;

  const reset = () => {
    setFrom("");
    setTo("");
    setReason("");
    setAdding(false);
  };

  const add = () => {
    if (!valid) return;
    onChange([...pauses, { id: newPauseId(), from, to, reason: reason.trim() }]);
    reset();
  };

  return (
    <div>
      <span className="block text-sm font-medium text-base-content">Périodes d&apos;indisponibilité</span>
      <p className="mb-2 text-xs text-base-content/60">
        Du … au … : la prestation n&apos;est pas proposée pendant ces dates, quel que soit le jour.
      </p>

      {current.length > 0 ? (
        <ul className="mb-2 divide-y divide-base-300 rounded-lg border border-base-300 bg-white">
          {current.map((p) => {
            const ongoing = p.from <= TODAY_ISO;
            const n = bookedDuring(prestationId, p.from, p.to);
            return (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-base-content">
                    <span className="font-medium">Indisponible {pauseRangeLabel(p)}</span>
                    {ongoing && <span className="ml-2 text-xs font-medium text-warning-600">En cours</span>}
                  </p>
                  {(p.reason || n > 0) && (
                    <p className="text-xs text-base-content/60">
                      {p.reason}
                      {p.reason && n > 0 && " · "}
                      {n > 0 && `${n} rendez-vous déjà pris sur la période`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onChange(pauses.filter((x) => x.id !== p.id))}
                  aria-label={`Retirer la période ${pauseRangeLabel(p)}`}
                  className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        !adding && <p className="mb-2 text-sm text-base-content/60">Aucune période prévue.</p>
      )}

      {adding ? (
        <div className="rounded-lg border border-base-300 bg-white p-3">
          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-3">
            <Field label="Du">
              <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Au">
              <TextInput type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Motif (facultatif)">
              <TextInput
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rupture de produit, formation…"
              />
            </Field>
          </div>
          {rangeError && (
            <p role="alert" className="mt-2 text-xs font-medium text-error-600">
              {rangeError}
            </p>
          )}
          {overlap && (
            <p role="alert" className="mt-2 text-xs font-medium text-error-600">
              Ces dates recoupent la période {pauseRangeLabel(overlap)}. Retirez-la ou choisissez d&apos;autres dates.
            </p>
          )}
          {booked > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-warning-600">
              <AlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
              {booked} rendez-vous {booked > 1 ? "sont" : "est"} déjà pris sur ces dates pour cette prestation.{" "}
              {booked > 1 ? "Ils restent maintenus" : "Il reste maintenu"} : seules les nouvelles réservations sont
              bloquées.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={add} disabled={!valid} className={btnGhost}>
              Ajouter la période
            </button>
            <button type="button" onClick={reset} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={btnGhost}>
          Ajouter une période
        </button>
      )}

      {past.length > 0 && (
        <p className="mt-2 text-xs text-base-content/50">
          {past.length} période{past.length > 1 ? "s" : ""} passée{past.length > 1 ? "s" : ""}, sans effet.
        </p>
      )}
    </div>
  );
}
