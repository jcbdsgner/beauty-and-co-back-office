"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TextInput } from "@/components/ui/atoms/text-input";
import { Field } from "@/components/ui/molecules/field";
import { TrashBinIcon } from "@/icons";
import { TODAY_ISO } from "@/lib/mock/planning";
import { allRendezvous } from "@/lib/mock/rendezvous";
import { newPauseId, pauseRangeLabel, type PrestationPause } from "@/lib/mock/services";
import { AddLink, Muted, RuleLine } from "./FicheGroup";
import { btnGhost, btnPrimary } from "./ui";

type Props = {
  prestationId: string | null; // null = création, aucun rendez-vous à signaler
  pauses: PrestationPause[];
  onChange: (pauses: PrestationPause[]) => void;
};

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

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

// Ligne « Pauses » de la fiche prestation : des plages de dates où la
// prestation n'est pas proposée du tout, en plus des jours de la semaine. Les
// pauses passées ne s'affichent plus (sans effet).
export default function PausesEditor({ prestationId, pauses, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  const sorted = [...pauses].sort((a, b) => a.from.localeCompare(b.from));
  const current = sorted.filter((p) => p.to >= TODAY_ISO);

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
      {current.length > 0 && (
        <ul className="space-y-1">
          {current.map((p) => {
            const ongoing = p.from <= TODAY_ISO;
            const n = bookedDuring(prestationId, p.from, p.to);
            return (
              <li key={p.id} className="flex min-h-9 items-center gap-3">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium text-base-content">{capitalize(pauseRangeLabel(p))}</span>
                  {ongoing && (
                    <span className="ml-2 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                      En cours
                    </span>
                  )}
                  {(p.reason || n > 0) && (
                    <span className="block text-xs text-base-content/60">
                      {p.reason}
                      {p.reason && n > 0 && " · "}
                      {n > 0 && `${n} rendez-vous déjà pris`}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onChange(pauses.filter((x) => x.id !== p.id))}
                  aria-label={`Retirer la pause ${pauseRangeLabel(p)}`}
                  title="Retirer la pause"
                  className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="mt-1 rounded-lg bg-base-200/70 p-3">
          <div className="grid grid-cols-2 items-start gap-3">
            <Field label="Du">
              <TextInput type="date" value={from} autoFocus onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Au">
              <TextInput type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Motif" className="col-span-2">
              <TextInput
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Formation, machine en panne…"
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
              Déjà en pause {pauseRangeLabel(overlap)}.
            </p>
          )}
          {booked > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-warning-700">
              <AlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
              {booked} rendez-vous déjà pris sur ces dates — {booked > 1 ? "ils restent maintenus" : "il reste maintenu"}.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={add} disabled={!valid} className={btnPrimary}>
              Mettre en pause
            </button>
            <button type="button" onClick={reset} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <RuleLine
          action={<AddLink onClick={() => setAdding(true)}>Mettre en pause</AddLink>}
        >
          {current.length === 0 && <Muted>Aucune</Muted>}
        </RuleLine>
      )}
    </div>
  );
}
