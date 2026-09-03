import type { Metadata } from "next";
import Alert from "@/components/ui/alert/Alert";
import PageHeader from "@/components/back-office/PageHeader";
import StatCards from "@/components/back-office/StatCards";
import TodayAppointments from "@/components/back-office/TodayAppointments";
import DashboardKpiCards from "@/components/back-office/DashboardKpiCards";
import RevenueChart from "@/components/back-office/RevenueChart";
import PopularServices from "@/components/back-office/PopularServices";
import { stockAlert, today, todayKpis } from "@/lib/mock/beautyandco";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description:
    "Vue d'ensemble Beauty & Co — argent et rendez-vous du jour, tendances du mois. Démo front-end, données fictives.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Tableau de bord" description={`Beauty & Co · ${today.label}`} />

      {/* Aujourd'hui — le coup d'œil de la journée */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Aujourd&apos;hui</h2>
        <StatCards items={todayKpis} />
        <TodayAppointments />
      </section>

      {/* Ce mois-ci — KPI pilotés par le sélecteur de période */}
      <DashboardKpiCards />

      {/* Graphiques du mois */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <PopularServices />
        </div>
      </div>

      {/* À traiter */}
      <section className="space-y-4">
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
    </div>
  );
}
