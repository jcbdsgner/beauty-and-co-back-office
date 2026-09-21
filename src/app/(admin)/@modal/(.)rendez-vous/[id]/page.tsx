import { notFound } from "next/navigation";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";
import { rendezvousDetail } from "@/lib/mock/rendezvous";

// Route interceptée : tout clic depuis l'intérieur de l'admin vers
// /rendez-vous/[id] atterrit ici (au lieu de la page dédiée) et s'affiche en
// modal par-dessus l'écran d'origine, qui reste monté derrière. Fermer
// revient donc littéralement en arrière (router.back()).

export default async function InterceptedRendezVousDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = rendezvousDetail(id);
  if (!detail) notFound();

  return <RendezVousDetail detail={detail} closeMode="back" />;
}
