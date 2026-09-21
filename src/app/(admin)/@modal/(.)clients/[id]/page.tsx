import { notFound } from "next/navigation";
import ClientDetailModal from "@/components/back-office/ClientDetailModal";
import { clientDetail } from "@/lib/mock/beautyandco";

// Route interceptée : tout clic depuis l'intérieur de l'admin vers
// /clients/[id] atterrit ici (au lieu de la page dédiée) et s'affiche en
// modal par-dessus l'écran d'origine, qui reste monté derrière. Fermer
// revient donc littéralement en arrière (router.back()).

export default async function InterceptedClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = clientDetail(id);
  if (!detail) notFound();

  return <ClientDetailModal detail={detail} closeMode="back" />;
}
