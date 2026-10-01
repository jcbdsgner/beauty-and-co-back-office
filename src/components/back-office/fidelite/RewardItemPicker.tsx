"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Package, Search } from "lucide-react";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  PRODUCT_BRANDS,
  durationLabel,
  prestationSeeds,
  products,
  serviceSeeds,
} from "@/lib/mock/services";
import CategoryThumb from "../shared/CategoryThumb";

// Choix de LA prestation ou DU produit offert par une récompense de fidélité :
// recherche (pliée sans accent) + liste défilante groupée — par catégorie pour
// les prestations, par marque pour les produits. Choix unique.

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

type Item = { id: string; name: string; meta: string; image?: string | null };
type Group = { key: string; label: string; image?: string | null; items: Item[] };

const PRESTATION_GROUPS: Group[] = serviceSeeds.map((s) => ({
  key: s.id,
  label: s.name,
  image: s.image,
  items: prestationSeeds
    .filter((p) => p.serviceId === s.id)
    .map((p) => ({ id: p.id, name: p.name, meta: `${durationLabel(p.durationMin)} · ${fcfa(p.priceFcfa)}` })),
}));

const PRODUCT_GROUPS: Group[] = PRODUCT_BRANDS.map((b) => ({
  key: b.id,
  label: b.name,
  items: products
    .filter((p) => p.brand === b.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      meta: [p.gamme, p.priceFcfa ? fcfa(p.priceFcfa) : null].filter(Boolean).join(" · "),
      image: p.image ?? null,
    })),
}));

export default function RewardItemPicker({
  kind,
  value,
  onChange,
}: {
  kind: "service" | "product";
  value: string | null;
  onChange: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const source = kind === "service" ? PRESTATION_GROUPS : PRODUCT_GROUPS;
  const noun = kind === "service" ? "prestation" : "produit";

  const groups = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return source.filter((g) => g.items.length > 0);
    return source
      .map((g) => ({
        ...g,
        items: fold(g.label).includes(q) ? g.items : g.items.filter((i) => fold(`${i.name} ${i.meta}`).includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, source]);

  const selected = value ? source.flatMap((g) => g.items).find((i) => i.id === value) : undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="shrink-0 text-sm font-medium text-base-content">
          {kind === "service" ? "Prestation offerte" : "Produit offert"}
        </span>
        <span className="min-w-0 truncate text-xs text-base-content/60">
          {selected ? selected.name : `Aucun${kind === "service" ? "e" : ""} ${noun} choisi${kind === "service" ? "e" : ""}`}
        </span>
      </div>

      <label className="mb-2 flex h-11 items-center gap-2.5 rounded-field border border-base-content/20 bg-base-100 px-3.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-[#fdcfca]/60">
        <Search aria-hidden className="size-4 shrink-0 text-base-content/55" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === "service" ? "Rechercher une prestation ou une catégorie…" : "Rechercher un produit, une marque, une gamme…"}
          aria-label={`Rechercher un${kind === "service" ? "e" : ""} ${noun}`}
          className="h-full grow bg-transparent text-sm text-base-content placeholder:text-base-content/50 focus:outline-none"
        />
      </label>

      <div role="listbox" aria-label={`Choisir un${kind === "service" ? "e" : ""} ${noun}`} className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-base-300 p-2">
        {groups.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-base-content/60">
            Aucun{kind === "service" ? "e" : ""} {noun} ne correspond à « {query} ».
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              <p className="flex items-center gap-2 px-2 pt-1 pb-1.5 text-xs font-medium uppercase tracking-wide text-base-content/50">
                {kind === "service" && <CategoryThumb image={g.image ?? null} name={g.label} size={18} />}
                {g.label}
                <span className="tabular-nums text-base-content/35">{g.items.length}</span>
              </p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const on = item.id === value;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => onChange(item.id, item.name)}
                        className={`flex w-full items-center gap-3 rounded-field px-2 py-2 text-left transition ${
                          on ? "bg-accent" : "hover:bg-base-200"
                        }`}
                      >
                        {kind === "product" && (
                          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-base-300 bg-base-100">
                            {item.image ? (
                              <Image src={item.image} alt="" fill sizes="36px" className="object-contain" />
                            ) : (
                              <Package aria-hidden className="size-4 text-base-content/40" />
                            )}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm ${on ? "font-semibold text-secondary" : "text-base-content"}`}>
                            {item.name}
                          </span>
                          {item.meta && <span className="block truncate text-xs text-base-content/55">{item.meta}</span>}
                        </span>
                        {on && <Check aria-hidden className="size-4 shrink-0 text-secondary" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
