"use client";

import { useState } from "react";
import { Select } from "@/components/ui/atoms/select";
import { Toggle } from "../fidelite/ui";
import {
  DEPOSIT_MIN_FCFA,
  DEPOSIT_MODE_OPTIONS,
  defaultPaymentSettings,
  depositSummary,
  type PaymentSettings,
} from "@/lib/mock/paiement";
import { fcfa } from "@/lib/mock/beautyandco";
import { SaveBar, SavedNote, SettingsGroup, SettingsRow, UnitInput } from "./kit";

// Réglages › Paiement — encaissement réel ou mode test, acompte demandé à la
// réservation, moyens de paiement mobile. Brouillon local : rien n'est appliqué
// avant « Enregistrer » dans la barre qui apparaît dès la première modification.

// Chaîne de saisie → entier positif (vide / invalide → 0).
const toPositiveInt = (raw: string) => {
  const n = Math.floor(Number(raw.replace(/\D/g, "")));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function PaiementPanel() {
  // Aucun backend : les paramètres sont édités en mémoire de session.
  const [settings, setSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [draft, setDraft] = useState<PaymentSettings>(defaultPaymentSettings);
  const [justSaved, setJustSaved] = useState(false);

  const set = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setJustSaved(false);
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const belowMin = draft.depositMode === "fixed" && draft.depositFixed < DEPOSIT_MIN_FCFA;
  const noDeposit = draft.depositMode === "none";

  const save = () => {
    if (belowMin) return;
    setSettings(draft);
    setJustSaved(true);
  };

  return (
    <div className="space-y-6">
      <SettingsGroup title="Encaissement en ligne">
        <SettingsRow
          label="Encaissement réel"
          help={
            draft.liveMode ? (
              "Chaque réservation débite réellement la cliente et crédite le compte du salon."
            ) : (
              <span className="font-medium text-warning-700">
                Mode test : les réservations n&apos;entraînent aucun débit. Réactivez pour
                percevoir les acomptes.
              </span>
            )
          }
        >
          <Toggle
            checked={draft.liveMode}
            onChange={(v) => set("liveMode", v)}
            aria-label="Encaissement réel"
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Acompte à la réservation">
        <SettingsRow
          label="Acompte demandé"
          help="Le même pour toutes les réservations en ligne, quelle que soit la prestation."
          wide
        >
          <Select
            value={draft.depositMode}
            onChange={(v) => set("depositMode", v as PaymentSettings["depositMode"])}
            options={DEPOSIT_MODE_OPTIONS}
          />
        </SettingsRow>

        {draft.depositMode === "fixed" && (
          <SettingsRow
            label="Montant de l'acompte"
            htmlFor="deposit-fixed"
            help={
              belowMin ? (
                <span className="text-error-600">
                  Le minimum accepté est de {fcfa(DEPOSIT_MIN_FCFA)}.
                </span>
              ) : (
                depositSummary(draft)
              )
            }
            wide
          >
            <UnitInput
              id="deposit-fixed"
              unit="FCFA"
              invalid={belowMin}
              value={draft.depositFixed ? String(draft.depositFixed) : ""}
              onChange={(v) => set("depositFixed", toPositiveInt(v))}
            />
          </SettingsRow>
        )}

        {draft.depositMode === "percent" && (
          <SettingsRow
            label="Part du total"
            htmlFor="deposit-percent"
            help={depositSummary(draft)}
            wide
          >
            <UnitInput
              id="deposit-percent"
              unit="%"
              value={String(draft.depositPercent)}
              onChange={(v) => set("depositPercent", Math.min(100, toPositiveInt(v)))}
            />
          </SettingsRow>
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Paiement mobile"
        description={
          noDeposit
            ? "Sans acompte, aucun montant n'est débité par ces moyens de paiement."
            : "Moyens proposés pour régler l'acompte en ligne. Les espèces et la carte restent acceptées au comptoir."
        }
      >
        <SettingsRow label="Wave" muted={noDeposit}>
          <Toggle checked={draft.waveEnabled} onChange={(v) => set("waveEnabled", v)} aria-label="Wave" />
        </SettingsRow>
        <SettingsRow label="Orange Money" muted={noDeposit}>
          <Toggle
            checked={draft.orangeMoneyEnabled}
            onChange={(v) => set("orangeMoneyEnabled", v)}
            aria-label="Orange Money"
          />
        </SettingsRow>
      </SettingsGroup>

      <SavedNote show={justSaved && !dirty} />
      <SaveBar
        dirty={dirty}
        onSave={save}
        onReset={() => setDraft(settings)}
        blocked={belowMin ? `L'acompte doit être d'au moins ${fcfa(DEPOSIT_MIN_FCFA)}.` : null}
      />
    </div>
  );
}
