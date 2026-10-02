import type { Metadata } from "next";
import { Suspense } from "react";
import Equipe from "@/components/back-office/Equipe";

export const metadata: Metadata = {
  title: "Pointage — Équipe",
  description:
    "Pointage de l'équipe Beauty & Co — heures d'arrivée et de départ badgées, retards, départs anticipés et absences. Démo front-end, données fictives.",
};

export default function EquipePointagePage() {
  return (
    <Suspense fallback={null}>
      <Equipe tab="pointage" />
    </Suspense>
  );
}
