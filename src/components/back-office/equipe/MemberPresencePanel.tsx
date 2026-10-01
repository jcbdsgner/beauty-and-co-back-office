"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { salonName } from "@/lib/mock/beautyandco";
import { ABSENCE_LABELS, TODAY_ISO } from "@/lib/mock/planning";
import {
  POINTAGE_PERIOD_OPTIONS,
  groupByWeek,
  hasAnomaly,
  hoursLabel,
  inRange,
  periodRange,
  pointagesFor,
  presenceMinutes,
  summarize,
  type PointageDay,
  type PointagePeriod,
} from "@/lib/mock/pointage";
import type { Member } from "@/lib/mock/staff";
import {
  ArrivalValue,
  DepartureValue,
  PointageSummaryBar,
} from "@/components/back-office/shared/PointageCells";

// Onglet « Présence » de la fiche membre — le registre des heures d'arrivée et
// de départ badgées à la caisse, en regard de l'horaire prévu.
//
// 1. La propriétaire vient vérifier : « est-elle à l'heure ? combien d'heures
//    a-t-elle faites ? » — souvent avant un entretien ou la paie. Lecture, pas
//    de saisie (le badgeage se fait au salon).
// 2. Ce qui saute aux yeux : le bilan de la période (temps de présence, retards),
//    puis dans le registre, les seuls écarts — tout ce qui est à l'heure reste
//    discret.
// 3. Cas dégradés : départ non badgé (compté à part, jamais inventé), journée
//    en cours, absence, aucune journée sur la période, aucun écart.

const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return { weekday: WEEKDAYS[d.getDay()], date: `${d.getDate()} ${MONTHS[d.getMonth()]}` };
};
const weekLabel = (mondayIso: string) => {
  const d = new Date(`${mondayIso}T00:00:00`);
  return `Semaine du ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export default function MemberPresencePanel({ member }: { member: Member }) {
  const [period, setPeriod] = useState<PointagePeriod>("semaine");
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);

  const all = useMemo(() => pointagesFor(member.id), [member.id]);
  const days = inRange(all, periodRange(period));
  const summary = summarize(days);
  const shown = onlyAnomalies ? days.filter(hasAnomaly) : days;
  const weeks = groupByWeek(shown);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          aria-label="Période"
          options={POINTAGE_PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
        />
        <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-base-content/80">
          <input
            type="checkbox"
            checked={onlyAnomalies}
            onChange={(e) => setOnlyAnomalies(e.target.checked)}
            className="checkbox checkbox-primary checkbox-sm"
          />
          Afficher seulement les écarts
        </label>
      </div>

      {/* Bilan de la période */}
      <PointageSummaryBar summary={summary} />

      {/* Registre */}
      <section className="overflow-hidden rounded-box border border-base-300 bg-white">
        {shown.length === 0 ? (
          <p className="px-6 py-10 text-center text-[15px] text-base-content/60">
            {days.length === 0
              ? `Aucune journée prévue pour ${member.firstName} sur cette période.`
              : "Aucun écart sur cette période : arrivées et départs à l'heure."}
          </p>
        ) : (
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-base-300 text-left text-sm text-base-content/60">
                <th className="py-3 pl-6 pr-3 font-medium">Jour</th>
                <th className="px-3 py-3 font-medium">Salon</th>
                <th className="px-3 py-3 font-medium">Prévu</th>
                <th className="px-3 py-3 font-medium">Arrivée</th>
                <th className="px-3 py-3 font-medium">Départ</th>
                <th className="py-3 pl-3 pr-6 text-right font-medium">Présence</th>
              </tr>
            </thead>
            {weeks.map((w) => {
              const ws = summarize(w.days);
              return (
                <tbody key={w.monday}>
                  <tr className="bg-base-200">
                    <th
                      colSpan={5}
                      scope="rowgroup"
                      className="py-2 pl-6 pr-3 text-left text-sm font-semibold text-base-content/80"
                    >
                      {weekLabel(w.monday)}
                    </th>
                    <td className="py-2 pl-3 pr-6 text-right text-sm tabular-nums text-base-content/60">
                      {!onlyAnomalies && ws.presenceMin > 0 && hoursLabel(ws.presenceMin)}
                    </td>
                  </tr>
                  {w.days.map((d) => (
                    <Row key={d.date} day={d} />
                  ))}
                </tbody>
              );
            })}
          </table>
        )}
      </section>

      <p className="text-sm text-base-content/60">
        Heures badgées sur le poste de caisse du salon. Un retard est compté au-delà de 5 minutes
        après l&apos;heure prévue.
      </p>
    </div>
  );
}

function Row({ day }: { day: PointageDay }) {
  const { weekday, date } = dayLabel(day.date);
  const isToday = day.date === TODAY_ISO;

  const dayCell = (
    <td className="py-3 pl-6 pr-3 whitespace-nowrap">
      <span className="inline-block w-10 text-base-content/60">{weekday}</span>
      <span className="font-medium text-base-content">{date}</span>
      {isToday && <span className="ml-2 text-sm text-secondary">Aujourd&apos;hui</span>}
    </td>
  );

  if (day.kind === "absent") {
    return (
      <tr className="border-t border-base-300">
        {dayCell}
        <td colSpan={5} className="py-3 pl-3 pr-6 text-base-content/60">
          {ABSENCE_LABELS[day.type]}
          {day.reason && ` · ${day.reason}`}
        </td>
      </tr>
    );
  }

  const presence = presenceMinutes(day);

  return (
    <tr className="border-t border-base-300">
      {dayCell}
      <td className="px-3 py-3 text-base-content/70">{salonName(day.salonId)}</td>
      <td className="px-3 py-3 tabular-nums text-base-content/60">
        {day.plannedStart} – {day.plannedEnd}
      </td>
      <td className="px-3 py-3 tabular-nums">
        <ArrivalValue day={day} />
      </td>
      <td className="px-3 py-3 tabular-nums">
        <DepartureValue day={day} />
      </td>
      <td className="py-3 pl-3 pr-6 text-right tabular-nums text-base-content/80">
        {presence === null ? "—" : hoursLabel(presence)}
        {day.ongoing && <span className="ml-1 text-sm text-base-content/60">en cours</span>}
      </td>
    </tr>
  );
}
