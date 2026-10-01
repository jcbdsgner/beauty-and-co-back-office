import { redirect } from "next/navigation";

// Les salons se règlent dans Réglages depuis le 2026-10-01 : l'ancienne
// adresse redirige (liens externes, journal, favoris).
export default function SalonsPage() {
  redirect("/reglages?section=salons");
}
