"use client";

import { notFound } from "next/navigation";
import { useClientsData } from "@/context/ClientsContext";
import ClientDetailModal from "@/components/back-office/ClientDetailModal";

// Wrapper client des deux routes `/clients/[id]` (page dédiée + interception
// `@modal`) : résout la fiche via `useClientsData()` plutôt que directement
// `clientDetail()`, pour que les clientes créées en session (« + Nouvelle
// cliente », voir `ClientsContext`) aient elles aussi une fiche accessible par
// URL — pas seulement les clientes des fixtures. `notFound()` reste appelé
// pour un id vraiment inconnu (ni seed, ni créé cette session).

export default function ClientDetailRoute({
  id,
  closeMode,
}: {
  id: string;
  closeMode: "back" | "list";
}) {
  const { getDetail } = useClientsData();
  const detail = getDetail(id);
  if (!detail) notFound();
  return <ClientDetailModal detail={detail} closeMode={closeMode} />;
}
