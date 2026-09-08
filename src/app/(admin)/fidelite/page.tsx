import type { Metadata } from "next";
import Fidelite from "@/components/back-office/Fidelite";

export const metadata: Metadata = {
  title: "Fidélité & abonnements",
  description:
    "Programme de fidélité Beauty & Co (points, paliers, récompenses), catalogue des forfaits d'abonnement et des packs prépayés, et suivi des abonnements souscrits et packs vendus. Démo front-end, données fictives.",
};

export default function FidelitePage() {
  return <Fidelite />;
}
