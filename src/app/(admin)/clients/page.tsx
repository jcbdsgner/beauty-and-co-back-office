import type { Metadata } from "next";
import Clients from "@/components/back-office/Clients";

export const metadata: Metadata = {
  title: "Clients",
  description:
    "Clientèle Beauty & Co — recherche, tri par colonne, historique de visites, dépenses et points de fidélité. Démo front-end, données fictives.",
};

export default function ClientsPage() {
  return <Clients />;
}
