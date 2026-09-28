import type { Metadata } from "next";
import { Suspense } from "react";
import Equipe from "@/components/back-office/Equipe";

export const metadata: Metadata = {
  title: "Planning — Équipe",
  description:
    "Planning de l'équipe Beauty & Co — présence de chaque praticienne par jour et par semaine, rendez-vous et absences. Démo front-end, données fictives.",
};

export default function EquipePlanningPage() {
  return (
    <Suspense fallback={null}>
      <Equipe tab="planning" />
    </Suspense>
  );
}
