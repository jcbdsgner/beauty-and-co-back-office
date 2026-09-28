import Link from "next/link";
import { cn } from "@/lib/utils";

export type PageTab = { href: string; label: string; active: boolean };

// Barre d'onglets de page (2026-09-27) — navigation entre les sous-écrans d'un
// même module (Équipe : Membres / Planning, Services : Prestations / Boissons).
// Même habillage souligné que `ui/molecules/tabs` (texte + trait `primary` sous
// l'onglet actif, sur un filet), mais chaque onglet est un vrai lien vers sa
// propre route : le bouton retour marche et on peut partager l'adresse.
// Volontairement distinct des pastilles (`SegmentedControl` /
// `SegmentedToggle`), réservées aux filtres (salon) et aux bascules de vue
// (Liste / Agenda, Jour / Semaine) — deux rôles, deux formes.
export default function PageTabs({ tabs, label }: { tabs: PageTab[]; label: string }) {
  return (
    <nav aria-label={label} className="-mt-2 mb-6 flex items-center gap-6 border-b border-base-300">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "relative flex min-h-11 shrink-0 items-center px-1 pb-3 text-[15px] font-semibold whitespace-nowrap transition",
            "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors",
            t.active
              ? "text-base-content after:bg-primary"
              : "text-base-content/55 after:bg-transparent hover:text-base-content",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
