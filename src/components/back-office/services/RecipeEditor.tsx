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
import { SelectField, TextInput } from "./ui";

type Props = {
  recipe: RecipeItem[];
  onChange: (next: RecipeItem[]) => void;
};

const PRODUCT_OPTIONS = products.map((p) => ({ value: p.id, label: p.name }));

export default function RecipeEditor({ recipe, onChange }: Props) {
  const [productId, setProductId] = useState(products[0].id);
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<RecipeUnit>(products[0].defaultUnit);

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
  };

  const remove = (id: string) => onChange(recipe.filter((r) => r.id !== id));

  return (
    <div>
      <p className="text-sm font-medium text-gray-800">Recette de consommation</p>
      <p className="mt-0.5 text-theme-xs text-gray-500">
        Ce que la prestation consomme — le stock est déduit automatiquement à la fin de la visite.
      </p>

      {recipe.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-gray-200 px-4 py-4 text-center text-theme-xs text-gray-500">
          Aucun ingrédient. Ajoutez-en un ci-dessous.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {recipe.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-theme-sm"
            >
              <span className="min-w-0 truncate text-gray-800">
                {productName(item.productId)}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-gray-600">
                  {item.qty} {item.unit}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Retirer ${productName(item.productId)}`}
                  className="rounded p-1 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_90px_130px_auto] items-end gap-2">
        <SelectField
          label="Produit"
          value={productId}
          onChange={pickProduct}
          options={PRODUCT_OPTIONS}
        />
        <TextInput
          label="Quantité"
          inputMode="numeric"
          value={qty}
          onChange={setQty}
        />
        <SelectField
          label="Unité"
          value={unit}
          onChange={(v) => setUnit(v)}
          options={RECIPE_UNIT_OPTIONS}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-theme-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Ajouter
        </button>
      </div>
    </div>
  );
}
