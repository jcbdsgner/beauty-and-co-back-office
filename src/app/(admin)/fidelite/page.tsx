import type { Metadata } from "next";
import Fidelite from "@/components/back-office/Fidelite";

export const metadata: Metadata = {
  title: "Fidélité & abonnements",
  description:
    "Suivi des abonnements souscrits et des packs vendus Beauty & Co : échéances, révocations, consommation. Démo front-end, données fictives.",
};

export default function FidelitePage() {
  return <Fidelite />;
}
