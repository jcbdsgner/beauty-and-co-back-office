"use client";

import { useState } from "react";
import Link from "next/link";
import { FileBarChart2, ScrollText, Smile } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import PeriodFilter from "@/components/back-office/PeriodFilter";
import StatCards from "@/components/back-office/StatCards";
import TodayAppointments from "@/components/back-office/TodayAppointments";
import TrendChart from "@/components/back-office/TrendChart";
import PopularServices from "@/components/back-office/PopularServices";
import NotificationsPanel from "@/components/back-office/dashboard/NotificationsPanel";
import RatingStars from "@/components/ui/rating/RatingStars";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import {
  dashboardKpis,
  periods,
  salons,
  satisfaction,
  today,
  type PeriodId,
  type SalonScope,
} from "@/lib/mock/beautyandco";
import { forfaitSeeds } from "@/lib/mock/forfaits";
import {
  abonnementSeeds,
  recurringRevenueKpi,
} from "@/lib/mock/abonnements";

function ShortcutCard({
  href,
  icon,
  title,
  description,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  detail?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)] transition-colors hover:border-brand-100 hover:bg-brand-50/40"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        <span className="text-theme-sm font-semibold text-gray-800 group-hover:text-brand-700">
          {title}
        </span>
      </div>
      {detail}
      <p className="text-theme-xs text-gray-500">{description}</p>
    </Link>
  );
}

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

  // Rendez-vous en tête de liste des indicateurs — priorité confirmée par la
  // propriétaire (2026-09-14) : ce sont les rendez-vous qui doivent sauter
  // aux yeux en premier, pas le chiffre d'affaires.
  const kpis = dashboardKpis(scope, period);
  const orderedKpis = [
    ...kpis.filter((k) => k.key === "rdv"),
    ...kpis.filter((k) => k.key !== "rdv"),
    recurringRevenueKpi(abonnementSeeds, forfaitSeeds),
  ];
  const satisfactionOverview = satisfaction(scope, "90");

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Tableau de bord" description={today.label} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
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

      {/* Rendez-vous du jour + rail « À traiter », en tête d'écran : c'est ce
          qui doit sauter aux yeux en premier (priorité confirmée par la
          propriétaire le 2026-09-14 — avant les indicateurs financiers).
          Toujours la journée en cours, quelle que soit la période choisie
          ci-dessus pour les indicateurs. Le rail reste `xl:sticky`, en
          permanence à l'écran : elle consulte l'un et l'autre plusieurs fois
          par jour, aucun des deux ne doit être caché derrière un clic. Les
          alertes (stock bas, demandes en attente…) vivent uniquement dans ce
          rail, fusionnées avec les notifications : plus de bandeau séparé en
          tête de page qui redirait la même chose. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-800">
                <span className="h-4 w-1 rounded-full bg-brand-500" />
                Rendez-vous du jour
              </h2>
              <span className="text-theme-sm text-gray-500">Toujours la journée en cours</span>
            </div>
            <TodayAppointments scope={scope} />
          </section>
        </div>

        <div className="xl:col-span-1">
          <div className="xl:sticky xl:top-24">
            <NotificationsPanel />
          </div>
        </div>
      </div>

      {/* Indicateurs de la période sélectionnée — session de gestion, un cran
          en dessous de l'opérationnel du jour ci-dessus. */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-800">
          <span className="h-4 w-1 rounded-full bg-gray-300" />
          {zoneTitle(period)}
        </h2>
        <StatCards
          items={orderedKpis}
          columnsClassName="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6"
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

      {/* Raccourcis vers les écrans de consultation occasionnelle — retirés de
          la sidebar le 2026-09-21 (13 → 9 items) : Rapports, Satisfaction et
          Journal ne sont pas des outils de travail quotidien mais des écrans
          qu'on consulte ponctuellement, donc accessibles ici plutôt qu'en tab
          permanent. En bas de l'écran, volontairement : ça ne doit pas rivaliser
          avec les rendez-vous du jour ni les indicateurs de la période. */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-800">
          <span className="h-4 w-1 rounded-full bg-gray-300" />
          Autres écrans
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ShortcutCard
            href="/satisfaction"
            icon={<Smile />}
            title="Satisfaction"
            description="Avis clients, tendance, note par collaboratrice."
            detail={
              satisfactionOverview.avg != null ? (
                <RatingStars value={satisfactionOverview.avg} showValue size="sm" />
              ) : (
                <span className="text-theme-xs text-gray-400">Pas encore d&apos;avis</span>
              )
            }
          />
          <ShortcutCard
            href="/rapports"
            icon={<FileBarChart2 />}
            title="Rapports"
            description="Générer un rapport paramétrable (CA, visites, absences…)."
          />
          <ShortcutCard
            href="/journal"
            icon={<ScrollText />}
            title="Journal d'activité"
            description="Historique des actions de l'équipe (encaissements, RDV, stock…)."
          />
        </div>
      </section>
    </div>
  );
}
