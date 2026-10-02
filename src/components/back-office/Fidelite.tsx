"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Toast } from "@/components/ui/molecules/toast";
import { useFideliteConfig } from "@/context/FideliteContext";
import {
  abonnementSeeds,
  packPurchaseSeeds,
  type Abonnement,
  type PackPurchase,
} from "@/lib/mock/abonnements";
import AbonnementsPanel from "./fidelite/AbonnementsPanel";
import PackSalesPanel from "./fidelite/PackSalesPanel";
import { btnOutline } from "./fidelite/ui";

// Écran « Fidélité » — le suivi quotidien des abonnements souscrits et des
// packs vendus.
// 1. Où en est la propriétaire ? Retouche rapide : « encaisser l'échéance de
//    Mme Kane », « vendre un pack », « marquer une prestation du pack
//    utilisée ». Elle entre, cherche la cliente, agit, sort — ou file sur sa
//    fiche (chaque ligne y mène, en panneau latéral).
// 2. Ce qui doit sauter aux yeux : qui a une échéance à encaisser — c'est de
//    l'argent qui dort : compteur rouge dans l'en-tête, lignes « À régler » en
//    tête de liste, bouton « Encaisser » plein sur ces seules lignes.
// 3. Quand ça se passe mal : aucune ligne → état vide ; recherche sans
//    résultat → « Effacer la recherche » ; un abonnement révoqué ou un pack
//    entièrement utilisé passe dans une liste repliée (dépliée d'office si la
//    recherche y trouve quelque chose) ; une personne hors fichier n'a pas de
//    lien vers une fiche.
//
// La configuration (programme de points, paliers, récompenses, catalogue des
// forfaits et packs) vit dans Réglages ; les offres sont lues ici via
// `FideliteContext`. Aucun backend : tout est édité en mémoire de session.

export default function Fidelite() {
  const { forfaits, packs } = useFideliteConfig();
  const [abonnements, setAbonnements] = useState<Abonnement[]>(abonnementSeeds);
  const [packPurchases, setPackPurchases] = useState<PackPurchase[]>(packPurchaseSeeds);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const dismiss = useCallback(() => setNotice(null), []);
  const clearQuery = () => setQuery("");

  return (
    <div>
      <PageHeader
        title="Fidélité & abonnements"
        actions={
          <Link href="/reglages?section=offres" className={`${btnOutline} gap-2`}>
            <Settings aria-hidden className="size-4" />
            Régler les offres
          </Link>
        }
      />

      <SearchInput
        placeholder="Chercher une cliente, un n° client, un forfait ou un pack…"
        aria-label="Chercher un abonnement ou un pack"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6"
      />

      <div className="grid grid-cols-2 items-start gap-6">
        <AbonnementsPanel
          abonnements={abonnements}
          forfaits={forfaits}
          query={query}
          onClearQuery={clearQuery}
          onChange={setAbonnements}
          notify={setNotice}
        />
        <PackSalesPanel
          purchases={packPurchases}
          packs={packs}
          query={query}
          onClearQuery={clearQuery}
          onChange={setPackPurchases}
          notify={setNotice}
        />
      </div>

      <Toast message={notice} onDismiss={dismiss} />
    </div>
  );
}
