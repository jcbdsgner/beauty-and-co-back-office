import React from "react";

type Props = {
  title: string;
  // Contenu aligné à droite du titre : filtre salon, action primaire...
  // (ex. Dashboard : filtre salon + « Nouveau RDV »).
  actions?: React.ReactNode;
};

// Bandeau de titre commun à tous les écrans — carte bordée reprise du Figma
// « Tableau de bord » (2026-09-21, ex-`dashboard/DashboardHeader`), étendue à
// l'ensemble des écrans pour qu'un seul vocabulaire visuel de titre traverse
// l'app. Pas de sous-titre explicatif : le titre seul suffit.
export default function PageHeader({ title, actions }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#efe9e8] bg-white/95 px-6 py-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <h1 className="text-title-sm font-bold text-[#2d2626]">{title}</h1>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
