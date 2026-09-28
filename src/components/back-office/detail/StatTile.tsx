import { StatTile as PdvStatTile } from "@/components/ui/molecules/stat-tile";

// Tuile de statistique compacte pour les rangées de résumé des fiches détail —
// `StatTile` de point-de-vente depuis le 2026-09-27 (libellé en capitales
// espacées, chiffre tabulaire en tête), en version resserrée pour les fiches.
export default function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <PdvStatTile
      label={label}
      value={<span className="text-[1.75rem]">{value}</span>}
      className="p-4"
    />
  );
}
