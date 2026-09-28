"use client";

import { useId } from "react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { CloseButton } from "@/components/ui/atoms/icon-button";
import { cn } from "@/lib/utils";

// Chrome commun aux fiches présentées en panneau latéral droit (client,
// rendez-vous, produit, catégorie / prestation) : barre de titre fixe + corps
// défilant. Depuis le 2026-09-27, c'est le `Dialog variant="side"` de
// point-de-vente (Radix — piège de focus, Échap / clic extérieur ferment,
// glissement d'entrée tw-animate). Le contenu métier reste porté par chaque
// fiche — ce composant ne fournit que l'habillage.
//
// `transform-gpu` : garde le panneau comme bloc conteneur des `position: fixed`
// descendants (ex. fenêtre de détail d'un avantage dans la fiche cliente), qui
// ne couvrent ainsi que le panneau et pas l'écran entier.

export default function DetailModal({
  title,
  onClose,
  children,
  widthClassName = "max-w-3xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName?: string;
}) {
  const labelId = useId();
  return (
    <Dialog
      open
      variant="side"
      onClose={onClose}
      labelledBy={labelId}
      overlayClassName="bg-black/30"
      className={cn("relative flex transform-gpu flex-col border-l border-base-300", widthClassName)}
      >
        <div className="relative flex min-h-16 shrink-0 items-center border-b border-base-300 px-6">
          <p id={labelId} className="text-xs font-semibold tracking-wide text-base-content/55 uppercase">
            {title}
          </p>
        <CloseButton onClick={onClose} className="top-1/2 right-3 size-10 -translate-y-1/2" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
    </Dialog>
  );
}
