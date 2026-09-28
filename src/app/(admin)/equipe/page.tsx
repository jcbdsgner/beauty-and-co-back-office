import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Equipe from "@/components/back-office/Equipe";

export const metadata: Metadata = {
  title: "Équipe",
  description:
    "Équipe Beauty & Co — rôles, accès à la plateforme, compétences et horaires habituels de chaque collaboratrice. Démo front-end, données fictives.",
};

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  // Compatibilité : `?vue=planning` (anciens liens — Journal, notifications)
  // ouvrait l'onglet Planning ; il a désormais sa propre route.
  if ((await searchParams).vue === "planning") redirect("/equipe/planning");

  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de ?membre=<id>
  // à l'arrivée depuis une notification).
  return (
    <Suspense fallback={null}>
      <Equipe tab="membres" />
    </Suspense>
  );
}
