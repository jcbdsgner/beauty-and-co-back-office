"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { revenueBySalon, revenueMonths } from "@/lib/mock/beautyandco";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const millions = (val: number) =>
  `${(val / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M FCFA`;

export default function RevenueChart() {
  const [isOpen, setIsOpen] = useState(false);

  const options: ApexOptions = {
    colors: ["#465fff", "#9cb9ff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 260,
      stacked: true,
      toolbar: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontSize: "13px" },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0 },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: revenueMonths,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "FCFA", style: { fontSize: "11px", color: "#9CA3AF", fontWeight: 400 } },
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
        formatter: (val: number) => `${(val / 1_000_000).toFixed(1)} M`,
      },
    },
    tooltip: {
      x: { show: true },
      y: { formatter: millions },
    },
  };

  const series = revenueBySalon.map((s) => ({ name: s.name, data: s.data }));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Aperçu des revenus</h3>
          <p className="mt-1 text-theme-sm text-gray-500">
            Chiffre d&apos;affaires mensuel par salon — 12 derniers mois
          </p>
        </div>

        <div className="relative inline-block">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="dropdown-toggle"
            aria-label="Options du graphique"
          >
            <MoreDotIcon className="text-gray-400 hover:text-gray-700" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-44 p-2">
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Voir le détail
            </DropdownItem>
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Exporter (CSV)
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="mt-2">
        <ReactApexChart options={options} series={series} type="area" height={260} />
      </div>
    </div>
  );
}
