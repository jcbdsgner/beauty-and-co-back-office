"use client";

import SalonFilter from "@/components/back-office/shared/SalonFilter";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import Alert from "@/components/ui/alert/Alert";
import { useLocation } from "@/context/LocationContext";
import { salonName, singleSalon, type SalonId } from "@/lib/mock/beautyandco";
import { Plus } from "lucide-react";
import {
  emptyThresholds,
  productStock,
  registerProduct,
  stockRows,
  type StockMovement,
  type ThresholdOverride,
} from "@/lib/mock/stock";
import StockList from "./stock/StockList";
import StockDetail from "./stock/StockDetail";
import NewProductPanel from "./stock/NewProductPanel";

// Écran « Stock » — suivi des consommables, sorti du parcours « Services ».
//
// 1. Où en est la propriétaire ? En pilotage, pas aux gestes : elle vérifie ce
//    qu'il faut commander avant d'appeler le fournisseur, contrôle un niveau
//    après un inventaire, ou renfloue un salon depuis la réserve. Rarement
//    pressée, mais veut une réponse nette : « qu'est-ce qui va manquer, où, et
//    quand ».
// 2. Ce qui doit sauter aux yeux : les produits dont la couverture est la plus
//    courte — la liste est triée par couverture croissante, badge rouge sous 7
//    jours. Selon le filtre salon, l'alerte est « à commander » (entreprise) ou
//    « à réapprovisionner » (un salon, transfert possible depuis la réserve).
// 3. Quand ça se passe mal : produit jamais inventorié → « Niveau inconnu », pas
//    de fausse projection ; produit encore dans une recette mais sans sortie →
//    alerte « recette à jour ? » ; moins de 4 semaines de données → la
//    projection est signalée comme indicative.

type View = { kind: "list" } | { kind: "detail"; productId: string };

const isKnownProduct = (id: string | null): id is string =>
  !!id && productStock.some((s) => s.productId === id);

export default function Stock() {
  const { scope, setScope } = useLocation();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>({ kind: "list" });
  const [extraMovements, setExtraMovements] = useState<StockMovement[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdOverride>(emptyThresholds);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [newOpen, setNewOpen] = useState(false);
  // Les produits créés en session rejoignent le catalogue du module mock :
  // ce compteur force le recalcul de la liste après un ajout.
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Deep-link : /stock?produit=<id> (depuis une notification « Stock bas ») ouvre
  // directement la fiche produit — au montage comme lorsqu'on clique la
  // notification en étant déjà sur l'écran. On mémorise le dernier paramètre vu
  // pour ne pas ré-ouvrir la fiche quand la propriétaire revient à la liste.
  // Param absent ou inconnu → on reste sur la liste.
  const requestedProduct = searchParams.get("produit");
  const [seenProduct, setSeenProduct] = useState<string | null>(null);
  if (requestedProduct !== seenProduct) {
    setSeenProduct(requestedProduct);
    if (isKnownProduct(requestedProduct)) {
      setView({ kind: "detail", productId: requestedProduct });
    }
  }

  const rows = useMemo(
    () => stockRows(scope, { movements: extraMovements, thresholds }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope, extraMovements, thresholds, catalogVersion],
  );

  const toReplenish = rows.filter((r) => r.status === "order").length;

  const addMovements = (movements: StockMovement[]) =>
    setExtraMovements((list) => [...list, ...movements]);

  const setThreshold = ({
    productId,
    salon,
    value,
  }: {
    productId: string;
    salon?: SalonId;
    value: number;
  }) =>
    setThresholds((t) =>
      salon
        ? {
            ...t,
            bySalon: {
              ...t.bySalon,
              [productId]: { ...t.bySalon[productId], [salon]: value },
            },
          }
        : { ...t, company: { ...t.company, [productId]: value } },
    );

  const setPhoto = (productId: string, dataUrl: string | null) =>
    setPhotos((p) => {
      if (dataUrl === null) {
        const next = { ...p };
        delete next[productId];
        return next;
      }
      return { ...p, [productId]: dataUrl };
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        actions={
          <>
            <SalonFilter value={scope} onChange={setScope} />
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="btn btn-primary btn-sm gap-2 text-[15px] font-semibold normal-case active:scale-[0.97]"
            >
              <Plus className="h-[14px] w-[14px]" />
              Nouveau produit
            </button>
          </>
        }
      />

      {toReplenish > 0 && (
        <Alert
          variant="warning"
          title={
            scope === "all"
              ? `${toReplenish} produit${toReplenish > 1 ? "s" : ""} à commander`
              : `${toReplenish} produit${toReplenish > 1 ? "s" : ""} à réapprovisionner à ${salonName(scope)}`
          }
          message={
            scope === "all"
              ? "Le stock entreprise (réserve + salons) est passé sous le seuil. Ouvrez la fiche pour la quantité conseillée."
              : singleSalon(scope)
                ? "Ce salon est sous son seuil. Transférez depuis la réserve centrale, ou passez commande si la réserve est vide."
                : "Ces salons sont sous leur seuil. Transférez depuis la réserve centrale, ou passez commande si la réserve est vide."
          }
        />
      )}

      <StockList
        rows={rows}
        photos={photos}
        onOpen={(productId) => setView({ kind: "detail", productId })}
      />

      {view.kind === "detail" && (
        <StockDetail
          productId={view.productId}
          scope={scope}
          extraMovements={extraMovements}
          thresholds={thresholds}
          photo={photos[view.productId]}
          onAddMovements={addMovements}
          onSetThreshold={setThreshold}
          onSetPhoto={setPhoto}
          onBack={() => setView({ kind: "list" })}
        />
      )}

      {newOpen && (
        <NewProductPanel
          onClose={() => setNewOpen(false)}
          onCreate={(input, photo) => {
            registerProduct(input);
            if (photo) setPhoto(input.product.id, photo);
            setCatalogVersion((v) => v + 1);
            setNewOpen(false);
            setView({ kind: "detail", productId: input.product.id });
          }}
        />
      )}
    </div>
  );
}
