"use client";

import React from "react";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";

export type SegmentedOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  size?: "sm" | "md";
  // Conservé pour compatibilité : le contrôle de point-de-vente est une grille
  // à colonnes égales qui ne passe pas à la ligne — sans usage actuellement.
  wrap?: boolean;
  // "tinted" : réservé au bandeau de titre (`PageHeader`) → taille compacte,
  // comme les contrôles d'en-tête de point-de-vente (`size="sm"`).
  variant?: "neutral" | "tinted";
};

// Enveloppe historique conservée pour ses ~17 consommateurs — le rendu est
// désormais le `SegmentedToggle` de point-de-vente (pastille blanche qui glisse
// sous le segment actif). `inline-grid` : garde la largeur au contenu, comme
// l'ancien contrôle, au lieu d'occuper toute la ligne.
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  size = "md",
  variant = "neutral",
}: Props<T>) {
  return (
    <SegmentedToggle
      aria-label={ariaLabel}
      options={options}
      value={value}
      onChange={(v) => onChange(v as T)}
      size={size === "sm" || variant === "tinted" ? "sm" : "default"}
      className="inline-grid w-fit"
    />
  );
}
