"use client";

import { useMemo, useState } from "react";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  durationLabel,
  prestationSeeds,
  serviceSeeds,
} from "@/lib/mock/services";
import { SERVICE_ICONS } from "../services/serviceIcons";

// Multi-sélection de prestations du catalogue réel, groupées par service, avec
// recherche. Partagée par les panneaux Forfaits et Packs.
//
// `showPricing` : sur un forfait, seuls comptent le nom et la catégorie (le prix
// est libre au niveau du forfait) → on masque prix / durée.

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export default function PrestationPicker({
  selected,
  onChange,
  showPricing = true,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  showPricing?: boolean;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = fold(query.trim());
    return serviceSeeds
      .map((service) => ({
        service,
        prestations: prestationSeeds.filter(
          (p) =>
            p.serviceId === service.id &&
            (q === "" || fold(p.name).includes(q) || fold(service.name).includes(q)),
        ),
      }))
      .filter((g) => g.prestations.length > 0);
  }, [query]);

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">Prestations incluses</span>
        <span className="text-theme-xs text-gray-500">
          {selected.length} sélectionnée{selected.length > 1 ? "s" : ""}
        </span>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une prestation…"
        className="mb-2 h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
      />

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-gray-200 p-3">
        {groups.length === 0 ? (
          <p className="px-1 py-6 text-center text-theme-sm text-gray-500">
            Aucune prestation ne correspond à « {query} ».
          </p>
        ) : (
          groups.map(({ service, prestations }) => {
            const Icon = SERVICE_ICONS[service.icon];
            return (
              <div key={service.id}>
                <p className="mb-1.5 flex items-center gap-1.5 text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                  <Icon className="size-3.5" />
                  {service.name}
                </p>
                <ul className="space-y-1">
                  {prestations.map((p) => {
                    const on = selected.includes(p.id);
                    return (
                      <li key={p.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-theme-sm transition ${
                            on ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(p.id)}
                            className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                          />
                          <span className="min-w-0 flex-1 truncate">{p.name}</span>
                          {showPricing && (
                            <span className="shrink-0 tabular-nums text-theme-xs text-gray-400">
                              {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
