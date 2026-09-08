import type { Metadata } from "next";
import { Suspense } from "react";
import Equipe from "@/components/back-office/Equipe";

export const metadata: Metadata = {
  title: "Équipe",
  description:
    "Équipe Beauty & Co — rôles, accès à la plateforme, compétences et horaires habituels de chaque collaboratrice. Démo front-end, données fictives.",
};

export default function EquipePage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de ?membre=<id>
  // à l'arrivée depuis une notification).
  return (
    <Suspense fallback={null}>
      <Equipe />
    </Suspense>
  );
}
