"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { groupThousands, type SalonScope } from "@/lib/mock/beautyandco";
import { coverageTone, type StockRow } from "@/lib/mock/stock";
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.product.name.toLowerCase().includes(q)) return false;
      if (filter === "below") return r.onHand !== null && r.onHand < r.min;
      if (filter === "order") return r.status === "order";
      return true;
    });
  }, [rows, query, filter]);

  const stockLabel = scope === "all" ? "Stock entreprise" : "Stock du salon";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtrer les produits"
          className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1"
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
                className={`rounded-lg px-3.5 py-1.5 text-theme-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-gray-900 shadow-theme-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit"
          aria-label="Rechercher un produit"
          className="h-10 w-64 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100">
              <TableRow>
                {["Produit", stockLabel, "Seuil", "Conso / sem.", "Couverture", "Tendance"].map(
                  (h, i) => (
                    <TableCell
                      key={h}
                      isHeader
                      className={`px-5 py-3 font-medium text-gray-500 text-theme-xs ${
                        i >= 1 && i <= 3 ? "text-end" : "text-start"
                      }`}
                    >
                      {h}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-gray-500 text-theme-sm">
                    Aucun produit ne correspond à ce filtre.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.product.id} className="hover:bg-gray-50">
                    <TableCell className="px-5 py-4 text-theme-sm">
                      <button
                        type="button"
                        onClick={() => onOpen(r.product.id)}
                        className="text-left font-medium text-gray-800 hover:text-brand-600 hover:underline"
                      >
                        {r.product.name}
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-800">
                      {r.onHand === null ? "—" : groupThousands(r.onHand)}
                      {scope === "all" && r.reserve !== null && (
                        <span className="block text-theme-xs font-normal text-gray-400">
                          dont réserve {groupThousands(r.reserve)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-500">
                      {groupThousands(r.min)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-500">
                      {r.weekly > 0 ? groupThousands(Math.round(r.weekly)) : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm">
                      <CoverageBadge row={r} />
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Sparkline
                        points={r.spark}
                        tone={
                          r.status === "order"
                            ? "error"
                            : r.status === "low"
                              ? "warning"
                              : "neutral"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
