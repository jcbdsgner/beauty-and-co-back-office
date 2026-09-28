import type { Metadata } from "next";
import { Suspense } from "react";
import Reglages from "@/components/back-office/Reglages";

export const metadata: Metadata = {
  title: "Réglages",
  description:
    "Réglages Beauty & Co — paiement, emails, préférences clientes, programme de fidélité, forfaits & packs et autorisations par rôle. Démo front-end, données fictives.",
};

export default function ReglagesPage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de
  // ?section=<paiement|emails|preferences|fidelite|offres|autorisations> à l'arrivée depuis un lien externe).
  return (
    <Suspense fallback={null}>
      <Reglages />
    </Suspense>
  );
}
