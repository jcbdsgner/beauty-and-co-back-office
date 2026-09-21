import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";
import { rendezvousDetail } from "@/lib/mock/rendezvous";

// Fallback pleine page de la fiche rendez-vous : n'est atteint que par
// navigation directe (URL tapée, rechargement, nouvel onglet) — depuis
// l'intérieur de l'admin, le clic ouvre la même fiche en modal (route
// interceptée, voir src/app/(admin)/@modal/(.)rendez-vous/[id]/page.tsx).
// Referme vers /rendez-vous faute d'écran d'origine à retrouver.

export const metadata: Metadata = { title: "Fiche rendez-vous" };

export default async function RendezVousDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = rendezvousDetail(id);
  if (!detail) notFound();

  return <RendezVousDetail detail={detail} closeMode="list" />;
}
