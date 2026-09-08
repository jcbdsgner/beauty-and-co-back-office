import type { Metadata } from "next";
import Planning from "@/components/back-office/Planning";

export const metadata: Metadata = {
  title: "Planning",
  description:
    "Planning Beauty & Co — présence de l'équipe semaine par semaine, trous de couverture et exceptions d'horaire. Démo front-end, données fictives.",
};

export default function PlanningPage() {
  return <Planning />;
}
