"use client";

import { useState } from "react";
import { TrashBinIcon } from "@/icons";
import {
  RECIPE_UNIT_OPTIONS,
  digitsToInt,
  newId,
  productName,
  products,
  type RecipeItem,
  type RecipeUnit,
} from "@/lib/mock/services";
import { AddLink, FicheGroup, Muted, RuleLine } from "./FicheGroup";
import { SelectField, TextInput, btnGhost, btnPrimary } from "./ui";

type Props = {
  recipe: RecipeItem[];
  onChange: (next: RecipeItem[]) => void;
};

const PRODUCT_OPTIONS = products.map((p) => ({ value: p.id, label: p.name }));

export default function RecipeEditor({ recipe, onChange }: Props) {
  const [productId, setProductId] = useState(products[0].id);
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<RecipeUnit>(products[0].defaultUnit);
  const [adding, setAdding] = useState(false);

  const pickProduct = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setUnit(p.defaultUnit);
  };

  const add = () => {
    const n = digitsToInt(qty);
    if (n <= 0) return;
    onChange([...recipe, { id: newId("ri"), productId, qty: n, unit }]);
    setQty("1");
    setAdding(false);
  };

  const remove = (id: string) => onChange(recipe.filter((r) => r.id !== id));

  // « Produits consommés » : ce que la prestation utilise à chaque visite,
  // déduit du stock à la fin de la visite.
  return (
    <FicheGroup
      title="Produits consommés"
      count={recipe.length}
      action={!adding && <AddLink onClick={() => setAdding(true)}>Ajouter un produit</AddLink>}
    >
      {recipe.length === 0 && !adding && (
        <div className="px-5 py-3">
          <RuleLine>
            <Muted>Aucun produit</Muted>
          </RuleLine>
        </div>
      )}
      {recipe.map((item) => (
        <div key={item.id} className="flex min-h-12 items-center justify-between gap-3 px-5 py-2 text-sm">
          <span className="min-w-0 truncate text-base-content">{productName(item.productId)}</span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="tabular-nums text-base-content/70">
              {item.qty} {item.unit}
            </span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={`Retirer ${productName(item.productId)}`}
              title="Retirer"
              className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
            >
              <TrashBinIcon className="size-4" />
            </button>
          </span>
        </div>
      ))}
      {adding && (
        <div className="bg-base-200/50 px-5 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_90px_130px] items-end gap-2">
            <SelectField label="Produit" value={productId} onChange={pickProduct} options={PRODUCT_OPTIONS} />
            <TextInput label="Quantité" inputMode="numeric" value={qty} onChange={setQty} />
            <SelectField label="Unité" value={unit} onChange={(v) => setUnit(v)} options={RECIPE_UNIT_OPTIONS} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={add} disabled={digitsToInt(qty) <= 0} className={btnPrimary}>
              Ajouter
            </button>
            <button type="button" onClick={() => setAdding(false)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </FicheGroup>
  );
}
