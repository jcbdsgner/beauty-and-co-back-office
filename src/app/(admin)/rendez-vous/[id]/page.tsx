import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";
import { rendezvousDetail } from "@/lib/mock/rendezvous";

// Fiche rendez-vous en page (depuis le tableau de bord, une fiche cliente, une
// notification, ou une URL directe). Depuis l'écran Rendez-vous, la même fiche
// s'affiche à la place de la liste, branchée sur l'état de session.

export const metadata: Metadata = { title: "Fiche rendez-vous" };

export default async function RendezVousDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = rendezvousDetail(id);
  if (!detail) notFound();

  return <RendezVousDetail detail={detail} />;
}
