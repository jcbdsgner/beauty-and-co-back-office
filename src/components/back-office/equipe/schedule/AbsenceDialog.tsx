"use client";

import { useId, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Select } from "@/components/ui/atoms/select";
import { TextInput } from "@/components/ui/atoms/text-input";
import { Dialog } from "@/components/ui/molecules/dialog";
import { Field } from "@/components/ui/molecules/field";
import { ABSENCE_LABELS, newAbsenceId, type Absence, type AbsenceType } from "@/lib/mock/planning";
import type { Member } from "@/lib/mock/staff";
import type { PlanningRow } from "../planning-board/data";

// « Ajouter une absence » — congé, maladie, formation ou repos sur une plage de
// dates (la case du planning, elle, ne pose qu'un jour). Prévient quand des
// rendez-vous sont déjà affectés au membre sur la période.

const TYPE_OPTIONS = (["conge", "maladie", "formation", "repos"] as AbsenceType[]).map((value) => ({
  value,
  label: ABSENCE_LABELS[value],
}));

type Props = {
  team: Member[];
  defaultFrom: string;
  rows: PlanningRow[];
  onClose: () => void;
  onSubmit: (absence: Absence) => void;
};

export function AbsenceDialog({ team, defaultFrom, rows, onClose, onSubmit }: Props) {
  const titleId = useId();
  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState<AbsenceType>("conge");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultFrom);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);

  const member = team.find((m) => m.id === memberId);
  const rangeError = !from || !to ? "Indiquez les deux dates." : to < from ? "La date de fin doit suivre la date de début." : null;
  const memberError = !memberId ? "Choisissez la personne absente." : null;
  const clash = member
    ? rows.filter((r) => r.dateIso >= from && r.dateIso <= to && (r.staffId === member.id || r.secondStaffId === member.id))
    : [];

  const submit = () => {
    setTried(true);
    if (rangeError || memberError) return;
    onSubmit({ id: newAbsenceId(), memberId, from, to, type, reason: reason.trim() || undefined });
  };

  return (
    <Dialog open onClose={onClose} labelledBy={titleId} className="max-w-md p-6">
      <h2 id={titleId} className="text-lg font-semibold text-base-content">
        Ajouter une absence
      </h2>
      <p className="mt-1 text-sm text-base-content/60">Pour un seul jour, cliquez plutôt sur la case du planning.</p>

      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Membre de l'équipe" error={tried ? (memberError ?? undefined) : undefined}>
          <Select
            value={memberId}
            onChange={setMemberId}
            placeholder="Choisir…"
            options={team.map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}`.trim() }))}
          />
        </Field>
        <Field label="Motif">
          <Select value={type} onChange={(v) => setType(v as AbsenceType)} options={TYPE_OPTIONS} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Du">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Au">
            <TextInput type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        {tried && rangeError && (
          <p role="alert" className="-mt-2 text-sm font-medium text-error">
            {rangeError}
          </p>
        )}
        <Field label="Précision (facultatif)">
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. congé annuel" />
        </Field>

        {member && !rangeError && clash.length > 0 && (
          <div className="flex gap-2.5 rounded-field bg-warning/10 px-3 py-2.5 text-sm text-base-content/80">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>
              {member.firstName} a {clash.length === 1 ? "1 rendez-vous" : `${clash.length} rendez-vous`} sur cette période : ils
              seront confiés à une autre praticienne disponible, sinon signalés à régler au tableau de bord.
            </p>
          </div>
        )}

        <div className="mt-1 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1">
            Enregistrer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
