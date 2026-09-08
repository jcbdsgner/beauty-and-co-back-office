import type { Metadata } from "next";
import Dashboard from "@/components/back-office/Dashboard";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description:
    "Vue d'ensemble Beauty & Co — argent et rendez-vous du jour, tendances par salon et par période. Démo front-end, données fictives.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
