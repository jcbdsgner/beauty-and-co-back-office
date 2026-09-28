"use client";

import { useState } from "react";
import { Select } from "@/components/ui/atoms/select";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  ACCRUAL_BASIS_OPTIONS,
  ROUNDING_OPTIONS,
  points as fmtPoints,
  type LoyaltySettings,
} from "@/lib/mock/fidelite";
import { Toggle } from "./ui";
import {
  SaveBar,
  SavedNote,
  SettingsGroup,
  SettingsRow,
  UnitInput,
} from "../reglages/kit";

// Réglages › Programme de fidélité › règles d'accumulation. Brouillon local,
// appliqué par la barre d'enregistrement.

// Chaîne de saisie → entier positif (vide et valeurs invalides retombent sur 0).
const toPositiveInt = (raw: string) => {
  const n = Math.floor(Number(raw.replace(/\D/g, "")));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function AccrualSettings({
  settings,
  onSave,
}: {
  settings: LoyaltySettings;
  onSave: (next: LoyaltySettings) => void;
}) {
  const [draft, setDraft] = useState<LoyaltySettings>(settings);
  const [justSaved, setJustSaved] = useState(false);

  const set = <K extends keyof LoyaltySettings>(key: K, value: LoyaltySettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setJustSaved(false);
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const off = !draft.enabled;

  const accrualHint =
    draft.basis === "visit"
      ? `Chaque visite terminée crédite ${fmtPoints(draft.pointsPerVisit)} à la cliente.`
      : `1 point crédité par tranche de ${fcfa(draft.fcfaPerPoint)} dépensés.`;

  return (
    <div>
      <SettingsGroup title="Règles d'accumulation">
        <SettingsRow
          label="Programme activé"
          help={
            off ? (
              <span className="font-medium text-warning-700">
                Aucun point n&apos;est attribué tant que le programme est coupé.
              </span>
            ) : (
              "Les clientes cumulent des points à chaque visite encaissée."
            )
          }
        >
          <Toggle checked={draft.enabled} onChange={(v) => set("enabled", v)} aria-label="Programme activé" />
        </SettingsRow>

        <SettingsRow label="Base d'accumulation" wide muted={off}>
          <Select value={draft.basis} onChange={(v) => set("basis", v as LoyaltySettings["basis"])} options={ACCRUAL_BASIS_OPTIONS} />
        </SettingsRow>

        {draft.basis === "visit" ? (
          <SettingsRow label="Points par visite" htmlFor="acc-visit" help={accrualHint} wide muted={off}>
            <UnitInput
              id="acc-visit"
              unit="points"
              value={String(draft.pointsPerVisit)}
              onChange={(v) => set("pointsPerVisit", toPositiveInt(v))}
            />
          </SettingsRow>
        ) : (
          <SettingsRow label="Montant pour 1 point" htmlFor="acc-amount" help={accrualHint} wide muted={off}>
            <UnitInput
              id="acc-amount"
              unit="FCFA"
              value={String(draft.fcfaPerPoint)}
              onChange={(v) => set("fcfaPerPoint", toPositiveInt(v))}
            />
          </SettingsRow>
        )}

        <SettingsRow label="Arrondi" help="Quand le calcul tombe entre deux points." wide muted={off}>
          <Select value={draft.rounding} onChange={(v) => set("rounding", v as LoyaltySettings["rounding"])} options={ROUNDING_OPTIONS} />
        </SettingsRow>

        <SettingsRow
          label="Clientes sans compte"
          help="Attribuer des points même sans compte, avec le numéro de téléphone."
          muted={off}
        >
          <Toggle
            checked={draft.guestsEligible}
            onChange={(v) => set("guestsEligible", v)}
            aria-label="Clientes sans compte éligibles"
          />
        </SettingsRow>

        <SettingsRow label="Expiration des points" help="Les points non utilisés finissent par expirer." muted={off}>
          <Toggle
            checked={draft.pointsExpire}
            onChange={(v) => set("pointsExpire", v)}
            aria-label="Expiration des points"
          />
        </SettingsRow>

        <SettingsRow
          label="Solde minimum pour échanger"
          htmlFor="acc-min"
          help="En dessous, aucune récompense ne peut être échangée."
          wide
          muted={off}
        >
          <UnitInput
            id="acc-min"
            unit="points"
            value={String(draft.minRedeemBalance)}
            onChange={(v) => set("minRedeemBalance", toPositiveInt(v))}
          />
        </SettingsRow>
      </SettingsGroup>

      <SavedNote show={justSaved && !dirty} />
      <SaveBar
        dirty={dirty}
        onSave={() => {
          onSave(draft);
          setJustSaved(true);
        }}
        onReset={() => setDraft(settings)}
      />
    </div>
  );
}
