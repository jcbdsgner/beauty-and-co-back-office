import type { Metadata } from "next";
import Services from "@/components/back-office/Services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Catalogue Beauty & Co — catégories, prestations facturables, questions de réservation, boissons du bar et recettes de consommation dans un seul parcours. Démo front-end, données fictives.",
};

export default function ServicesPage() {
  return <Services section="prestations" />;
}
