"use client";

import SalonFilter from "@/components/back-office/shared/SalonFilter";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Button } from "@/components/ui/atoms/button";
import { useLocation } from "@/context/LocationContext";
import { useClientsData } from "@/context/ClientsContext";
import { EMPTY_CLIENT_PREFERENCES } from "@/lib/mock/preferences";
import {
  HISTORIQUE_MIN_VISITS,
  clientMatchesQuery,
  isNewClient,
  scopeIds,
  type ClientRow,
} from "@/lib/mock/beautyandco";
import ClientCards, { ClientCard } from "./ClientCards";
import { NewClientDialog, type NewClientPrefill } from "./ClientEditDialogs";
import { ChipFilter, Legend } from "./shared/board";

// Écran « Clients » — le Répertoire de point-de-vente, qui fait autorité
// (`components/clientele/repertoire-view.tsx`) : recherche d'abord. La ligne
// de recherche en tête ; recherche vide → deux petits blocs (Vues récemment ·
// Attendues aujourd'hui) ; l'annuaire complet filtrable en dessous
// (Toutes / Nouvelles / Historique / VIP). Écart back-office : le filtre salon
// global dans le bandeau de page (la caisse est à un seul poste).
//
// 1. La propriétaire cherche une cliente précise (l'appeler, voir ses
//    préférences, ses avantages) ou parcourt sa clientèle.
// 2. Ce qui saute aux yeux : la recherche, puis les clientes du moment.
// 3. Recherche sans résultat → proposition de créer la fiche, préremplie ;
//    filtre vide → réinitialiser.

const FILTERS = [
  { value: "toutes", label: "Toutes" },
  { value: "nouvelles", label: "Nouvelles" },
  { value: "historique", label: "Historique" },
  { value: "vip", label: "VIP" },
];

const CONTEXTUAL_MAX = 5;

// Ce qui a été tapé avant une recherche vide → préremplissage de la fiche.
function draftFromQuery(q: string): NewClientPrefill {
  const t = q.trim();
  if (!t) return {};
  if (/\d/.test(t) && /^[+\d\s().-]+$/.test(t)) return { phone: t };
  const [first, ...rest] = t.split(/\s+/);
  return { firstName: first, lastName: rest.join(" ") || undefined };
}

function matchesFilter(c: ClientRow, filter: string) {
  switch (filter) {
    case "nouvelles":
      return isNewClient(c);
    case "historique":
      return c.appointments >= HISTORIQUE_MIN_VISITS;
    case "vip":
      return c.tier === "vip" || c.tier === "platinum" || c.tier === "gold";
    default:
      return true;
  }
}

function EmptyBlock({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-base-300 px-6 py-14 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-base-content/40">{title}</p>
      {hint && <p className="max-w-sm text-sm text-base-content/50">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default function Clients() {
  const router = useRouter();
  const { scope, setScope } = useLocation();
  const { rows: clientRows, createClient, updatePreferences, recentClientIds, expectedToday } = useClientsData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("toutes");
  const [creating, setCreating] = useState(false);
  const [prefill, setPrefill] = useState<NewClientPrefill>({});

  const all = useMemo(() => clientRows(scope), [clientRows, scope]);
  const everyone = useMemo(() => clientRows("all"), [clientRows]);
  const searching = query.trim() !== "";

  const filtered = useMemo(
    () => all.filter((c) => clientMatchesQuery(c, query)).filter((c) => searching || matchesFilter(c, filter)),
    [all, query, filter, searching],
  );

  const byId = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);
  const recent = recentClientIds
    .map((id) => byId.get(id))
    .filter((c): c is ClientRow => Boolean(c))
    .slice(0, CONTEXTUAL_MAX);
  const expected = expectedToday
    .map(({ clientId, start }) => ({ client: byId.get(clientId), start }))
    .filter((x): x is { client: ClientRow; start: string } => Boolean(x.client))
    .slice(0, CONTEXTUAL_MAX);

  const openCreate = (values: NewClientPrefill = {}) => {
    setPrefill(values);
    setCreating(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        actions={
          <SalonFilter value={scope} onChange={setScope} />
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="Chercher une cliente — nom, téléphone ou n° client…"
          aria-label="Chercher une cliente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="brand" icon={<Plus className="size-4" />} onClick={() => openCreate()}>
          Nouvelle cliente
        </Button>
      </div>

      {!searching && (recent.length > 0 || expected.length > 0) && (
        <div className={recent.length > 0 && expected.length > 0 ? "grid grid-cols-2 gap-6" : "space-y-3"}>
          {recent.length > 0 && (
            <div className="space-y-3">
              <Legend size="section">Vues récemment</Legend>
              <div className={`grid grid-cols-2 gap-3 ${expected.length > 0 ? "" : "md:grid-cols-3"}`}>
                {recent.map((c) => (
                  <ClientCard key={c.id} client={c} trailing={c.phone} />
                ))}
              </div>
            </div>
          )}
          {expected.length > 0 && (
            <div className="space-y-3">
              <Legend size="section">Attendues aujourd&apos;hui</Legend>
              <div className={`grid grid-cols-2 gap-3 ${recent.length > 0 ? "" : "md:grid-cols-3"}`}>
                {expected.map(({ client, start }) => (
                  <ClientCard key={client.id} client={client} trailing={`Rendez-vous ${start}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Legend size="section">{searching ? `Résultats · ${filtered.length}` : "Tout l'annuaire"}</Legend>
          {!searching && <ChipFilter options={FILTERS} value={filter} onChange={setFilter} />}
        </div>

        {filtered.length === 0 ? (
          searching ? (
            <EmptyBlock
              title={`Aucune cliente pour « ${query.trim()} »`}
              hint="Cette cliente n'est peut-être pas encore au répertoire."
              action={
                <Button variant="brand" onClick={() => openCreate(draftFromQuery(query))}>
                  Créer « {query.trim()} » comme nouvelle cliente
                </Button>
              }
            />
          ) : (
            <EmptyBlock
              title={all.length === 0 ? "Aucune cliente pour ce salon" : "Aucune cliente ne correspond à ce filtre"}
              action={
                all.length > 0 && (
                  <Button variant="outline" onClick={() => setFilter("toutes")}>
                    Réinitialiser les filtres
                  </Button>
                )
              }
            />
          )
        ) : (
          <ClientCards rows={filtered} />
        )}
      </div>

      <NewClientDialog
        open={creating}
        defaultSalon={scopeIds(scope)[0]}
        initialValues={prefill}
        existing={everyone}
        onClose={() => setCreating(false)}
        onCreate={(draft, profile) => {
          const id = createClient(draft);
          if (profile.hairType || profile.colorReference) {
            updatePreferences(id, { ...EMPTY_CLIENT_PREFERENCES, ...profile });
          }
          router.push(`/clients/${id}`);
        }}
      />
    </div>
  );
}
