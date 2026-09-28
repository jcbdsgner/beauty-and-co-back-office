"use client";

import { Users } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { durationLabel, fcfa, isUnbookable, type Prestation } from "@/lib/mock/services";
import { Toggle } from "./ui";

type Props = {
  prestation: Prestation;
  onOpen: () => void;
  onToggleActive: (active: boolean) => void;
};

// Colonnes partagées avec l'en-tête de section (`CategorySection`) pour que
// durées et prix restent alignés d'une sous-catégorie à l'autre.
export const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_96px_128px_52px] items-center gap-4";

// Une prestation = un bloc bordé sur une ligne : nom (+ signaux), durée, prix
// aligné à droite en chiffres tabulaires — les prix se comparent d'un coup
// d'œil vertical —, interrupteur actif. Le clic ouvre la fiche en panneau.
export default function PrestationRow({ prestation: p, onOpen, onToggleActive }: Props) {
  const unbookable = isUnbookable(p);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`${ROW_GRID} cursor-pointer rounded-field border border-base-300 bg-base-100 px-4 py-2.5 transition hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdcfca]`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-[15px] font-medium ${
            p.active ? "text-base-content" : "text-base-content/45"
          }`}
        >
          {p.name}
        </span>
        {!p.active && (
          <Badge size="sm" color="light">
            Inactive
          </Badge>
        )}
        {unbookable && (
          <Badge size="sm" color="warning">
            Non réservable
          </Badge>
        )}
        {/* « À deux » concerne ~3 prestations sur 4 : en pastille, il noierait
            les vrais signaux (Non réservable, Inactive). Pictogramme discret,
            et le filtre « À deux » pour les retrouver. */}
        {p.twoPractitioners && (
          <Users
            aria-label="Réalisable à deux praticiennes"
            className="size-4 shrink-0 text-base-content/35"
          >
            <title>Réalisable à deux praticiennes</title>
          </Users>
        )}
      </div>
      <span className="text-sm text-base-content/60">{durationLabel(p.durationMin)}</span>
      <span
        className={`text-right text-[15px] font-semibold tabular-nums ${
          p.active ? "text-base-content" : "text-base-content/45"
        }`}
      >
        {fcfa(p.priceFcfa)}
      </span>
      {/* Le clic sur l'interrupteur ne doit pas ouvrir la fiche. */}
      <span className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <Toggle
          checked={p.active}
          onChange={onToggleActive}
          aria-label={`${p.name} : ${p.active ? "active" : "inactive"}`}
        />
      </span>
    </div>
  );
}
