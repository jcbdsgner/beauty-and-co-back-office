import type { Metadata } from "next";
import Rapports from "@/components/back-office/Rapports";

export const metadata: Metadata = {
  title: "Rapports",
  description:
    "Analyse d'une période close Beauty & Co — chiffre d'affaires, encaissements et ventilation par salon, prestation et collaborateur. Démo front-end, données fictives.",
};

export default function RapportsPage() {
  return <Rapports />;
}
