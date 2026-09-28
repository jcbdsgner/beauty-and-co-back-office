"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import Alert from "@/components/ui/alert/Alert";
import { frShortDate } from "@/lib/mock/beautyandco";
import {
  ABSENCE_TYPE_OPTIONS,
  newAbsenceId,
  type Absence,
  type AbsenceType,
} from "@/lib/mock/planning";
import { fullName, type Member } from "@/lib/mock/staff";
import { SelectField, TextInput, btnGhost, btnPrimary } from "../fidelite/ui";

type Props = {
  open: boolean;
  member: Member | null;
  defaultDate: string;
  // Rendez-vous non annulés de ce membre, par jour ISO — pour l'alerte de conflit.
  rdvDays: { date: string; count: number }[];
  onClose: () => void;
  onSubmit: (absence: Absence) => void;
};

const dateField =
  "h-11 w-full rounded-field border border-base-300 bg-white px-4 text-sm text-base-content focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]";

export default function AbsenceDialog({
  open,
  member,
  defaultDate,
  rdvDays,
  onClose,
  onSubmit,
}: Props) {
  const [type, setType] = useState<AbsenceType>("conge");
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState(defaultDate);
  const [to, setTo] = useState(defaultDate);

  // Réinitialise à l'ouverture sur une nouvelle cellule.
  const key = `${member?.id ?? ""}__${defaultDate}`;
  const [lastKey, setLastKey] = useState(key);
  if (open && key !== lastKey) {
    setLastKey(key);
    setType("conge");
    setReason("");
    setFrom(defaultDate);
    setTo(defaultDate);
  }

  const rangeValid = from !== "" && to !== "" && from <= to;

  const conflicts = useMemo(() => {
    if (!rangeValid) return 0;
    return rdvDays
      .filter((d) => d.date >= from && d.date <= to)
      .reduce((n, d) => n + d.count, 0);
  }, [rdvDays, from, to, rangeValid]);

  if (!member) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-lg m-4"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-base-content">
          Poser une absence — {fullName(member)}
        </h3>
        <p className="mt-1 text-sm text-base-content/60">
          L&apos;absence remplace les horaires habituels sur toute la période.
        </p>

        <div className="mt-6 space-y-5">
          <SelectField
            label="Motif"
            value={type}
            onChange={setType}
            options={ABSENCE_TYPE_OPTIONS}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="absence-from"
                className="mb-1.5 block text-sm font-medium text-base-content"
              >
                Du
              </label>
              <input
                id="absence-from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  if (to < e.target.value) setTo(e.target.value);
                }}
                className={dateField}
              />
            </div>
            <div>
              <label
                htmlFor="absence-to"
                className="mb-1.5 block text-sm font-medium text-base-content"
              >
                Au
              </label>
              <input
                id="absence-to"
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className={dateField}
              />
            </div>
          </div>

          <TextInput
            label="Précision (facultatif)"
            value={reason}
            onChange={setReason}
            placeholder="Congé annuel, rendez-vous médical…"
          />

          {conflicts > 0 && (
            <Alert
              variant="warning"
              title={`${conflicts} rendez-vous sur cette période`}
              message={`${member.firstName} a déjà ${conflicts} rendez-vous programmé${
                conflicts > 1 ? "s" : ""
              } entre le ${frShortDate(from)} et le ${frShortDate(to)}. Pensez à les réattribuer ou à les reporter.`}
            />
          )}
          {conflicts > 0 && (
            <Link
              href="/rendez-vous"
              className="inline-block text-sm font-medium text-brand-600 hover:text-secondary"
            >
              Voir les rendez-vous →
            </Link>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            className={btnPrimary}
            disabled={!rangeValid}
            onClick={() =>
              onSubmit({
                id: newAbsenceId(),
                memberId: member.id,
                from,
                to,
                type,
                reason: reason.trim() || undefined,
              })
            }
          >
            Enregistrer l&apos;absence
          </button>
          <button type="button" className={btnGhost} onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
