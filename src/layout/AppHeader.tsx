"use client";
import UserDropdown from "@/components/header/UserDropdown";
import React from "react";

// Barre du haut réduite au menu compte (2026-09-27). Point-de-vente n'a pas de
// barre du haut (compte en pied de rail), mais la propriétaire a demandé de
// garder « Sokhna Ndour » visible en haut à droite (refonte Figma du
// 2026-09-21) — on garde donc cette seule rangée, sans bascule de sidebar (le
// rail est fixe). Fond blanc (demande du 2026-09-27) plutôt que fondu dans le
// crème de la page : un filet bas le détache du contenu qui défile dessous.
const AppHeader: React.FC = () => (
  <header className="sticky top-0 z-40 w-full border-b border-base-300 bg-base-100 print:hidden">
    <div className="mx-auto flex max-w-[1440px] items-center justify-end px-8 py-3">
      <UserDropdown />
    </div>
  </header>
);

export default AppHeader;
