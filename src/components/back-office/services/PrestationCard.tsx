"use client";

import Badge from "@/components/ui/badge/Badge";
import { durationLabel, fcfa, isUnbookable, type Prestation } from "@/lib/mock/services";

type Props = {
  prestation: Prestation;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

// Carte-bloc d'une prestation dans le tableau Kanban — remplace la ligne de
// tableau du parcours précédent. Glissable vers une autre lane / catégorie
// (le drop est géré par le conteneur, cf. `ServicesBoard`) ; le clic ouvre la
// fiche panneau latéral.
export default function PrestationCard({ prestation: p, dragging, onOpen, onDragStart, onDragEnd }: Props) {
  const unbookable = isUnbookable(p);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`cursor-grab rounded-lg border bg-white p-3 text-left shadow-theme-xs transition active:cursor-grabbing ${
        dragging
          ? "border-brand-300 opacity-40"
          : "border-gray-200 hover:border-brand-300 hover:shadow-theme-sm"
      }`}
    >
      <p className="line-clamp-2 text-theme-sm font-medium text-gray-800">
        {p.name}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-theme-xs text-gray-500">
        <span className="font-semibold text-gray-700">{fcfa(p.priceFcfa)}</span>
        <span aria-hidden="true">·</span>
        <span>{durationLabel(p.durationMin)}</span>
      </div>
      {(!p.active || unbookable || p.twoPractitioners) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {!p.active && (
            <Badge size="sm" color="light">
              Inactive
            </Badge>
          )}
          {p.active && unbookable && (
            <Badge size="sm" color="warning">
              Non réservable
            </Badge>
          )}
          {p.twoPractitioners && (
            <Badge size="sm" color="light">
              À deux
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
