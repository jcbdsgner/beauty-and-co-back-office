import type { Metadata } from "next";
import { Suspense } from "react";
import Stock from "@/components/back-office/Stock";

export const metadata: Metadata = {
  title: "Stock",
  description:
    "Suivi du stock Beauty & Co — niveaux par salon, consommation (ventes et prestations) et projection des ruptures. Démo front-end, données fictives.",
};

export default function StockPage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de ?produit=<id>
  // à l'arrivée depuis une notification de stock bas).
  return (
    <Suspense fallback={null}>
      <Stock />
    </Suspense>
  );
}
