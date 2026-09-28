import { cn } from "@/lib/utils";

// Vignette d'une catégorie (ou de tout élément catalogue illustré) : l'image
// importée — chemin `public/` ou dataURL de session — sinon une pastille à
// l'initiale, jamais un pictogramme choisi dans une liste.
export default function CategoryThumb({
  image,
  name,
  size = 36,
  className,
}: {
  image: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (image) {
    return (
      <span
        className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-field bg-accent p-1.5", className)}
        style={style}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dataURL de session ou SVG local */}
        <img src={image} alt="" className="size-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-field bg-accent font-semibold text-secondary",
        className,
      )}
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
