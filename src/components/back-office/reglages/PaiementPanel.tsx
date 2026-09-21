"use client";

import { useState, type ReactNode } from "react";
import Alert from "@/components/ui/alert/Alert";
import { CheckCircleIcon, ChevronDownIcon } from "@/icons";
import {
  DEPOSIT_MIN_FCFA,
  DEPOSIT_MODE_OPTIONS,
  defaultPaymentSettings,
  depositSummary,
  type PaymentSettings,
} from "@/lib/mock/paiement";

/* --------------------------------------------------------------- primitives */

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        {description && <p className="mt-0.5 text-theme-xs text-gray-500">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-xs transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  hint,
  disabled,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} max-w-[160px]`}
        />
        {suffix && (
          <span className={`text-sm ${disabled ? "text-gray-300" : "text-gray-500"}`}>{suffix}</span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-theme-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const Divider = () => <div className="-mx-6 border-t border-gray-100" />;

/* --------------------------------------------------------------------- saisie */

// Chaîne de saisie → entier positif (vide / invalide → 0).
const toPositiveInt = (raw: string) => {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/* ---------------------------------------------------------------------- écran */

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
  const belowMin =
    draft.depositMode === "fixed" && draft.depositFixed > 0 && draft.depositFixed < DEPOSIT_MIN_FCFA;
  const noDeposit = draft.depositMode === "none";

  const save = () => {
    if (belowMin) return;
    setSettings(draft);
    setJustSaved(true);
  };

  return (
    <div className="max-w-3xl rounded-2xl border border-gray-200 bg-white">
      {/* Encaissement en ligne -------------------------------------------- */}
      <div className="space-y-5 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Encaissement en ligne</h2>

        <SettingRow
          title="Encaissement réel"
          description="Activé : les paiements des clientes sont réellement encaissés. Désactivé : mode test, aucun montant n'est débité."
          control={
            <Toggle
              checked={draft.liveMode}
              onChange={(v) => set("liveMode", v)}
              aria-label="Encaissement réel"
            />
          }
        />

        {draft.liveMode ? (
          <Alert
            variant="info"
            title="Encaissement réel actif"
            message="Chaque réservation débite réellement la cliente et crédite le compte du salon."
          />
        ) : (
          <Alert
            variant="warning"
            title="Mode test actif"
            message="Les réservations n'entraînent aucun débit. Réactivez l'encaissement réel pour percevoir les paiements."
          />
        )}
      </div>

      <Divider />

      {/* Acompte à la réservation ---------------------------------------- */}
      <div className="space-y-5 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Acompte à la réservation</h2>

        <div className="max-w-[280px]">
          <label
            htmlFor="deposit-mode"
            className="mb-1.5 block text-sm font-medium text-gray-800"
          >
            Acompte demandé
          </label>
          <div className="relative">
            <select
              id="deposit-mode"
              value={draft.depositMode}
              onChange={(e) =>
                set("depositMode", e.target.value as PaymentSettings["depositMode"])
              }
              className={`${fieldClass} appearance-none pr-10`}
            >
              {DEPOSIT_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {draft.depositMode === "fixed" && (
          <Field
            id="deposit-fixed"
            label="Montant de l'acompte"
            suffix="FCFA"
            value={String(draft.depositFixed)}
            onChange={(v) => set("depositFixed", toPositiveInt(v))}
            hint={
              belowMin
                ? `Le minimum accepté est de ${DEPOSIT_MIN_FCFA} FCFA.`
                : depositSummary(draft)
            }
          />
        )}

        {draft.depositMode === "percent" && (
          <Field
            id="deposit-percent"
            label="Part du total"
            suffix="%"
            value={String(draft.depositPercent)}
            onChange={(v) => set("depositPercent", Math.min(100, toPositiveInt(v)))}
            hint={depositSummary(draft)}
          />
        )}

        {noDeposit && (
          <p className="text-theme-xs text-gray-500">{depositSummary(draft)}</p>
        )}
      </div>

      <Divider />

      {/* Paiement par PayPal ------------------------------------------- */}
      <div className="space-y-5 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Paiement par PayPal</h2>

        <Field
          id="paypal-usd"
          label="Montant débité en dollars"
          suffix="USD"
          value={String(draft.paypalUsd)}
          onChange={(v) => set("paypalUsd", toPositiveInt(v))}
          disabled={noDeposit}
          hint={
            noDeposit
              ? "Sans acompte, aucun montant n'est débité — y compris par PayPal."
              : "PayPal ne traite pas le franc CFA : les clientes qui règlent par PayPal sont débitées de ce montant en dollars, à la place de l'acompte en FCFA."
          }
        />
      </div>

      {/* Enregistrer -------------------------------------------------------- */}
      <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || belowMin}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          Enregistrer
        </button>
        {justSaved && !dirty && (
          <span className="inline-flex items-center gap-1.5 text-theme-sm font-medium text-success-600">
            <CheckCircleIcon className="size-4" />
            Paramètres enregistrés
          </span>
        )}
      </div>
    </div>
  );
}
