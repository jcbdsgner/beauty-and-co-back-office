import type { Metadata } from "next";
import { Suspense } from "react";
import RendezVous from "@/components/back-office/RendezVous";

export const metadata: Metadata = {
  title: "Rendez-vous",
  description:
    "Rendez-vous Beauty & Co — liste et agenda, par salon : praticiennes affectées automatiquement, déplacer, annuler. Démo front-end, données fictives.",
};

export default function RendezVousPage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de
  // ?nouveau=1 à l'arrivée depuis le bouton « Nouveau RDV » du tableau de bord).
  return (
    <Suspense fallback={null}>
      <RendezVous />
    </Suspense>
  );
}
