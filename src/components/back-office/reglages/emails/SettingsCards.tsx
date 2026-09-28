"use client";

import { useState } from "react";
import { DELAY_UNIT_OPTIONS, delayUnitLabel, type EmailAutomation, type ReminderRule } from "@/lib/mock/emails";
import { Toggle, MiniSelect, fieldClass } from "./ui";
import { SaveBar, SavedNote, SettingsGroup, SettingsRow } from "../kit";

// Réglages › Emails › envois automatiques : lien du site + délais des rappels
// et du remerciement, dans un seul brouillon et une seule barre
// d'enregistrement (avant : deux cartes, deux boutons « Enregistrer »).

type Draft = { siteLink: string; automation: EmailAutomation };

// « Part 1 jour avant le rendez-vous. »
const ruleHelp = (rule: ReminderRule, when: "avant" | "après") => {
  if (!rule.enabled) return "Coupé : cet email ne part pas.";
  const unit = delayUnitLabel(rule.unit).replace(/s$/, rule.value > 1 ? "s" : "");
  return `Part ${rule.value} ${unit} ${when} le rendez-vous.`;
};

function RuleControl({
  label,
  rule,
  onChange,
}: {
  label: string;
  rule: ReminderRule;
  onChange: (r: ReminderRule) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="text"
        inputMode="numeric"
        aria-label={`${label} — délai`}
        value={String(rule.value)}
        disabled={!rule.enabled}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange({ ...rule, value: Number.isNaN(n) ? 0 : Math.min(n, 99) });
        }}
        className="input input-sm w-16 bg-base-100 text-center text-sm tabular-nums disabled:bg-base-200 disabled:text-base-content/40"
      />
      <MiniSelect
        value={rule.unit}
        onChange={(unit) => onChange({ ...rule, unit })}
        options={DELAY_UNIT_OPTIONS}
        disabled={!rule.enabled}
        aria-label={`${label} — unité`}
      />
      <span className="ml-3">
        <Toggle checked={rule.enabled} onChange={(enabled) => onChange({ ...rule, enabled })} aria-label={label} />
      </span>
    </div>
  );
}

export default function SettingsCards({
  siteLink,
  onSaveSiteLink,
  automation,
  onSaveAutomation,
}: {
  siteLink: string;
  onSaveSiteLink: (v: string) => void;
  automation: EmailAutomation;
  onSaveAutomation: (a: EmailAutomation) => void;
}) {
  const saved: Draft = { siteLink, automation };
  const [draft, setDraft] = useState<Draft>(saved);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = JSON.stringify({ ...draft, siteLink: draft.siteLink.trim() }) !== JSON.stringify(saved);
  const linkInvalid = draft.siteLink.trim() !== "" && !/^https?:\/\/\S+\.\S+/.test(draft.siteLink.trim());

  const setRule = (key: keyof EmailAutomation, rule: ReminderRule) => {
    setDraft((d) => ({ ...d, automation: { ...d.automation, [key]: rule } }));
    setJustSaved(false);
  };

  return (
    <div>
      <SettingsGroup
        title="Envois automatiques"
        description="Un rappel ne part jamais juste après une réservation de dernière minute."
      >
        <SettingsRow
          label="Lien du site"
          htmlFor="site-link"
          help={
            linkInvalid ? (
              <span className="text-error-600">Adresse incomplète : elle doit commencer par https://</span>
            ) : (
              "Ouvert par le bouton « site web » au bas de chaque email."
            )
          }
          wide
        >
          <input
            id="site-link"
            type="text"
            inputMode="url"
            value={draft.siteLink}
            onChange={(e) => {
              setDraft((d) => ({ ...d, siteLink: e.target.value }));
              setJustSaved(false);
            }}
            placeholder="https://…"
            aria-invalid={linkInvalid || undefined}
            className={`${fieldClass} ${linkInvalid ? "border-error-500" : ""}`}
          />
        </SettingsRow>
        <SettingsRow label="Premier rappel" help={ruleHelp(draft.automation.reminder1, "avant")} wide>
          <RuleControl label="Premier rappel" rule={draft.automation.reminder1} onChange={(r) => setRule("reminder1", r)} />
        </SettingsRow>
        <SettingsRow label="Second rappel" help={ruleHelp(draft.automation.reminder2, "avant")} wide>
          <RuleControl label="Second rappel" rule={draft.automation.reminder2} onChange={(r) => setRule("reminder2", r)} />
        </SettingsRow>
        <SettingsRow label="Merci pour votre visite" help={ruleHelp(draft.automation.thankYou, "après")} wide>
          <RuleControl
            label="Email de remerciement"
            rule={draft.automation.thankYou}
            onChange={(r) => setRule("thankYou", r)}
          />
        </SettingsRow>
      </SettingsGroup>

      <SavedNote show={justSaved && !dirty} />
      <SaveBar
        dirty={dirty}
        blocked={linkInvalid ? "Corrigez le lien du site avant d'enregistrer." : null}
        onReset={() => setDraft(saved)}
        onSave={() => {
          onSaveSiteLink(draft.siteLink.trim());
          onSaveAutomation(draft.automation);
          setJustSaved(true);
        }}
      />
    </div>
  );
}
