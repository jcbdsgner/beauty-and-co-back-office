import React from "react";

type Props = {
  title: string;
  // Contenu aligné à droite du titre : filtre salon, action primaire...
  // (ex. Dashboard : filtre salon + « Nouveau rendez-vous »).
  actions?: React.ReactNode;
};

// Bandeau de titre commun à tous les écrans — depuis le 2026-09-27, le
// `BoardHeader` de point-de-vente (components/ui/board.tsx) : un titre simple
// en gras posé sur le fond crème, sans carte ni remplissage, actions alignées
// à droite. Pas de sous-titre explicatif : le titre seul suffit.
export default function PageHeader({ title, actions }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 pl-1">
      <h1 className="flex-[1_0_auto] whitespace-nowrap font-[family-name:var(--font-heading)] text-[30px] leading-[30px] font-medium tracking-[-0.02em] text-gray-900">
        {title}
      </h1>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
