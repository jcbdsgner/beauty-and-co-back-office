"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { groupThousands, type SalonScope } from "@/lib/mock/beautyandco";
import { coverageTone, type StockRow } from "@/lib/mock/stock";
import { PRODUCT_BRANDS, type ProductBrand } from "@/lib/mock/services";
import Sparkline from "./Sparkline";

type FilterId = "all" | "below" | "order";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "below", label: "Sous le seuil" },
  { id: "order", label: "À commander" },
];

function CoverageBadge({ row }: { row: StockRow }) {
  if (row.onHand === null) {
    return (
      <Badge size="sm" color="light">
        Niveau inconnu
      </Badge>
    );
  }
  if (row.coverage === null) {
    return (
      <Badge size="sm" color="light">
        Aucune sortie
      </Badge>
    );
  }
  const tone = coverageTone(row.coverage);
  const color = tone === "error" ? "error" : tone === "warning" ? "warning" : "success";
  return (
    <Badge size="sm" color={color}>
      ≈ {row.coverage} j
    </Badge>
  );
}

// Grille de cartes produit — remplace l'ancien tableau `StockList` (2026-09-22,
// passage listes → blocs demandé par l'utilisatrice, même grammaire que
// `ClientCards`). Le niveau de stock reste le repère n°1 (mis en avant en
// grand), seuil / conso / sparkline en pied de carte.
export default function StockList({
  rows,
  scope,
  onOpen,
}: {
  rows: StockRow[];
  scope: SalonScope;
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

  const stockLabel = scope === "all" ? "Stock entreprise" : "Stock du salon";

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((r) => (
            <button
              key={r.product.id}
              type="button"
              onClick={() => onOpen(r.product.id)}
              className="flex flex-col gap-3 rounded-xl border border-base-300 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-theme-sm"
            >
              <div>
                <p className="line-clamp-2 font-medium text-base-content">{r.product.name}</p>
                <p className="mt-0.5 text-xs text-base-content/45">
                  {PRODUCT_BRANDS.find((b) => b.id === r.product.brand)?.name}
                  {r.product.gamme && ` · ${r.product.gamme}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-base-content/45">{stockLabel}</p>
                <p className="text-theme-xl font-semibold tabular-nums text-base-content">
                  {r.onHand === null ? "—" : groupThousands(r.onHand)}
                </p>
                {scope === "all" && r.reserve !== null && (
                  <p className="text-xs text-base-content/45">
                    dont réserve {groupThousands(r.reserve)}
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60">
                  <p>Seuil {groupThousands(r.min)}</p>
                  <p className="tabular-nums">
                    {r.weekly > 0 ? `${groupThousands(Math.round(r.weekly))} / sem.` : "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <CoverageBadge row={r} />
                  <Sparkline
                    points={r.spark}
                    tone={
                      r.status === "order" ? "error" : r.status === "low" ? "warning" : "neutral"
                    }
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
