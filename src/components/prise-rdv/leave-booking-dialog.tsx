"use client";

import { Dialog } from "@/components/prise-rdv/ui/dialog";
import { Button } from "@/components/prise-rdv/ui/button";
import { CloseButton } from "@/components/prise-rdv/ui/icon-button";

type LeaveBookingDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LeaveBookingDialog({ open, onCancel, onConfirm }: LeaveBookingDialogProps) {
  return (
    <Dialog
      open={open}
      role="alertdialog"
      labelledBy="leave-booking-title"
      className="max-w-[460px] overflow-hidden rounded-xl border border-[var(--color-neutral-200)] shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]"
    >
      <div className="relative flex gap-4 border-b border-[var(--color-neutral-200)] p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[rgba(217,45,32,0.08)]">
          <span className="text-2xl leading-none font-bold text-[var(--color-error)]">!</span>
        </span>
        <div className="pr-6">
          <h2 id="leave-booking-title" className="text-xl font-bold text-[var(--color-gray-900)]">
            Quitter la prise de rendez-vous ?
          </h2>
          <p className="mt-1 text-base text-[var(--color-gray-600)]">
            Les informations de votre réservation en cours ne seront pas enregistrées.
          </p>
        </div>
        <CloseButton onClick={onCancel} />
      </div>

      <div className="flex items-center justify-end gap-3 p-6">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-[rgba(136,102,102,0.3)] px-6 py-2 text-base text-[var(--brand-taupe-muted)] hover:bg-black/[.02]"
        >
          Continuer ma réservation
        </Button>
        <Button type="button" onClick={onConfirm} className="px-6 py-2 text-base">
          Quitter
        </Button>
      </div>
    </Dialog>
  );
}
