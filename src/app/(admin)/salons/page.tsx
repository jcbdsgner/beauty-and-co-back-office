import type { Metadata } from "next";
import Salons from "@/components/back-office/Salons";

export const metadata: Metadata = {
  title: "Salons",
  description:
    "Configuration des salons Beauty & Co — coordonnées, postes de travail, heures d'ouverture et fermetures exceptionnelles. Démo front-end, données fictives.",
};

export default function SalonsPage() {
  return <Salons />;
}
