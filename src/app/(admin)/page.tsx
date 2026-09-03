import type { Metadata } from "next";
import Alert from "@/components/ui/alert/Alert";
import DashboardKpiCards from "@/components/back-office/DashboardKpiCards";
import RevenueChart from "@/components/back-office/RevenueChart";
import PopularServices from "@/components/back-office/PopularServices";
import { salonsToday, stockAlert } from "@/lib/mock/beautyandco";

export const metadata: Metadata = {
 title: "Dashboard",
 description:
 "Vue d'ensemble BeautyAndCo — rendez-vous du jour, revenus et prestations. Démo front-end, données fictives.",
};

export default function DashboardPage() {
 return (
 <div className="space-y-6">
 {/* RDV du jour par salon */}
 <section>
 <h1 className="text-2xl font-semibold text-gray-800">
 RDV du jour par salon
 </h1>
 <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
 {salonsToday.map((salon) => (
 <div
 key={salon.id}
 className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
 >
 <div className="flex items-start justify-between">
 <div>
 <h3 className="text-base font-semibold text-gray-800">
 {salon.name}
 </h3>
 <p className="text-theme-sm text-gray-500">{salon.subtitle}</p>
 </div>
 <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-brand-50 px-2 text-theme-sm font-semibold text-brand-500">
 {salon.count}
 </span>
 </div>

 {salon.appointments.length === 0 ? (
 <p className="mt-4 text-theme-sm text-gray-500">
 Aucun rendez-vous
 </p>
 ) : (
 <ul className="mt-4 divide-y divide-gray-100">
 {salon.appointments.map((appt) => (
 <li
 key={`${appt.time}-${appt.client}`}
 className="flex items-center justify-between gap-3 py-2 text-theme-sm"
 >
 <span className="text-gray-700">
 <span className="font-medium text-gray-800">
 {appt.time}
 </span>{" "}
 · {appt.client}
 </span>
 <span className="shrink-0 text-gray-500">
 {appt.service}
 </span>
 </li>
 ))}
 </ul>
 )}
 </div>
 ))}
 </div>
 </section>

 {/* Alerte stock */}
 <Alert variant="warning" title={stockAlert.title} message={stockAlert.message} />

 {/* Tableau de bord — filtre période + KPI */}
 <DashboardKpiCards />

 {/* Graphiques */}
 <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
 <div className="xl:col-span-2">
 <RevenueChart />
 </div>
 <div>
 <PopularServices />
 </div>
 </div>
 </div>
 );
}
