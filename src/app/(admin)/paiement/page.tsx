import type { Metadata } from "next";
import Paiement from "@/components/back-office/Paiement";

export const metadata: Metadata = {
  title: "Paiement",
  description:
    "Paramètres de paiement Beauty & Co — encaissement en ligne des réservations, acompte demandé à la réservation et règlement PayPal. Démo front-end, données fictives.",
};

export default function PaiementPage() {
  return <Paiement />;
}
