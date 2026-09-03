"use client";

import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import Select from "@/components/form/Select";
import { dashboardKpis, periodOptions } from "@/lib/mock/beautyandco";

export default function DashboardKpiCards() {
 const [period, setPeriod] = useState("month");
 const periodLabel = useMemo(
 () => periodOptions.find((o) => o.value === period)?.label ?? "Ce mois",
 [period],
 );

 return (
 <section>
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-baseline gap-2">
 <h2 className="text-lg font-semibold text-gray-800">
 Tableau de bord
 </h2>
 <span className="text-theme-sm text-gray-500">{periodLabel}</span>
 </div>
 <div className="w-40">
 <Select
 options={periodOptions}
 defaultValue="month"
 onChange={setPeriod}
 className="h-10"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
 {dashboardKpis.map((kpi) => {
 const isUp = kpi.trend === "up";
 const isDown = kpi.trend === "down";
 return (
 <div
 key={kpi.key}
 className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
 >
 <span className="text-theme-sm text-gray-500">{kpi.label}</span>
 <h4 className="mt-2 text-title-sm font-bold text-gray-800">
 {kpi.value}
 </h4>
 <span
 className={`mt-2 inline-flex items-center gap-1 text-theme-xs font-medium ${
 isUp
 ? "text-success-600"
 : isDown
 ? "text-error-600"
 : "text-gray-400"
 }`}
 >
 {isUp && <ArrowUpIcon />}
 {isDown && <ArrowDownIcon />}
 {kpi.change}
 </span>
 </div>
 );
 })}
 </div>
 </section>
 );
}
