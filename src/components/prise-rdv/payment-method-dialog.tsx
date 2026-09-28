"use client";

import { Dialog } from "@/components/prise-rdv/ui/dialog";
import { Button } from "@/components/prise-rdv/ui/button";
import { CloseButton } from "@/components/prise-rdv/ui/icon-button";

/** Les moyens du site, plus les espèces au comptoir (ADR 0032). */
export type PaymentMethod = "mobile-money" | "card" | "cash";

type PaymentMethodDialogProps = {
  open: boolean;
  amountLabel: string;
  description?: string;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
};

function SmartphoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="2" x2="22" y1="10" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Payment-method picker shown before a booking is confirmed. Mirrors the layout of the legacy site's dialog, but every option here only simulates success — this project has no real payment backend yet (see docs/adr). */
export function PaymentMethodDialog({ open, amountLabel, description, onClose, onSelect }: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} labelledBy="payment-method-title" className="max-w-md rounded-lg p-6">
      <div className="relative pr-8">
        <h2 id="payment-method-title" className="text-xl font-semibold text-[var(--color-gray-900)]">
          Choisissez votre moyen de paiement
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-gray-500)]">
          {description ?? `Réglez l'acompte (${amountLabel}) pour confirmer votre rendez-vous.`}
        </p>
        <CloseButton onClick={onClose} className="top-0 right-0" />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Button
          type="button"
          onClick={() => onSelect("mobile-money")}
          icon={<SmartphoneIcon />}
          className="h-12 w-full font-semibold"
        >
          Mobile money / Wave / Orange Money
        </Button>

        <Button
          type="button"
          onClick={() => onSelect("cash")}
          icon={<CashIcon />}
          className="h-12 w-full font-semibold"
        >
          Espèces
        </Button>

        <div className="rounded-xl border border-[var(--core-brand-color)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-gray-700)]">
            <CardIcon />
            Carte bancaire / PayPal
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onSelect("card")}
              className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-[var(--on-core-brand-color)] text-white transition hover:opacity-90"
            >
              Payer avec <span className="font-bold italic">Pay<span className="text-[#4d9fe8]">Pal</span></span>
            </button>
            <button
              type="button"
              onClick={() => onSelect("card")}
              className="flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--on-core-brand-color)] text-white transition hover:opacity-90"
            >
              <CardIcon />
              Carte bancaire
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-[var(--color-gray-400)]">Optimisé par PayPal</p>
        </div>
      </div>
    </Dialog>
  );
}
