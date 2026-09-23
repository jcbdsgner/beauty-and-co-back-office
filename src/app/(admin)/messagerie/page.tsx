import type { Metadata } from "next";
import { Suspense } from "react";
import Messagerie from "@/components/back-office/Messagerie";

export const metadata: Metadata = {
  title: "Messagerie",
  description:
    "Appels, SMS, WhatsApp et chat des clientes Beauty & Co, réunis dans une seule boîte de réception. Démo front-end, données fictives.",
};

export default function MessageriePage() {
  // <Suspense> : requis par Next pour `useSearchParams()` (lecture de
  // ?client=<id> à l'arrivée depuis le lien « Voir les échanges » d'une fiche
  // cliente, même motif que ?produit=/?membre= sur Stock/Équipe).
  return (
    <Suspense fallback={null}>
      <Messagerie />
    </Suspense>
  );
}
