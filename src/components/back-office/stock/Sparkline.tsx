"use client";

// Mini-courbe des niveaux de stock (8 points, ancien → récent). Décorative :
// la valeur chiffrée et le badge de couverture portent l'information.

export default function Sparkline({
  points,
  tone = "neutral",
}: {
  points: number[];
  tone?: "neutral" | "warning" | "error";
}) {
  const w = 96;
  const h = 28;
  const pad = 2;

  if (points.length < 2 || points.every((n) => n === points[0])) {
    const y = h / 2;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e5e7eb" strokeWidth="1.5" />
      </svg>
    );
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points.map((n, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (n - min) / span);
    return [x, y] as const;
  });

  const stroke =
    tone === "error" ? "#dc2626" : tone === "warning" ? "#b45309" : "#886666";
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const [lx, ly] = coords[coords.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2" fill={stroke} />
    </svg>
  );
}
