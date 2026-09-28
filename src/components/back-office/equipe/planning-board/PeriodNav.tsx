"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { DatePicker } from "@/components/ui/molecules/date-picker";
import { dateOf, isoOf } from "./data";
import { mondayOf } from "@/lib/mock/planning";

/**
 * Barre de navigation du Planning — copie de point-de-vente (`components/planning/period-nav.tsx`) :
 * le libellé de période est lui-même un bouton qui ouvre un mini calendrier (`DatePicker`),
 * « Aujourd'hui » revient à la date du jour, bascule Jour / Semaine à droite. En vue Semaine,
 * le jour choisi amène sa semaine. Adaptation : dates en ISO, « aujourd'hui » = la date du
 * monde de démonstration (`TODAY_ISO`), pas l'horloge.
 */

export type PlanningPeriod = "jour" | "semaine";

function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function label(period: PlanningPeriod, iso: string) {
  const date = dateOf(iso);
  if (period === "jour") {
    const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
  return `${month.charAt(0).toUpperCase() + month.slice(1)} · Semaine ${isoWeek(date)}`;
}

type Props = {
  period: PlanningPeriod;
  onPeriodChange: (p: PlanningPeriod) => void;
  iso: string;
  onDateChange: (iso: string) => void;
  todayIso: string;
};

export function PeriodNav({ period, onPeriodChange, iso, onDateChange, todayIso }: Props) {
  const isCurrent = period === "jour" ? iso === todayIso : mondayOf(iso) === mondayOf(todayIso);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex items-center gap-3">
        <DatePicker
          value={dateOf(iso)}
          onChange={(d) => onDateChange(isoOf(d))}
          trigger={
            <button
              type="button"
              aria-label="Choisir une date"
              className="flex h-12 items-center gap-2.5 rounded-field border border-base-300 bg-base-100 pl-4 pr-3.5 text-base-content transition active:scale-[0.98] hover:bg-base-200 data-[state=open]:border-primary"
            >
              <CalendarDays aria-hidden className="size-4 shrink-0 text-base-content/55" />
              <span className="font-[family-name:var(--font-heading)] text-[15px] font-semibold">{label(period, iso)}</span>
              <ChevronDown aria-hidden className="size-4 shrink-0 text-base-content/45" />
            </button>
          }
        />
        {!isCurrent && (
          <Button variant="outline" size="sm" onClick={() => onDateChange(todayIso)}>
            Aujourd&apos;hui
          </Button>
        )}
      </div>
      <SegmentedToggle
        size="sm"
        value={period}
        onChange={(v) => onPeriodChange(v as PlanningPeriod)}
        aria-label="Période affichée"
        options={[
          { value: "jour", label: "Jour" },
          { value: "semaine", label: "Semaine" },
        ]}
      />
    </div>
  );
}
