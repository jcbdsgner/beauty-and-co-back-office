"use client";

import { useState } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import PeriodFilter from "@/components/back-office/PeriodFilter";
import ReportBuilderPanel from "@/components/back-office/ReportBuilderPanel";
import ReportTable from "@/components/back-office/ReportTable";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import {
  buildReport,
  salons,
  today,
  type PeriodId,
  type ReportGroupId,
  type ReportMetricId,
  type SalonScope,
} from "@/lib/mock/beautyandco";

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

// Rapport pré-composé à l'ouverture : l'écran n'est jamais vide.
const DEFAULT_METRICS: ReportMetricId[] = ["revenue", "deposits", "visits"];

export default function Rapports() {
  const { scope, setScope } = useLocation();
  const [period, setPeriod] = useState<PeriodId>("month");
  const [group, setGroup] = useState<ReportGroupId>("salon");
  const [metrics, setMetrics] = useState<Set<ReportMetricId>>(
    () => new Set(DEFAULT_METRICS),
  );

  const toggleMetric = (id: ReportMetricId) =>
    setMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const report = buildReport({ scope, period, group, metrics: [...metrics] });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        actions={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Salon
              </span>
              <SegmentedControl
                options={SALON_OPTIONS}
                value={scope}
                onChange={setScope}
                aria-label="Filtrer par salon"
                variant="tinted"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Période
              </span>
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-6">
        <ReportBuilderPanel
          className="print:hidden"
          group={group}
          onGroupChange={setGroup}
          selected={metrics}
          onToggleMetric={toggleMetric}
          report={report}
        />

        <div className="space-y-4">
          <div>
            <p className="hidden text-theme-xs text-gray-500 print:block">
              Beauty &amp; Co — édité le {today.label}
            </p>
            <h2 className="text-lg font-semibold text-gray-800">{report.title}</h2>
          </div>
          <ReportTable report={report} />
        </div>
      </div>
    </div>
  );
}
