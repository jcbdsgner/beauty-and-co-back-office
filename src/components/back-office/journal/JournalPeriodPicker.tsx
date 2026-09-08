"use client";

import { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import { French } from "flatpickr/dist/l10n/fr.js";
import "flatpickr/dist/flatpickr.css";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Button from "@/components/ui/button/Button";
import { JOURNAL_TODAY, addDaysIso, frDay } from "@/lib/mock/journal";

// Sélecteur de période du Journal. Contrairement au `PeriodFilter` du tableau de
// bord (qui ne renvoie qu'un identifiant), celui-ci émet une plage de dates
// concrète `{ from, to }` : le journal filtre réellement sur ces bornes.

export type JournalPreset = "today" | "7j" | "30j" | "custom";

export type JournalPeriod = {
  preset: JournalPreset;
  from: string; // yyyy-mm-dd inclusif
  to: string; // yyyy-mm-dd inclusif
};

// Plage d'un préréglage, calée sur le « aujourd'hui » figé du monde mock.
export function presetRange(preset: Exclude<JournalPreset, "custom">): JournalPeriod {
  if (preset === "today") return { preset, from: JOURNAL_TODAY, to: JOURNAL_TODAY };
  const days = preset === "7j" ? 6 : 29;
  return { preset, from: addDaysIso(JOURNAL_TODAY, -days), to: JOURNAL_TODAY };
}

export const DEFAULT_JOURNAL_PERIOD: JournalPeriod = presetRange("7j");

const FIXED: { id: Exclude<JournalPreset, "custom">; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7j", label: "7 derniers jours" },
  { id: "30j", label: "30 derniers jours" },
];

const segmentClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-theme-sm font-medium transition-colors ${
    active ? "bg-white text-gray-900 shadow-theme-xs" : "text-gray-500 hover:text-gray-800"
  }`;

const fieldClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

// Champ date : au clic, flatpickr déroule un calendrier dans le flux du popover.
// L'état interne reste en ISO (Y-m-d), l'affichage en FR (jj/mm/aaaa).
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
      dateFormat: "d/m/Y",
      allowInput: false,
      defaultDate: value || undefined,
      maxDate: JOURNAL_TODAY,
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
  value: JournalPeriod;
  onChange: (period: JournalPeriod) => void;
};

export default function JournalPeriodPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fieldsKey, setFieldsKey] = useState(0); // bump = remonte les champs date

  const customActive = value.preset === "custom";
  const rangeInverted = Boolean(from && to && from > to);
  const canApply = Boolean(from) && Boolean(to) && !rangeInverted;

  return (
    <div
      role="radiogroup"
      aria-label="Période affichée"
      className="relative inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5"
    >
      {FIXED.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value.preset === p.id}
          onClick={() => onChange(presetRange(p.id))}
          className={segmentClass(value.preset === p.id)}
        >
          {p.label}
        </button>
      ))}

      <button
        type="button"
        aria-pressed={customActive}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setFrom(customActive ? value.from : "");
          setTo(customActive ? value.to : "");
          setFieldsKey((k) => k + 1);
          setOpen((v) => !v);
        }}
        className={`dropdown-toggle ${segmentClass(customActive)}`}
      >
        {customActive ? `${frDay(value.from)} – ${frDay(value.to)}` : "Personnalisé"}
      </button>

      <Dropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className="top-full right-0 w-[340px] p-4"
      >
        <p className="mb-3 text-theme-sm font-semibold text-gray-800">Période personnalisée</p>

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
            onChange({ preset: "custom", from, to });
            setOpen(false);
          }}
          className="mt-4 w-full"
        >
          Filtrer
        </Button>

        {customActive && (
          <button
            type="button"
            onClick={() => {
              onChange(presetRange("7j"));
              setOpen(false);
            }}
            className="mt-2 w-full rounded-lg py-2 text-theme-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            Revenir aux 7 derniers jours
          </button>
        )}
      </Dropdown>
    </div>
  );
}
