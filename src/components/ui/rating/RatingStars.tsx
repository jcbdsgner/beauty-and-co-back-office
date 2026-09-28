import React from "react";

type Props = {
  value: number; // note sur 5, décimales autorisées (moyennes)
  size?: "sm" | "md" | "lg";
  showValue?: boolean; // affiche « 4,6 / 5 » à côté des étoiles
  className?: string;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const STAR =
  "M10 1.6l2.47 5.005 5.525.803-3.998 3.897.944 5.502L10 14.612l-4.941 2.597.944-5.502-3.998-3.897 5.525-.803z";

// Étoiles de notation — représentation unique de la note dans tout le back-office.
// Le remplissage partiel (moyennes) est rendu par une couche dorée découpée en largeur.
export default function RatingStars({
  value,
  size = "md",
  showValue = false,
  className = "",
}: Props) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const cls = SIZE[size];

  const row = (fill: string) => (
    <div className="flex" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`${cls} ${fill}`} fill="currentColor">
          <path d={STAR} />
        </svg>
      ))}
    </div>
  );

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="relative inline-block"
        role="img"
        aria-label={`${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5`}
      >
        {row("text-gray-200")}
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          {row("text-warning-400")}
        </span>
      </span>
      {showValue && (
        <span className="text-sm font-medium text-base-content/80">
          {value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5
        </span>
      )}
    </span>
  );
}
