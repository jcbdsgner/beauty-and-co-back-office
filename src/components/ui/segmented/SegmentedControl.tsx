"use client";

import React from "react";

export type SegmentedOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  size?: "sm" | "md";
  // Autorise le retour à la ligne des options — utile dans un conteneur étroit
  // (ex. panneau latéral) où toutes les options ne tiennent pas sur une ligne.
  wrap?: boolean;
  // "neutral" (défaut) : pastille grise, utilisée dans le corps de page
  // (onglets, sous-sections). "tinted" : pastille teintée de marque, réservée
  // au bandeau de titre (`PageHeader`) — reprend la palette du Figma tableau
  // de bord (bordure/fond `#efe9e8`/`#f9f8f8`, actif `#fdcfcb`).
  variant?: "neutral" | "tinted";
};

// Contrôle segmenté : choix unique parmi quelques options toutes visibles.
// Sémantique radio (on filtre du contenu, ce ne sont pas des onglets).
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  size = "md",
  wrap = false,
  variant = "neutral",
}: Props<T>) {
  const pad = size === "sm" ? "px-2.5 py-1 text-theme-xs" : "px-3 py-1.5 text-theme-sm";
  const tinted = variant === "tinted";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 ${
        tinted ? "border border-[#efe9e8] bg-[#f9f8f8]" : "bg-gray-100"
      } ${wrap ? "flex-wrap" : ""}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-md font-medium transition-colors ${pad} ${
              tinted
                ? active
                  ? "bg-[#fdcfcb] text-[#5a4242]"
                  : "text-[#6a6060] hover:text-[#2d2626]"
                : active
                  ? "bg-white text-gray-900 shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
