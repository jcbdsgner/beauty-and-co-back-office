"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import PageHeader from "@/components/back-office/PageHeader";
import PeriodFilter from "@/components/back-office/PeriodFilter";
import StatCards from "@/components/back-office/StatCards";
import TodayAppointments from "@/components/back-office/TodayAppointments";
import TrendChart from "@/components/back-office/TrendChart";
import PopularServices from "@/components/back-office/PopularServices";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import {
  dashboardKpis,
  periods,
  salons,
  stockAlert,
  today,
  type PeriodId,
  type SalonScope,
} from "@/lib/mock/beautyandco";
import { forfaitSeeds } from "@/lib/mock/forfaits";
import {
  abonnementSeeds,
  recurringRevenueKpi,
} from "@/lib/mock/abonnements";

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

const zoneTitle = (period: PeriodId) =>
  period === "custom"
    ? "Période personnalisée"
    : (periods.find((p) => p.id === period)?.label ?? "Aujourd'hui");

export default function Dashboard() {
  const { scope, setScope } = useLocation();
  const [period, setPeriod] = useState<PeriodId>("today");

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Tableau de bord" description={today.label} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Salon
            </span>
            <SegmentedControl
              options={SALON_OPTIONS}
              value={scope}
              onChange={setScope}
              aria-label="Filtrer par salon"
            />
          </div>
          {/* Période — aligné à droite de la rangée de contrôles */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Période
            </span>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </div>
      </div>

      {/* À traiter — alertes, en tête car elles appellent une action */}
      {stockAlert.count > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">À traiter</h2>
          <Alert
            variant="warning"
            title={stockAlert.title}
            message={stockAlert.message}
            showLink
            linkHref={stockAlert.href}
            linkText="Voir l'inventaire"
          />
        </section>
      )}

      {/* Indicateurs de la période sélectionnée */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">{zoneTitle(period)}</h2>
        <StatCards
          items={[
            ...dashboardKpis(scope, period),
            recurringRevenueKpi(abonnementSeeds, forfaitSeeds),
          ]}
        />
      </section>

      {/* Tendances de la période */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChart scope={scope} period={period} />
        </div>
        <div>
          <PopularServices scope={scope} />
        </div>
      </div>

      {/* Rendez-vous — toujours la journée en cours */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Rendez-vous du jour</h2>
          <span className="text-theme-sm text-gray-500">Toujours la journée en cours</span>
        </div>
        <TodayAppointments scope={scope} />
      </section>
    </div>
  );
}
