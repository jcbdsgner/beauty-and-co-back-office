"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState } from "react";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { groupThousands } from "@/lib/mock/beautyandco";
import type { LevelHistoryPoint } from "@/lib/mock/stock";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Mode = "total" | "split";

const MODE_OPTIONS: SegmentedOption<Mode>[] = [
  { value: "total", label: "Total" },
  { value: "split", label: "Détaillé" },
];

// Évolution du stock du produit dans le temps (réserve + salons). Bascule
// « Total » (une aire) / « Détaillé » (aires empilées réserve vs salons).
export default function StockLevelChart({ history }: { history: LevelHistoryPoint[] }) {
  const [mode, setMode] = useState<Mode>("total");

  const flat =
    history.length > 0 && history.every((p) => p.total === history[0].total);
  const categories = history.map((p) => p.label);

  const series =
    mode === "total"
      ? [{ name: "Stock total", data: history.map((p) => p.total) }]
      : [
          { name: "Salons", data: history.map((p) => p.salons) },
          { name: "Réserve", data: history.map((p) => p.reserve) },
        ];

  const options: ApexOptions = {
    colors: mode === "total" ? ["#886666"] : ["#886666", "#dcb0aa"],
    chart: {
      fontFamily: "Poppins, sans-serif",
      type: "area",
      height: 220,
      stacked: mode === "split",
      toolbar: { show: false },
    },
    legend: {
      show: mode === "split",
      position: "top",
      horizontalAlign: "left",
      fontSize: "15px",
    },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0 } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 5,
      labels: { rotate: 0, hideOverlappingLabels: true, style: { fontSize: "12px", colors: "#6B7280" } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
        formatter: (val: number) => groupThousands(Math.round(val)),
      },
    },
    tooltip: {
      y: { formatter: (val: number) => `${groupThousands(Math.round(val))} unités` },
    },
  };

  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-white">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 className="text-lg font-semibold text-base-content">Évolution du stock</h2>
          <p className="mt-0.5 text-xs text-base-content/55">
            {flat
              ? "Niveau stable sur la période — pas de mouvement enregistré."
              : "10 dernières semaines · réserve centrale + salons."}
          </p>
        </div>
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
          size="sm"
          aria-label="Détail du graphe"
        />
      </div>
      <div className="px-3 pb-1">
        <ReactApexChart options={options} series={series} type="area" height={220} />
      </div>
    </div>
  );
}
