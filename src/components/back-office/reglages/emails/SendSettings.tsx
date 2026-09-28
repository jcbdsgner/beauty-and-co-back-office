"use client";

import { Info } from "lucide-react";
import { Select } from "@/components/ui/atoms/select";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import {
  DELAY_MAX,
  DELAY_UNIT_OPTIONS,
  DIRECTION_OPTIONS,
  EMAIL_EVENT_OPTIONS,
  isPurchaseEvent,
  sendLabel,
  type DelayUnit,
  type EmailEvent,
  type EmailSend,
  type SendDirection,
} from "@/lib/mock/emails";

// Réglage d'envoi d'un modèle (panneau d'édition) : manuel, ou automatique à
// l'occasion d'un événement, avec un délai avant / après. La phrase du bas
// relit le réglage en clair — c'est elle qu'on vérifie, pas les menus.

const MODE_OPTIONS = [
  { value: "manual", label: "Manuel" },
  { value: "auto", label: "Automatique" },
];

export default function SendSettings({
  send,
  onChange,
}: {
  send: EmailSend;
  onChange: (next: EmailSend) => void;
}) {
  const set = (patch: Partial<EmailSend>) => onChange({ ...send, ...patch });
  const immediate = send.value === 0;
  const anticipatedPurchase = send.auto && !immediate && send.direction === "before" && isPurchaseEvent(send.event);

  return (
    <div role="group" aria-labelledby="send-mode-label" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p id="send-mode-label" className="text-sm font-medium text-base-content">Envoi</p>
        <SegmentedToggle
          size="sm"
          aria-label="Mode d'envoi"
          options={MODE_OPTIONS}
          value={send.auto ? "auto" : "manual"}
          onChange={(v) => set({ auto: v === "auto" })}
          className="w-64"
        />
      </div>

      {send.auto ? (
        <div className="space-y-4 rounded-box border border-base-300 bg-base-200/50 p-4">
          <div>
            <p className="mb-1.5 text-sm text-base-content/70">
              À l&apos;occasion de
            </p>
            <Select
              aria-label="À l'occasion de"
              value={send.event}
              onChange={(v) => set({ event: v as EmailEvent })}
              options={EMAIL_EVENT_OPTIONS}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm text-base-content/70">Quand</p>
            <div className="grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] gap-2">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Délai"
                value={String(send.value)}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                  set({ value: Number.isNaN(n) ? 0 : Math.min(n, DELAY_MAX) });
                }}
                onFocus={(e) => e.target.select()}
                className="input input-md w-full bg-base-100 text-center text-[15px] tabular-nums"
              />
              <Select
                aria-label="Unité du délai"
                value={send.unit}
                onChange={(v) => set({ unit: v as DelayUnit })}
                options={DELAY_UNIT_OPTIONS}
              />
              <Select
                aria-label="Avant ou après"
                value={send.direction}
                onChange={(v) => set({ direction: v as SendDirection })}
                options={DIRECTION_OPTIONS}
                disabled={immediate}
              />
            </div>
            <p className="mt-1.5 text-xs text-base-content/55">
              0 pour un envoi au moment même de l&apos;événement.
            </p>
          </div>

          <p role="status" className="border-t border-base-300 pt-3 text-sm text-base-content">
            Part <span className="font-semibold">{sendLabel(send).replace(/^./, (c) => c.toLowerCase())}</span>.
          </p>

          {anticipatedPurchase && (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-warning-700">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Un achat ne se prévoit pas : envoyé « avant », cet email ne part que si
              l&apos;achat est enregistré à l&apos;avance (précommande, date convenue).
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-base-content/60">
          Cet email ne part que lorsque vous l&apos;envoyez vous-même depuis la fiche cliente.
        </p>
      )}
    </div>
  );
}
