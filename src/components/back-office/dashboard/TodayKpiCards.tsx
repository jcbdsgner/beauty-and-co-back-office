"use client";

import type { ComponentType } from "react";
import { CalendarCheck2, Smile, UserPlus } from "lucide-react";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import {
  dashboardKpis,
  salonsToday,
  satisfaction,
  type SalonScope,
} from "@/lib/mock/beautyandco";

// « KPIs Opérationnels du Jour » (Figma node 286:197) : 3 cartes, toujours la
// journée en cours — même logique que « Rendez-vous du jour » juste
// au-dessus, indépendante de la période choisie dans `DashboardHeader`.
// Réutilise `dashboardKpis(scope, "today")` (déjà la source des anciennes
// cartes « Indicateurs de la période » quand la période valait « today ») en
// écartant le CA, que ce widget Figma ne montre pas — pas de nouvelle source
// de données, juste un sous-ensemble + une mise en forme dédiée.
const ICON: Record<string, ComponentType<{ className?: string }>> = {
  rdv: CalendarCheck2,
  clients: UserPlus,
  satisfaction: Smile,
};

function caption(key: string, scope: SalonScope): string {
  if (key === "rdv") {
    const perSalon = salonsToday(scope);
    return scope === "all" && perSalon.length > 1
      ? perSalon.map((s) => `${s.count} ${s.name}`).join(" • ")
      : "Rendez-vous du jour";
  }
  if (key === "clients") return "Première visite en salon";
  if (key === "satisfaction") {
    const { count } = satisfaction(scope, "90");
    return count > 0 ? `Sur ${count} avis enregistrés` : "Pas encore d'avis";
  }
  return "";
}

export default function TodayKpiCards({ scope }: { scope: SalonScope }) {
  const items = dashboardKpis(scope, "today").filter((k) => k.key !== "ca");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((kpi) => {
        const Icon = ICON[kpi.key];
        const up = kpi.direction === "up";
        const down = kpi.direction === "down";
        return (
          <div
            key={kpi.key}
            className="flex flex-col justify-between rounded-xl border border-[#efe9e8] bg-white p-5 shadow-[0px_2px_8px_-2px_rgba(90,66,66,0.04),0px_1px_3px_0px_rgba(90,66,66,0.02)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-theme-xs font-medium text-[#6a6060]">{kpi.label}</span>
              {Icon && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#faf4f4] text-brand-600">
                  <Icon className="h-4 w-4" />
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[26px] leading-none font-bold tracking-[-0.02em] text-[#2d2626]">
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-theme-sm font-semibold text-gray-400">{kpi.unit}</span>
              )}
              {typeof kpi.delta === "number" && (
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-semibold whitespace-nowrap ${
                    up ? "text-success-600" : down ? "text-error-600" : "text-gray-500"
                  }`}
                >
                  {up && <ArrowUpIcon />}
                  {down && <ArrowDownIcon />}
                  {Math.abs(kpi.delta)}&nbsp;% vs hier
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-semibold tracking-wide text-[#9a8e8e]">
              {caption(kpi.key, scope)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
