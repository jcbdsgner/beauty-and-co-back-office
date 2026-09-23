import ClientDetailRoute from "@/components/back-office/ClientDetailRoute";

// Route interceptée : tout clic depuis l'intérieur de l'admin vers
// /clients/[id] atterrit ici (au lieu de la page dédiée) et s'affiche en
// modal par-dessus l'écran d'origine, qui reste monté derrière. Fermer
// revient donc littéralement en arrière (router.back()).
// Résolution de la fiche (seed OU cliente créée en session) déléguée à
// `ClientDetailRoute` — voir `clients/[id]/page.tsx` pour le détail.

export default async function InterceptedClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailRoute id={id} closeMode="back" />;
}
