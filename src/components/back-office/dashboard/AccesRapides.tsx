"use client";

import Link from "next/link";
import { FileBarChart2, History, Package, Star } from "lucide-react";

// Widget « Accès Rapides » du tableau de bord — ajouté le 2026-09-21 sur le
// node Figma 286:363 (voir CLAUDE.md « Refonte dashboard sur Figma »). Reprend
// et absorbe les raccourcis de l'ancienne section « Autres écrans » (Rapports,
// Satisfaction, Journal), rejointe ici par Stock, en grille 2×2 — le mockup
// n'a pas de place pour la note de satisfaction ni les descriptions qui
// accompagnaient ces cartes auparavant, volontairement laissées de côté.

const SHORTCUTS: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  lines: string[];
}[] = [
  { href: "/rapports", icon: FileBarChart2, lines: ["Rapports", "d'activité"] },
  { href: "/satisfaction", icon: Star, lines: ["Avis clients"] },
  { href: "/stock", icon: Package, lines: ["Gestion des", "stocks"] },
  { href: "/journal", icon: History, lines: ["Journal", "d'équipe"] },
];

export default function AccesRapides() {
  return (
    <div className="rounded-xl border border-[#efe9e8] bg-white p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-semibold text-[#2d2626]">Accès Rapides</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col gap-2 rounded-lg border border-[#efe9e8] bg-[#f9f8f8] p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#efe9e8] bg-white text-brand-600">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-semibold leading-4 text-[#2d2626] group-hover:text-brand-700">
                {s.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
