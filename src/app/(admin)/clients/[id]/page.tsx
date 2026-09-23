import type { Metadata } from "next";
import ClientDetailRoute from "@/components/back-office/ClientDetailRoute";
import { clientDetail } from "@/lib/mock/beautyandco";

// Fallback pleine page de la fiche cliente : n'est atteint que par navigation
// directe (URL tapée, rechargement, nouvel onglet) — depuis l'intérieur de
// l'admin, le clic ouvre la même fiche en modal (route interceptée, voir
// src/app/(admin)/@modal/(.)clients/[id]/page.tsx). Même contenu, présenté de
// la même façon : referme vers /clients faute d'écran d'origine à retrouver.
// La résolution de la fiche (seed OU cliente créée en session) est déléguée à
// `ClientDetailRoute` (client component, lit `ClientsContext`) — `notFound()`
// ne peut plus être décidé ici puisqu'une cliente créée en session n'existe pas
// dans les seeds que ce composant serveur peut lire.
//
// 1. Où en est l'utilisatrice ? Elle arrive de la liste Clients, souvent juste
//    avant ou pendant un rendez-vous : elle veut se rappeler qui est la cliente
//    (préférences, allergies, boisson), comment la joindre, et son historique.
// 2. Ce qui doit sauter aux yeux : l'identité (nom, avatar, contact) et les
//    préférences, puis le rapport au salon (visites, dépenses).
// 3. Quand ça se passe mal : id inconnu → notFound() ; jamais venue → stats à
//    zéro, « Jamais venue », tableaux vides ; suppression → confirmation puis
//    retour liste (aucune persistance).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = clientDetail(id);
  return { title: detail ? detail.row.name : "Fiche cliente" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailRoute id={id} closeMode="list" />;
}
