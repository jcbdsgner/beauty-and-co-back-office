// Tuile de statistique compacte pour les rangées de résumé des fiches détail
// (repris de l'ancienne fiche cliente, partagé avec la fiche rendez-vous).

export default function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-theme-sm text-gray-500">{label}</p>
      <p className="mt-2 text-title-sm font-bold leading-none text-gray-800">{value}</p>
    </div>
  );
}
