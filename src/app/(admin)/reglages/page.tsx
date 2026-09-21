import type { Metadata } from "next";
import { Suspense } from "react";
import Reglages from "@/components/back-office/Reglages";

export const metadata: Metadata = {
  title: "Réglages",
  description:
    "Réglages Beauty & Co — paiement (encaissement, acompte, PayPal) et modèles d'email. Démo front-end, données fictives.",
};

export default function ReglagesPage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de
  // ?section=<paiement|emails> à l'arrivée depuis un lien externe).
  return (
    <Suspense fallback={null}>
      <Reglages />
    </Suspense>
  );
}
