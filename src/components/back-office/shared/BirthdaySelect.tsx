"use client";

import { Select } from "@/components/ui/atoms/select";
import { MONTH_NAMES, toBirthday } from "@/lib/mock/beautyandco";

// Anniversaire d'une cliente — jour + mois, jamais l'année. Repris tel quel de
// point-de-vente (`components/shared/birthday-select.tsx`) : deux listes côte à
// côte ; changer de mois ramène un jour qui n'existe pas (31 → avril) au
// dernier jour du mois.

export type BirthdayParts = { day: string; month: string };

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name[0].toUpperCase() + name.slice(1) }));

export function birthdayParts(birthday?: string): BirthdayParts {
  const [m, d] = (birthday ?? "").split("-");
  return { day: d ? String(Number(d)) : "", month: m ? String(Number(m)) : "" };
}

/** Les deux parties choisies → « MM-JJ », sinon null. */
export function birthdayFromParts(parts: BirthdayParts): string | null {
  return parts.day && parts.month ? toBirthday(Number(parts.day), Number(parts.month)) : null;
}

export function BirthdaySelect({ value, onChange }: { value: BirthdayParts; onChange: (next: BirthdayParts) => void }) {
  const max = value.month ? DAYS_IN_MONTH[Number(value.month) - 1] : 31;
  const dayOptions = Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
      <Select value={value.day} onChange={(day) => onChange({ ...value, day })} options={dayOptions} placeholder="Jour" />
      <Select
        value={value.month}
        onChange={(month) => {
          const last = DAYS_IN_MONTH[Number(month) - 1];
          onChange({ month, day: value.day && Number(value.day) > last ? String(last) : value.day });
        }}
        options={MONTH_OPTIONS}
        placeholder="Mois"
      />
    </div>
  );
}
