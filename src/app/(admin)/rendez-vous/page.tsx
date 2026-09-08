import type { Metadata } from "next";
import RendezVous from "@/components/back-office/RendezVous";

export const metadata: Metadata = {
  title: "Rendez-vous",
  description:
    "Rendez-vous Beauty & Co — liste et agenda, par salon : affecter une praticienne, déplacer, annuler. Démo front-end, données fictives.",
};

export default function RendezVousPage() {
  return <RendezVous />;
}
