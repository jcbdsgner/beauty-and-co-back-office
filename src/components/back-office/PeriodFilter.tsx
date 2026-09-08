"use client";

import { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import { French } from "flatpickr/dist/l10n/fr.js";
import "flatpickr/dist/flatpickr.css";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Button from "@/components/ui/button/Button";
import { periods, type PeriodId } from "@/lib/mock/beautyandco";

type Range = { from: string; to: string };

// yyyy-mm-dd → jj/mm/aaaa
const frDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Options « fixes » du contrôle segmenté : tout sauf la période personnalisée,
// qui a son propre bouton + popover en fin de contrôle.
const FIXED_PERIODS = periods.filter((p) => p.id !== "custom");

const segmentClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-theme-sm font-medium transition-colors ${
    active
      ? "bg-white text-gray-900 shadow-theme-xs"
      : "text-gray-500 hover:text-gray-800"
  }`;

const fieldClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

// Champ date : au clic, flatpickr déroule un calendrier juste en dessous
// (static → dans le flux du popover, pas en overlay flottant).
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const fp = flatpickr(el, {
      locale: French,
      static: true,
      monthSelectorType: "static",
      // Un seul champ, affiché au format FR (jj/mm/aaaa). L'état interne reste en
      // ISO (Y-m-d) via le formatDate ci-dessous. Pas d'altInput : il crée un
      // second <input> qui, dans ce popover remonté, restait visible à côté.
      dateFormat: "d/m/Y",
      allowInput: false,
      defaultDate: value || undefined,
      onChange: (dates, _str, inst) =>
        onChangeRef.current(dates[0] ? inst.formatDate(dates[0], "Y-m-d") : ""),
    });
    const inst = Array.isArray(fp) ? fp[0] : fp;
    return () => inst.destroy();
    // Instanciation unique : le parent remonte le champ (via `key`) pour le vider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <label className="block">
      <span className="mb-1 block text-theme-xs font-medium text-gray-500">{label}</span>
      <input
        ref={inputRef}
        type="text"
        placeholder="jj/mm/aaaa"
        aria-label={label}
        className={fieldClass}
      />
    </label>
  );
}

type Props = {
  value: PeriodId;
  onChange: (value: PeriodId) => void;
};

// Sélecteur de période : options fixes + « Personnalisé » qui ouvre un popover
// (Du / Au → Filtrer). Une fois filtré, le bouton affiche la plage retenue.
export default function PeriodFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState<Range | null>(null);
  const [fieldsKey, setFieldsKey] = useState(0); // bump = remonte les champs date

  const customActive = value === "custom";
  // from/to sont en ISO (Y-m-d) → l'ordre lexical = l'ordre chronologique.
  const rangeInverted = Boolean(from && to && from > to);
  const canApply = Boolean(from) && Boolean(to) && !rangeInverted;

  const reset = () => {
    setApplied(null);
    setFrom("");
    setTo("");
    setFieldsKey((k) => k + 1);
    setOpen(false);
    if (customActive) onChange("today");
  };

  return (
    <div
      role="radiogroup"
      aria-label="Période affichée"
      className="relative inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5"
    >
      {FIXED_PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          onClick={() => onChange(p.id)}
          className={segmentClass(value === p.id)}
        >
          {p.label}
        </button>
      ))}

      <button
        type="button"
        role="radio"
        aria-checked={customActive}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`dropdown-toggle ${segmentClass(customActive)}`}
      >
        {applied ? `${frDate(applied.from)} – ${frDate(applied.to)}` : "Personnalisé"}
      </button>

      <Dropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className="top-full right-0 w-[340px] p-4"
      >
        <p className="mb-3 text-theme-sm font-semibold text-gray-800">
          Période personnalisée
        </p>

        <div
          className="space-y-3 [&_.flatpickr-wrapper]:block [&_.flatpickr-wrapper]:w-full"
          key={fieldsKey}
        >
          <DateField label="Du" value={from} onChange={setFrom} />
          <DateField label="Au" value={to} onChange={setTo} />
        </div>

        {rangeInverted && (
          <p className="mt-2 text-theme-xs font-medium text-error-500">
            La date de fin doit être postérieure à la date de début.
          </p>
        )}

        <Button
          size="sm"
          disabled={!canApply}
          onClick={() => {
            setApplied({ from, to });
            onChange("custom");
            setOpen(false);
          }}
          className="mt-4 w-full"
        >
          Filtrer
        </Button>

        {applied && (
          <button
            type="button"
            onClick={reset}
            className="mt-2 w-full rounded-lg py-2 text-theme-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            Réinitialiser
          </button>
        )}
      </Dropdown>
    </div>
  );
}
