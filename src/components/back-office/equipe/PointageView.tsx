"use client";

import React, { useMemo, useState } from "react";
import { Select } from "@/components/ui/atoms/select";
import { useLocation } from "@/context/LocationContext";
import { members } from "@/lib/mock/staff";
import JournalPeriodPicker, {
  DEFAULT_JOURNAL_PERIOD,
  presetRange,
  type JournalPeriod,
} from "../journal/JournalPeriodPicker";
import PointageLog, { anomalyParts, pointageRows, tallyPointages } from "./PointageLog";

// Équipe › Pointage (2026-10-02, auparavant une vue du Journal) : heures
// d'arrivée et de départ badgées de toute l'équipe ou d'une personne, sur une
// période. Filtres : personne, « seulement les écarts », salon (filtre global),
// période (le salon se règle dans le bandeau d'Équipe) ; bilan de la période en une ligne à droite de la période.

// Toute l'équipe active, praticiennes d'abord (ordre de `staff.ts`).
const PERSON_OPTIONS = [
  { value: "all", label: "Toute l'équipe" },
  ...members
    .filter((m) => m.active)
    .map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}`.trim() })),
];

export default function PointageView() {
  const { scope } = useLocation();
  const [person, setPerson] = useState("all");
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [period, setPeriod] = useState<JournalPeriod>(DEFAULT_JOURNAL_PERIOD);
  const range = { from: period.from, to: period.to };
  const memberId = person === "all" ? null : person;

  const tally = useMemo(
    () =>
      tallyPointages(
        pointageRows({ from: period.from, to: period.to }, scope, memberId, onlyAnomalies),
      ),
    [period, scope, memberId, onlyAnomalies],
  );
  // Une absence est prévue, pas un écart : elle reste en ton neutre.
  const anomalies = anomalyParts({ ...tally, absent: 0 });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <Select
          value={person}
          onChange={setPerson}
          options={PERSON_OPTIONS}
          size="compact"
          aria-label="Voir le pointage de"
          className="w-60"
        />
        <label className="ml-2 flex cursor-pointer items-center gap-2.5 text-[15px] text-base-content/80">
          <input
            type="checkbox"
            checked={onlyAnomalies}
            onChange={(e) => setOnlyAnomalies(e.target.checked)}
            className="checkbox checkbox-primary checkbox-sm"
          />
          Seulement les écarts
        </label>
      </div>

      <div className="mt-6 mb-6 flex items-center justify-between gap-6">
        <div className="shrink-0">
          <JournalPeriodPicker value={period} onChange={setPeriod} />
        </div>
        {/* Bilan de la période : la vue d'une personne a le sien sous forme de
            chiffres (PointageSummaryBar) ; ici, une ligne. */}
        <p className="min-w-0 text-right text-sm text-base-content/60">
          <span className="whitespace-nowrap">
            {tally.rows} journée{tally.rows > 1 ? "s" : ""}
            {onlyAnomalies && tally.rows > 0 && " avec un écart"}
          </span>
          {!onlyAnomalies && !memberId && tally.rows > 0 && (
            <>
              {tally.absent > 0 && " "}
              {tally.absent > 0 && (
                <span className="whitespace-nowrap">
                  · {tally.absent} absence{tally.absent > 1 ? "s" : ""}
                </span>
              )}
              {anomalies.length > 0
                ? anomalies.map((part) => (
                    <React.Fragment key={part}>
                      {" "}
                      <span className="whitespace-nowrap text-warning-700">· {part}</span>
                    </React.Fragment>
                  ))
                : " · aucun écart"}
            </>
          )}
        </p>
      </div>

      <PointageLog
        range={range}
        scope={scope}
        memberId={memberId}
        onlyAnomalies={onlyAnomalies}
        onShowAll={() => setOnlyAnomalies(false)}
        onWiden={() => setPeriod(presetRange("30j"))}
      />
    </div>
  );
}
