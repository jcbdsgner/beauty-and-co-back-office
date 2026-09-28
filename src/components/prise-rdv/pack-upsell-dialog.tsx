"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@/components/prise-rdv/ui/dialog";
import { formatPrice } from "@/lib/prise-rdv/format";
import { getPackPrestations, getPackPrice, packs, type Pack } from "@/lib/prise-rdv/data/packs";
import { cn } from "@/lib/prise-rdv/utils";

type PackUpsellDialogProps = {
  open: boolean;
  onChoosePack: (pack: Pack) => void;
  onSkip: () => void;
};

function PackTile({
  pack,
  defaultExpanded,
  onChoose,
}: {
  pack: Pack;
  defaultExpanded: boolean;
  onChoose: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const prestations = getPackPrestations(pack);

  return (
    <div className="rounded-xl border-2 border-[var(--color-border-light)] p-3 transition hover:border-[var(--brand-taupe-muted)]/40">
      <div className="flex items-center gap-3">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg">
          <Image src={pack.image} alt="" fill sizes="56px" className="object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-[var(--color-gray-800)]">{pack.label}</p>
          <p className="text-[15px] font-[450] text-[var(--brand-taupe-muted)]">{formatPrice(getPackPrice(pack))}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex shrink-0 items-center gap-1 text-[13px] font-[450] text-[var(--color-gray-500)] transition hover:text-[var(--brand-taupe-muted)]"
        >
          Contenu
          <Image
            src="/images/rdv/icon-chevron-down.svg"
            alt=""
            width={12}
            height={12}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>

      {expanded && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-[var(--color-gray-100)] pt-3">
          {prestations.map((prestation) => (
            <li key={prestation.id} className="flex items-start gap-2 text-[14px] text-[var(--color-gray-600)]">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--brand-taupe-muted)]/50" />
              <span>
                {prestation.label} <span className="text-[var(--color-gray-400)]">· {prestation.duration}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onChoose}
        className="mt-3 w-full rounded-full border border-[var(--brand-taupe-muted)] py-2 text-[15px] font-[450] text-[var(--brand-taupe-muted)] transition hover:bg-[var(--brand-taupe-muted)]/5"
      >
        Choisir ce pack
      </button>
    </div>
  );
}

/** Shown right after the attendee count is confirmed, when nobody in this booking owns an unredeemed Pack prestation yet — a one-time upsell to prepay a bundle at -20%. Paid together with the rest of this booking at the final confirmation, not on the spot here — see ConfirmationStep. */
export function PackUpsellDialog({ open, onChoosePack, onSkip }: PackUpsellDialogProps) {
  return (
    <Dialog
      open={open}
      labelledBy="pack-upsell-title"
      className="flex max-h-[90vh] max-w-[600px] flex-col overflow-hidden rounded-lg border border-[var(--color-slate-200)] shadow-[0px_10px_7.5px_0px_rgba(0,0,0,0.1),0px_4px_3px_0px_rgba(0,0,0,0.1)]"
    >
      {/* Scrolls on its own so the "Continuer sans pack" footer below stays put and never needs
          scrolling to reach — see the "no need to scroll for it" requirement this implements. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
        <h2
          id="pack-upsell-title"
          className="text-center text-[23px] font-bold tracking-[-0.01em] text-[var(--brand-taupe-muted)] sm:text-[26px]"
        >
          Envie d&apos;un Pack ?
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-center text-[16px] text-[var(--color-gray-500)]">
          Prépayez un ensemble de prestations et économisez 20% par rapport au prix à l&apos;unité.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {packs.map((pack, index) => (
            <PackTile key={pack.id} pack={pack} defaultExpanded={index < 2} onChoose={() => onChoosePack(pack)} />
          ))}
        </div>
      </div>

      {/* Shadow cast upward onto the scrollable list above — not on the button itself — so this
          footer reads as a fixed layer sitting above the scrolling content, not part of the flow. */}
      <div className="shrink-0 border-t border-[var(--color-gray-100)] px-6 py-4 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.15)] sm:px-8">
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-full border border-[var(--brand-taupe-muted)] py-2 text-[15px] font-[450] text-[var(--brand-taupe-muted)] transition hover:bg-[var(--brand-taupe-muted)]/5"
        >
          Continuer sans pack
        </button>
      </div>
    </Dialog>
  );
}
