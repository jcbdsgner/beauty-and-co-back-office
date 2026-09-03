"use client";

import { useMemo, useState } from "react";
import Select from "@/components/form/Select";
import StatCards from "@/components/back-office/StatCards";
import { dashboardKpisByPeriod, periodOptions } from "@/lib/mock/beautyandco";

export default function DashboardKpiCards() {
  const [period, setPeriod] = useState("month");
  const periodLabel = useMemo(
    () => periodOptions.find((o) => o.value === period)?.label ?? "Ce mois",
    [period],
  );
  const kpis = dashboardKpisByPeriod[period] ?? dashboardKpisByPeriod.month;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Ce mois-ci</h2>
          <span className="text-theme-sm text-gray-500">{periodLabel}</span>
        </div>
        <div className="w-40">
          <Select
            options={periodOptions}
            defaultValue="month"
            onChange={setPeriod}
            className="h-10"
            aria-label="Période des indicateurs"
          />
        </div>
      </div>

      <StatCards items={kpis} />
    </section>
  );
}
