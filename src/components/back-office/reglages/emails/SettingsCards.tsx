"use client";

import { useState } from "react";
import { CheckLineIcon } from "@/icons";
import {
  DELAY_UNIT_OPTIONS,
  type EmailAutomation,
  type ReminderRule,
} from "@/lib/mock/emails";
import { SectionCard, Toggle, MiniSelect, fieldClass, btnPrimary } from "./ui";

const LinkGlyph = (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <path
      d="M9 15l6-6M10.5 6.5l1-1a4 4 0 0 1 5.7 5.7l-1.8 1.8M13.5 17.5l-1 1a4 4 0 0 1-5.7-5.7l1.8-1.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const BellGlyph = (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <path
      d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2.2A.5.5 0 0 1 19.1 19H4.9a.5.5 0 0 1-.4-.8L6 16Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M10 21.2a2.4 2.4 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/* ------------------------------------------------------------ lien du site */

function SiteLinkCard({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const dirty = draft.trim() !== value.trim();

  return (
    <SectionCard
      title="Lien du site (boutons des emails)"
      description="Adresse ouverte par le bouton « site web » au bas de tous les emails envoyés aux clientes."
      icon={LinkGlyph}
    >
      <form
        className="flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) onSave(draft.trim());
        }}
      >
        <div className="flex-1">
          <label htmlFor="site-link" className="mb-1.5 block text-sm font-medium text-gray-800">
            Lien du site
          </label>
          <input
            id="site-link"
            type="text"
            inputMode="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://…"
            className={fieldClass}
          />
        </div>
        <button type="submit" disabled={!dirty} className={btnPrimary}>
          <CheckLineIcon className="size-4" />
          Enregistrer
        </button>
      </form>
    </SectionCard>
  );
}

/* --------------------------------------------------- rappels & remerciement */

function RuleRow({
  label,
  rule,
  onChange,
  suffix,
}: {
  label: string;
  rule: ReminderRule;
  onChange: (r: ReminderRule) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <Toggle
        checked={rule.enabled}
        onChange={(enabled) => onChange({ ...rule, enabled })}
        aria-label={label}
      />
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
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
        className="h-10 w-16 rounded-lg border border-gray-300 bg-white px-3 text-center text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      />
      <MiniSelect
        value={rule.unit}
        onChange={(unit) => onChange({ ...rule, unit })}
        options={DELAY_UNIT_OPTIONS}
        disabled={!rule.enabled}
        aria-label={`${label} — unité`}
      />
      <span className="w-14 text-sm text-gray-500">{suffix}</span>
    </div>
  );
}

const GroupLabel = ({ children }: { children: string }) => (
  <p className="mb-1 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
    {children}
  </p>
);

function RemindersCard({
  automation,
  onSave,
}: {
  automation: EmailAutomation;
  onSave: (a: EmailAutomation) => void;
}) {
  const [draft, setDraft] = useState(automation);
  const dirty = JSON.stringify(draft) !== JSON.stringify(automation);

  return (
    <SectionCard
      title="Rappels & email de remerciement"
      description="Réglez quand les rappels partent avant le rendez-vous et quand l'email « merci pour votre visite » part après. Un rappel ne part jamais juste après une réservation de dernière minute."
      icon={BellGlyph}
    >
      <div className="divide-y divide-gray-100">
        <div className="pb-2">
          <GroupLabel>Rappels (avant le RDV)</GroupLabel>
          <RuleRow
            label="Rappel 1"
            rule={draft.reminder1}
            onChange={(reminder1) => setDraft({ ...draft, reminder1 })}
            suffix="avant"
          />
          <RuleRow
            label="Rappel 2"
            rule={draft.reminder2}
            onChange={(reminder2) => setDraft({ ...draft, reminder2 })}
            suffix="avant"
          />
        </div>
        <div className="pt-3">
          <GroupLabel>Merci pour votre visite (après le RDV)</GroupLabel>
          <RuleRow
            label="Email de remerciement"
            rule={draft.thankYou}
            onChange={(thankYou) => setDraft({ ...draft, thankYou })}
            suffix="après"
          />
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          disabled={!dirty}
          onClick={() => onSave(draft)}
          className={btnPrimary}
        >
          <CheckLineIcon className="size-4" />
          Enregistrer
        </button>
      </div>
    </SectionCard>
  );
}

/* --------------------------------------------------------------------- export */

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
  return (
    <>
      <SiteLinkCard value={siteLink} onSave={onSaveSiteLink} />
      <RemindersCard automation={automation} onSave={onSaveAutomation} />
    </>
  );
}
