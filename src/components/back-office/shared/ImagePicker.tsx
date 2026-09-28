"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

// Import d'une image unique (FileReader → dataURL de session, aucune
// persistance — même principe que la photo produit de `stock/StockDetail`).
// Aperçu + « Importer » / « Remplacer » / « Retirer ».
export default function ImagePicker({
  value,
  onChange,
  label,
  size = 72,
  fit = "contain",
  compact = false,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label: string;
  size?: number;
  fit?: "contain" | "cover";
  /** Vignette seule (clic = importer / remplacer, « Changer » au survol), sans
   *  les liens ni « Retirer » — pour une liste où l'image est obligatoire. */
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={value ? `Remplacer ${label}` : `Importer ${label}`}
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-box border-2 border-dashed transition hover:border-primary",
          value ? "border-transparent bg-accent" : "border-base-300 bg-base-200 text-base-content/45",
        )}
        style={{ width: size, height: size }}
      >
        {value ? (
          <span className="group/thumb relative size-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- dataURL de session ou SVG local */}
            <img src={value} alt="" className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain p-2")} />
            {compact && (
              <span className="absolute inset-x-0 bottom-0 bg-neutral/75 py-0.5 text-center text-[11px] font-medium text-neutral-content opacity-0 transition-opacity group-hover/thumb:opacity-100">
                Changer
              </span>
            )}
          </span>
        ) : (
          <span className="flex flex-col items-center gap-0.5">
            <ImagePlus aria-hidden className="size-6" />
            {compact && <span className="text-[11px] font-medium">Photo</span>}
          </span>
        )}
      </button>
      <div className={cn("flex flex-col items-start gap-1", compact && "hidden")}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-secondary hover:underline"
        >
          {value ? "Remplacer l'image" : "Importer une image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-base-content/55 hover:text-error"
          >
            Retirer
          </button>
        )}
        <span className="text-xs text-base-content/45">PNG, JPG ou SVG</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
