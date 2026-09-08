import type { Metadata } from "next";
import Journal from "@/components/back-office/Journal";

export const metadata: Metadata = {
  title: "Journal d'activité",
  description:
    "Journal d'activité Beauty & Co — toutes les actions de l'équipe (manager, caisse, praticiennes), filtrables par rôle et par période. Démo front-end, données fictives.",
};

export default function JournalPage() {
  return <Journal />;
}
