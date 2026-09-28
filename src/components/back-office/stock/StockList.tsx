"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BoxIcon } from "@/icons";
import { groupThousands } from "@/lib/mock/beautyandco";
import { coverageTone, type StockRow } from "@/lib/mock/stock";
import { PRODUCT_BRANDS, type ProductBrand } from "@/lib/mock/services";

type FilterId = "all" | "below" | "order";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "below", label: "Sous le seuil" },
  { id: "order", label: "À commander" },
];

// Statut = combien de jours le stock peut tenir au rythme des sorties
// récentes. Une pastille de couleur + une phrase, pas un code à décoder.
const TONE_DOT = {
  error: "bg-error-500",
  warning: "bg-warning-500",
  ok: "bg-success-500",
  none: "bg-base-content/25",
} as const;

const TONE_TEXT = {
  error: "text-error-700",
  warning: "text-warning-700",
  ok: "text-base-content/70",
  none: "text-base-content/60",
} as const;

function coverageStatus(row: StockRow): { tone: keyof typeof TONE_DOT; label: string } {
  if (row.onHand === null) return { tone: "none", label: "Jamais inventorié" };
  if (row.onHand === 0) return { tone: "error", label: "En rupture" };
  // Aucune sortie récente : impossible d'estimer une durée, mais un produit
  // passé sous le seuil reste à signaler.
  if (row.coverage === null)
    return row.status === "order"
      ? { tone: "warning", label: "Sous le seuil" }
      : { tone: "none", label: "Aucune sortie récente" };
  const tone = coverageTone(row.coverage);
  const days = row.coverage;
  const label = days <= 1 ? "Moins de 2 jours de stock" : `${days} jours de stock`;
  return { tone: tone === "none" ? "none" : tone, label };
}

// Grille de cartes produit : la photo, le nom, la quantité, le statut (combien
// de jours ça peut tenir) — rien d'autre (2026-09-28, demande de la
// propriétaire). Seuils, consommation, réserve et historique restent dans la
// fiche produit, au clic.
export default function StockList({
  rows,
  photos,
  onOpen,
}: {
  rows: StockRow[];
  photos: Record<string, string>;
  onOpen: (productId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  // Marque (catégorie produit de point-de-vente) — « all » = toutes.
  const [brand, setBrand] = useState<ProductBrand | "all">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.product.name.toLowerCase().includes(q)) return false;
      if (brand !== "all" && r.product.brand !== brand) return false;
      if (filter === "below") return r.onHand !== null && r.onHand < r.min;
      if (filter === "order") return r.status === "order";
      return true;
    });
  }, [rows, query, filter, brand]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtrer les produits"
          className="inline-flex items-center gap-1 rounded-xl bg-muted p-1"
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-base-content"
                    : "text-base-content/60 hover:text-base-content"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value as ProductBrand | "all")}
          aria-label="Filtrer par marque"
          className="select select-sm w-auto bg-base-100 text-sm"
        >
          <option value="all">Toutes les marques</option>
          {PRODUCT_BRANDS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} · {rows.filter((r) => r.product.brand === b.id).length}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit"
          aria-label="Rechercher un produit"
          className="h-10 w-64 rounded-field border border-base-300 bg-white px-3.5 text-sm text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
        />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-box border border-base-300 bg-white p-10 text-center">
          <p className="text-sm text-base-content/60">Aucun produit ne correspond à ce filtre.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-4 xl:grid-cols-5 min-[1600px]:grid-cols-6">
          {visible.map((r) => {
            const photo = photos[r.product.id] ?? r.product.image;
            const status = coverageStatus(r);
            return (
              <li key={r.product.id}>
                <button
                  type="button"
                  onClick={() => onOpen(r.product.id)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 text-left transition-colors hover:border-base-content/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdcfca]"
                >
                  <div className="relative aspect-square bg-base-200">
                    {photo ? (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="240px"
                        unoptimized
                        className="object-contain p-4 mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-base-content/25">
                        <BoxIcon className="size-10" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <p className="line-clamp-2 min-h-[2lh] text-[15px] leading-snug font-medium text-base-content">
                      {r.product.name}
                    </p>
                    <div className="mt-auto">
                      <p className="text-[26px] leading-none font-semibold tabular-nums text-base-content">
                        {r.onHand === null ? "—" : groupThousands(r.onHand)}
                        <span className="ml-1.5 text-sm font-normal text-base-content/60">en stock</span>
                      </p>
                      <p className={`mt-2.5 flex items-center gap-2 text-sm whitespace-nowrap ${TONE_TEXT[status.tone]}`}>
                        <span aria-hidden className={`size-2 shrink-0 rounded-full ${TONE_DOT[status.tone]}`} />
                        {status.label}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
