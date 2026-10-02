"use client";

import Link from "next/link";
import { ChevronRight, FileBarChart2, Star } from "lucide-react";

// « Autres écrans » : les écrans de consultation occasionnelle retirés de la
// sidebar (Rapports, Avis clients). Stock (2026-09-28) et Journal (2026-10-02)
// sont revenus dans la sidebar. Liste de liens sobre en
// bas de page plutôt que de grandes tuiles au même poids que les décisions :
// c'est de la navigation, pas du contenu du jour.
const SHORTCUTS = [
  { href: "/rapports", icon: FileBarChart2, label: "Rapports d'activité", hint: "Composer un rapport par salon, praticienne ou période" },
  { href: "/satisfaction", icon: Star, label: "Avis clients", hint: "Note moyenne et derniers commentaires" },
];

export default function AccesRapides() {
  return (
    <nav
      aria-labelledby="shortcuts-title"
      className="rounded-box border border-base-300 bg-base-100 pt-5 pb-2"
    >
      <h2 id="shortcuts-title" className="px-6 text-[20px] font-semibold text-base-content">
        Autres écrans
      </h2>
      <ul className="mt-2">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group flex items-center gap-3.5 px-6 py-3 transition-colors hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none"
              >
                <Icon className="size-[18px] shrink-0 text-brand-600" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-base-content">{s.label}</span>
                  <span className="block truncate text-sm text-base-content/60">{s.hint}</span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-base-content/30 transition-colors group-hover:text-base-content/60"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
