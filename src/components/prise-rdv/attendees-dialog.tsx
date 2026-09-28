"use client";

import { useState } from "react";
import { CloseButton } from "@/components/prise-rdv/ui/icon-button";
import Image from "next/image";
import { cn } from "@/lib/prise-rdv/utils";
import { Dialog } from "@/components/prise-rdv/ui/dialog";
import { Stepper } from "@/components/prise-rdv/ui/stepper";

export type Attendees = {
  adults: number;
  children: number;
};

const MIN_ADULTS = 0;
const MIN_CHILDREN = 0;
const MAX_TOGETHER = 3;

const partyPresets: { total: number; hint: string; icon: string }[] = [
  { total: 1, hint: "Solo", icon: "/images/rdv/icon-person-input.svg" },
  { total: 2, hint: "Duo", icon: "/images/rdv/icon-people.svg" },
  { total: 3, hint: "Trio", icon: "/images/rdv/icon-people-trio.svg" },
];

type AttendeesDialogProps = {
  open: boolean;
  onConfirm: (attendees: Attendees) => void;
  /** Point de vente : la composition existante quand on modifie une réservation (ADR 0032). */
  initial?: Attendees | null;
  /** Point de vente : fermer le parcours depuis cette première fenêtre. */
  onCancel?: () => void;
};

export function AttendeesDialog({ open, onConfirm, initial, onCancel }: AttendeesDialogProps) {
  // Default to 1 adult (the common case: booking for yourself) even though the stepper
  // itself allows going down to 0 adults, to support a solo child booking.
  const [adults, setAdults] = useState(initial?.adults ?? 1);
  const [children, setChildren] = useState(initial?.children ?? MIN_CHILDREN);
  const canConfirm = adults + children > 0;

  return (
    <Dialog
      open={open}
      labelledBy="attendees-title"
      className="relative max-w-[440px] rounded-lg border border-[var(--color-slate-200)] p-6 shadow-[0px_10px_7.5px_0px_rgba(0,0,0,0.1),0px_4px_3px_0px_rgba(0,0,0,0.1)]"
    >
      {onCancel && <CloseButton onClick={onCancel} className="top-4 right-4" />}
      <h2
        id="attendees-title"
        className="text-center text-[25px] font-bold tracking-[-0.01em] text-[var(--brand-taupe-muted)] sm:text-[27px]"
      >
        Qui participe à cette séance ?
      </h2>
      <p className="mt-2 text-center text-[17px] text-[var(--color-gray-500)]">
        Indiquez le nombre d&apos;adultes et d&apos;enfants.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {partyPresets.map((preset) => {
          const selected = adults + children === preset.total;
          return (
            <button
              key={preset.total}
              type="button"
              onClick={() => {
                setAdults(preset.total);
                setChildren(0);
              }}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition",
                selected
                  ? "border-[var(--core-brand-color)] bg-[rgba(237,220,218,0.3)]"
                  : "border-[rgba(139,90,79,0.2)] bg-white hover:border-[var(--brand-taupe-muted)]/40",
              )}
            >
              <Image src={preset.icon} alt="" width={32} height={32} className="size-8" />
              <p className="text-[14px] font-semibold text-[var(--color-gray-800)]">
                {preset.total} personne{preset.total > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-[var(--color-gray-500)]">{preset.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-2 divide-y divide-[var(--color-gray-200)]">
        <Stepper
          label="Adultes"
          hint="Hommes et femmes de tous âges"
          value={adults}
          min={MIN_ADULTS}
          max={MAX_TOGETHER - children}
          onChange={setAdults}
        />
        <Stepper
          label="Enfants (Mini & Co)"
          hint="Petites filles de 4 à 12 ans"
          value={children}
          min={MIN_CHILDREN}
          max={MAX_TOGETHER - adults}
          onChange={setChildren}
        />
      </div>

      <p className="mt-3 text-center text-[13px] text-[var(--color-gray-400)]">
        {canConfirm ? `${MAX_TOGETHER} personnes maximum au total.` : "Sélectionnez au moins 1 participant."}
      </p>

      <button
        type="button"
        disabled={!canConfirm}
        onClick={() => onConfirm({ adults, children })}
        className="mt-6 w-full rounded-full bg-[var(--core-brand-color)] px-8 py-3 text-[17px] font-[450] text-black shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:opacity-90"
      >
        Continuer
      </button>
    </Dialog>
  );
}
