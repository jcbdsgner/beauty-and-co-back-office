"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import { CheckCircleIcon } from "@/icons";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  ACCRUAL_BASIS_OPTIONS,
  ROUNDING_OPTIONS,
  points as fmtPoints,
  type LoyaltySettings,
} from "@/lib/mock/fidelite";
import {
  SectionCard,
  SettingRow,
  Toggle,
  SelectField,
  TextInput,
  Divider,
  btnPrimary,
} from "./ui";

// Chaîne de saisie → entier positif (vide et valeurs invalides retombent sur 0).
const toPositiveInt = (raw: string) => {
  const n = Math.floor(Number(raw));
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

  const save = () => {
    onSave(draft);
    setJustSaved(true);
  };

  const accrualHint =
    draft.basis === "visit"
      ? `Chaque visite terminée crédite ${fmtPoints(draft.pointsPerVisit)} à la cliente.`
      : `1 point crédité par tranche de ${fcfa(draft.fcfaPerPoint)} dépensés.`;

  return (
    <div className="space-y-5">
      {!settings.enabled && (
        <Alert
          variant="warning"
          title="Programme désactivé"
          message="Aucun point n'est attribué aux clientes tant que le programme n'est pas réactivé. Le paramétrage ci-dessous reste modifiable."
        />
      )}

      <SectionCard title="Règles d'accumulation">
        <div className="space-y-6">
          <SettingRow
            title="Programme activé"
            description="Aucun point n'est attribué tant que c'est désactivé."
            control={
              <Toggle
                checked={draft.enabled}
                onChange={(v) => set("enabled", v)}
                aria-label="Programme activé"
              />
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Base d'accumulation"
              value={draft.basis}
              onChange={(v) => set("basis", v)}
              options={ACCRUAL_BASIS_OPTIONS}
            />
            <SelectField
              label="Arrondi"
              value={draft.rounding}
              onChange={(v) => set("rounding", v)}
              options={ROUNDING_OPTIONS}
            />
          </div>

          <div className="max-w-[280px]">
            {draft.basis === "visit" ? (
              <TextInput
                label="Points par visite"
                inputMode="numeric"
                value={String(draft.pointsPerVisit)}
                onChange={(v) => set("pointsPerVisit", toPositiveInt(v))}
              />
            ) : (
              <TextInput
                label="Montant pour 1 point (FCFA)"
                inputMode="numeric"
                value={String(draft.fcfaPerPoint)}
                onChange={(v) => set("fcfaPerPoint", toPositiveInt(v))}
              />
            )}
            <p className="mt-1.5 text-theme-xs text-gray-500">{accrualHint}</p>
          </div>

          <SettingRow
            title="Clients invités éligibles"
            description="Attribuer des points même sans compte (suivi par téléphone)."
            control={
              <Toggle
                checked={draft.guestsEligible}
                onChange={(v) => set("guestsEligible", v)}
                aria-label="Clients invités éligibles"
              />
            }
          />

          <Divider />

          <SettingRow
            title="Expiration des points"
            description="Les points non utilisés finissent par expirer."
            control={
              <Toggle
                checked={draft.pointsExpire}
                onChange={(v) => set("pointsExpire", v)}
                aria-label="Expiration des points"
              />
            }
          />

          <div className="max-w-[280px]">
            <TextInput
              label="Solde min. pour échanger"
              inputMode="numeric"
              value={String(draft.minRedeemBalance)}
              onChange={(v) => set("minRedeemBalance", toPositiveInt(v))}
              hint="En dessous de ce solde de points, aucune récompense ne peut être échangée."
            />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button type="button" onClick={save} disabled={!dirty} className={btnPrimary}>
            Enregistrer les paramètres
          </button>
          {justSaved && !dirty && (
            <span className="inline-flex items-center gap-1.5 text-theme-sm font-medium text-success-600">
              <CheckCircleIcon className="size-4" />
              Paramètres enregistrés
            </span>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
