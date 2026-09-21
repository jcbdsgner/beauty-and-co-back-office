"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { clients, salons, type ClientRow, type SalonScope } from "@/lib/mock/beautyandco";
import ClientCards from "./ClientCards";

// Écran « Clients ».
// 1. Où en est l'utilisatrice ? En session de gestion : elle cherche une cliente
//    précise (pour l'appeler, vérifier ses points, son historique) ou balaye sa
//    clientèle pour repérer qui relancer. Pas pressée, mais efficace.
// 2. Ce qui doit sauter aux yeux : la recherche (retrouver une cliente en 2 s),
//    puis « Dernière visite » et « Total dépensé » — ses repères pour savoir qui
//    compte et qui décroche. Tri par défaut : dernière visite, la plus récente
//    en haut.
// 3. Quand ça se passe mal : recherche sans résultat → message + réinitialisation ;
//    salon sans cliente → état vide ; suppression → retrait de la liste avec
//    « Annuler » (front-end seulement, aucune vraie suppression).

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

type SegmentFilter = "all" | "active" | "a-relancer";

const SEGMENT_OPTIONS: SegmentedOption<SegmentFilter>[] = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "a-relancer", label: "À relancer" },
];

// Le tri par clic sur en-t\u00eate de colonne n'a plus de sens en grille de
// cartes \u2014 remplac\u00e9 par un contr\u00f4le \u00ab Trier par \u00bb \u00e0 c\u00f4t\u00e9 de la recherche.
type SortKey = "name" | "lastVisit" | "totalSpent" | "loyaltyPoints";
type SortState = { key: SortKey; dir: "asc" | "desc" };

const SORT_OPTIONS: [SortKey, string][] = [
  ["lastVisit", "Derni\u00e8re visite"],
  ["name", "Nom"],
  ["totalSpent", "Total d\u00e9pens\u00e9"],
  ["loyaltyPoints", "Points fid\u00e9lit\u00e9"],
];
const TEXT_KEYS = new Set<SortKey>(["name"]);

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const digitsOf = (s: string) => s.replace(/\D/g, "");

function compareRows(a: ClientRow, b: ClientRow, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    case "lastVisit":
      return (a.lastVisit ?? "").localeCompare(b.lastVisit ?? "");
    default:
      return (a[key] as number) - (b[key] as number);
  }
}

export default function Clients() {
  const { scope, setScope } = useLocation();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [sort, setSort] = useState<SortState>({ key: "lastVisit", dir: "desc" });
  // Suppressions de la session — aucune persistance, purement local.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [undoTarget, setUndoTarget] = useState<ClientRow | null>(null);

  const all = useMemo(() => clients(scope), [scope]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    const qDigits = digitsOf(query);

    const rows = all
      .filter((c) => !removed.has(c.id))
      .filter((c) => segment === "all" || c.segment === segment)
      .filter((c) => {
        if (!q && !qDigits) return true;
        const byText = normalize(c.name).includes(q) || normalize(c.email).includes(q);
        const byPhone = qDigits.length >= 2 && digitsOf(c.phone).includes(qDigits);
        return byText || byPhone;
      });

    return rows.sort((a, b) => {
      if (sort.key === "lastVisit") {
        // Les « jamais venues » restent en bas quel que soit le sens du tri.
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
      }
      const r = compareRows(a, b, sort.key);
      return sort.dir === "asc" ? r : -r;
    });
  }, [all, removed, segment, query, sort]);

  const totalShown = all.filter((c) => !removed.has(c.id)).length;

  const setSortKey = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? prev : { key, dir: TEXT_KEYS.has(key) ? "asc" : "desc" },
    );
  const toggleSortDir = () =>
    setSort((prev) => ({ ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }));

  const handleDelete = (row: ClientRow) => {
    setRemoved((prev) => new Set(prev).add(row.id));
    setUndoTarget(row);
  };

  const undoDelete = () => {
    if (!undoTarget) return;
    setRemoved((prev) => {
      const next = new Set(prev);
      next.delete(undoTarget.id);
      return next;
    });
    setUndoTarget(null);
  };

  const filtering = query.trim() !== "" || segment !== "all";

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Clients"
          description="Toute la clientèle Beauty & Co — historique de visites, dépenses et fidélité."
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Salon
            </span>
            <SegmentedControl
              options={SALON_OPTIONS}
              value={scope}
              onChange={setScope}
              aria-label="Filtrer par salon"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Affichage
            </span>
            <SegmentedControl
              options={SEGMENT_OPTIONS}
              value={segment}
              onChange={setSegment}
              aria-label="Filtrer la liste des clientes"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.04 9.37a6.33 6.33 0 1 1 12.67 0 6.33 6.33 0 0 1-12.67 0ZM9.38 1.54a7.83 7.83 0 1 0 4.98 13.88l2.82 2.82a.75.75 0 1 0 1.06-1.06l-2.82-2.82A7.83 7.83 0 0 0 9.38 1.54Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, email ou téléphone…"
            aria-label="Rechercher une cliente"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Trier par
            </span>
            <select
              value={sort.key}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-hidden"
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleSortDir}
              aria-label={sort.dir === "asc" ? "Tri croissant" : "Tri décroissant"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              {sort.dir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <p className="text-theme-sm text-gray-500">
            {visible.length} {visible.length > 1 ? "clientes" : "cliente"}
            {visible.length !== totalShown && (
              <span className="text-gray-400"> · sur {totalShown}</span>
            )}
          </p>
        </div>
      </div>

      {undoTarget && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-theme-sm text-gray-600">
          <span>
            La fiche de{" "}
            <span className="font-medium text-gray-800">{undoTarget.name}</span> a été retirée
            de la liste.
          </span>
          <button
            type="button"
            onClick={undoDelete}
            className="shrink-0 font-medium text-brand-500 hover:text-brand-600"
          >
            Annuler
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-theme-sm font-medium text-gray-700">
            {totalShown === 0
              ? "Aucune cliente pour ce salon."
              : "Aucune cliente ne correspond à votre recherche."}
          </p>
          {filtering && totalShown > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSegment("all");
              }}
              className="mt-3 text-theme-sm font-medium text-brand-500 hover:text-brand-600"
            >
              Réinitialiser la recherche
            </button>
          )}
        </div>
      ) : (
        <ClientCards rows={visible} onDelete={handleDelete} />
      )}
    </div>
  );
}
