import type { Metadata } from "next";
import Satisfaction from "@/components/back-office/Satisfaction";

export const metadata: Metadata = {
  title: "Satisfaction client",
  description:
    "Avis Beauty & Co collectés après visite — note moyenne, répartition, note par collaboratrice et derniers commentaires. Démo front-end, données fictives.",
};

export default function SatisfactionPage() {
  return <Satisfaction />;
}
