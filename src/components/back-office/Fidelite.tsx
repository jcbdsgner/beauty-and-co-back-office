"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
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
// 1. Où en est la propriétaire ? Retouche rapide : « marquer l'échéance de
//    Mme Fall payée », « enregistrer la vente d'un pack », « consommer une
//    prestation ». Elle entre, agit, sort.
// 2. Ce qui doit sauter aux yeux : qui a une échéance à encaisser (badge
//    « À régler ») — c'est de l'argent qui dort — et ce qu'il reste sur
//    chaque pack.
// 3. Quand ça se passe mal : aucun abonnement / pack → état vide explicite ;
//    un abonnement révoqué reste visible, grisé ; un pack entièrement consommé
//    est marqué et ne propose plus d'action.
//
// Depuis le 2026-09-27, la configuration (programme de points, paliers,
// récompenses, catalogue des forfaits et packs) vit dans Réglages : ce n'est
// pas du travail quotidien. Les offres sont lues ici via `FideliteContext`,
// pour qu'un forfait créé dans Réglages soit tout de suite souscriptible. Les
// deux suivis sont côte à côte, sans onglets.
//
// Aucun backend : tout est édité en mémoire de session. La vraie auth, le vrai
// paiement récurrent (PSP) et le parcours de souscription en ligne sont hors
// périmètre de ce squelette front-end.

export default function Fidelite() {
  const { forfaits, packs } = useFideliteConfig();
  const [abonnements, setAbonnements] = useState<Abonnement[]>(abonnementSeeds);
  const [packPurchases, setPackPurchases] = useState<PackPurchase[]>(packPurchaseSeeds);

  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Fidélité & abonnements"
        actions={
          <Link
            href="/reglages?section=offres"
            className={`${btnOutline} gap-2`}
          >
            <Settings aria-hidden className="size-4" />
            Régler les offres et le programme
          </Link>
        }
      />

      {notice && (
        <p className="mb-6 rounded-box bg-neutral px-5 py-3 text-[15px] font-medium text-neutral-content">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-2 items-start gap-6">
        <AbonnementsPanel
          abonnements={abonnements}
          forfaits={forfaits}
          onChange={setAbonnements}
          notify={setNotice}
        />
        <PackSalesPanel
          purchases={packPurchases}
          packs={packs}
          onChange={setPackPurchases}
          notify={setNotice}
        />
      </div>
    </div>
  );
}
