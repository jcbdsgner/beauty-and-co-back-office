"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState } from "react";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import {
  fcfa,
  groupThousands,
  trendChart,
  type PeriodId,
  type SalonScope,
  type TrendMetric,
} from "@/lib/mock/beautyandco";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const METRIC_OPTIONS: SegmentedOption<TrendMetric>[] = [
  { value: "revenue", label: "Revenus" },
  { value: "appointments", label: "Rendez-vous" },
];

const countLabel = (val: number) => `${groupThousands(val)} rendez-vous`;

export default function TrendChart({
  scope,
  period,
}: {
  scope: SalonScope;
  period: PeriodId;
}) {
  const [metric, setMetric] = useState<TrendMetric>("revenue");
  const isRevenue = metric === "revenue";
  const chart = trendChart(scope, period, metric);

  const options: ApexOptions = {
    colors: ["#886666", "#dcb0aa"],
    chart: {
      fontFamily: "Poppins, sans-serif",
      type: "area",
      height: 260,
      stacked: chart.stacked,
      toolbar: { show: false },
    },
    legend: { show: chart.series.length > 1, position: "top", horizontalAlign: "left", fontSize: "15px" },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: chart.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "14px", colors: ["#6B7280"] },
        formatter: (val: number) =>
          isRevenue ? groupThousands(val) : `${Math.round(val)}`,
      },
    },
    tooltip: {
      x: { show: true },
      y: { formatter: isRevenue ? (val: number) => fcfa(val) : countLabel },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {isRevenue ? "Aperçu des revenus" : "Aperçu des rendez-vous"}
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500">{chart.subtitle}</p>
        </div>

        <SegmentedControl
          options={METRIC_OPTIONS}
          value={metric}
          onChange={setMetric}
          size="sm"
          aria-label="Indicateur affiché"
        />
      </div>

      <div className="mt-2">
        <ReactApexChart options={options} series={chart.series} type="area" height={260} />
      </div>
    </div>
  );
}
