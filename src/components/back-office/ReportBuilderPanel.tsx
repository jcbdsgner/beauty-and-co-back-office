"use client";

import { useState } from "react";
import Checkbox from "@/components/form/input/Checkbox";
import ReportActions from "@/components/back-office/ReportActions";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { ChevronDownIcon, CheckLineIcon } from "@/icons";
import {
  REPORT_GROUPS,
  REPORT_METRICS,
  type GeneratedReport,
  type ReportGroupId,
  type ReportMetricId,
} from "@/lib/mock/beautyandco";

// « Regrouper par » : menu déroulant (choix unique parmi 5 axes).
function GroupSelect({
  group,
  onGroupChange,
}: {
  group: ReportGroupId;
  onGroupChange: (g: ReportGroupId) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = REPORT_GROUPS.find((g) => g.id === group)!.label;

  return (
    <div className="relative mt-3">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="dropdown-toggle flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-start text-theme-sm font-medium text-gray-800 shadow-theme-xs transition-colors hover:bg-gray-50 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
      >
        {currentLabel}
        <ChevronDownIcon
          className={`size-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className="left-0 top-full w-full p-1"
      >
        <ul role="menu" aria-label="Axe d'analyse du rapport">
          {REPORT_GROUPS.map((g) => {
            const active = g.id === group;
            return (
              <li key={g.id} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onGroupChange(g.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-theme-sm transition-colors ${
                    active
                      ? "bg-brand-50 font-medium text-brand-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {g.label}
                  {active && <CheckLineIcon className="size-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Dropdown>
    </div>
  );
}

// Panneau de composition : l'axe d'analyse + les colonnes du tableau + les actions.
export default function ReportBuilderPanel({
  group,
  onGroupChange,
  selected,
  onToggleMetric,
  report,
  className = "",
}: {
  group: ReportGroupId;
  onGroupChange: (g: ReportGroupId) => void;
  selected: Set<ReportMetricId>;
  onToggleMetric: (id: ReportMetricId) => void;
  report: GeneratedReport;
  className?: string;
}) {
  const currentGroupLabel = REPORT_GROUPS.find((g) => g.id === group)!.label.toLowerCase();

  return (
    <aside
      className={`flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 ${className}`}
    >
      {/* Axe d'analyse */}
      <div>
        <h3 className="text-theme-sm font-semibold text-gray-800">Regrouper par</h3>
        <GroupSelect group={group} onGroupChange={onGroupChange} />
      </div>

      {/* Colonnes */}
      <div>
        <h3 className="text-theme-sm font-semibold text-gray-800">Indicateurs</h3>
        <p className="mt-1 text-theme-xs text-gray-500">
          Chaque indicateur coché devient une colonne du tableau.
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {REPORT_METRICS.map((m) => {
            const available = m.groups.includes(group);
            return (
              <div key={m.id}>
                <Checkbox
                  label={m.label}
                  checked={available && selected.has(m.id)}
                  disabled={!available}
                  onChange={() => onToggleMetric(m.id)}
                />
                {!available && (
                  <p className="ml-8 text-theme-xs text-gray-400">
                    sans objet par {currentGroupLabel}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sortie */}
      <div className="border-t border-gray-100 pt-5">
        <ReportActions report={report} />
      </div>
    </aside>
  );
}
