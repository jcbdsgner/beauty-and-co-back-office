import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RendezVousDetail from "@/components/back-office/RendezVousDetail";
import { rendezvousDetail } from "@/lib/mock/rendezvous";

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
