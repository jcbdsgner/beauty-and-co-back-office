"use client";

import { useState } from "react";
import DetailModal from "@/components/back-office/detail/DetailModal";
import ImagePicker from "@/components/back-office/shared/ImagePicker";
import { cn } from "@/lib/utils";
import { fcfa, salons, type SalonId } from "@/lib/mock/beautyandco";
import {
  PRODUCT_BRANDS,
  RECIPE_UNIT_OPTIONS,
  digitsToInt,
  type ProductBrand,
  type RecipeUnit,
} from "@/lib/mock/services";
import {
  PRODUCT_USAGE_OPTIONS,
  newProductId,
  type NewProductInput,
  type ProductUsage,
} from "@/lib/mock/stock";
import { SelectField, TextInput, btnGhost, btnPrimary } from "./ui";

// Ajout d'un produit au stock (2026-09-28). Les 3 questions :
// 1. Elle vient de recevoir une référence qu'on ne suit pas encore (nouvelle
//    gamme, produit de cabine) : elle veut la voir apparaître dans le stock et,
//    si elle sert en cabine, dans les recettes de Services.
// 2. Ce qui compte : le nom, et à quoi sert le produit — vendu, utilisé en
//    prestation, ou les deux (deux stocks séparés dans chaque salon).
// 3. Si ça coince : nom manquant, ou prix manquant pour un produit vendu → le
//    bouton dit ce qui manque ; stock de départ laissé vide = 0.

type SalonQty = { vente: string; prestations: string };

const blankSalons = (): Record<SalonId, SalonQty> =>
  Object.fromEntries(salons.map((s) => [s.id, { vente: "", prestations: "" }])) as Record<SalonId, SalonQty>;

export default function NewProductPanel({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: NewProductInput, photo: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState<ProductBrand>("kerastase");
  const [gamme, setGamme] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<RecipeUnit>("ml");
  const [usage, setUsage] = useState<ProductUsage>("vente");
  const [photo, setPhoto] = useState<string | null>(null);
  const [reserve, setReserve] = useState("");
  const [bySalon, setBySalon] = useState<Record<SalonId, SalonQty>>(blankSalons);
  const [salonMin, setSalonMin] = useState("3");
  const [companyMin, setCompanyMin] = useState("8");
  const [leadDays, setLeadDays] = useState("7");

  const sells = usage !== "prestations";
  const serves = usage !== "vente";
  const missing = !name.trim() ? "Indiquez le nom du produit" : sells && digitsToInt(price) <= 0 ? "Indiquez le prix de vente" : null;

  const setSalonQty = (id: SalonId, key: keyof SalonQty, v: string) =>
    setBySalon((prev) => ({ ...prev, [id]: { ...prev[id], [key]: v } }));

  const submit = () => {
    if (missing) return;
    onCreate(
      {
        product: {
          id: newProductId(name.trim()),
          name: name.trim(),
          brand,
          ...(gamme.trim() ? { gamme: gamme.trim() } : {}),
          defaultUnit: serves ? unit : "pièce",
          ...(sells ? { priceFcfa: digitsToInt(price) } : {}),
        },
        usage,
        salonMin: digitsToInt(salonMin),
        companyMin: digitsToInt(companyMin),
        leadDays: Math.max(1, digitsToInt(leadDays)),
        reserve: digitsToInt(reserve),
        salons: Object.fromEntries(
          salons.map((s) => [
            s.id,
            {
              vente: sells ? digitsToInt(bySalon[s.id].vente) : 0,
              prestations: serves ? digitsToInt(bySalon[s.id].prestations) : 0,
            },
          ]),
        ),
      },
      photo,
    );
  };

  return (
    <DetailModal title="Nouveau produit" onClose={onClose} widthClassName="max-w-2xl">
      <div className="flex flex-col gap-7">
        <div className="flex items-start gap-5">
          <ImagePicker value={photo} onChange={setPhoto} label="Photo du produit" size={88} />
        </div>

        <div className="flex flex-col gap-4">
          <TextInput id="np-name" label="Nom du produit" value={name} onChange={setName} placeholder="Elixir Ultime Huile 100ml" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Marque"
              value={brand}
              onChange={setBrand}
              options={PRODUCT_BRANDS.map((b) => ({ value: b.id, label: b.name }))}
            />
            <TextInput id="np-gamme" label="Gamme (facultatif)" value={gamme} onChange={setGamme} placeholder="Nutritive" />
          </div>
        </div>

        <section>
          <h3 className="text-[15px] font-semibold text-base-content">À quoi sert ce produit ?</h3>
          <div role="radiogroup" aria-label="Usage du produit" className="mt-2.5 grid grid-cols-3 gap-2">
            {PRODUCT_USAGE_OPTIONS.map((o) => {
              const checked = usage === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setUsage(o.value)}
                  className={cn(
                    "rounded-field border px-3 py-2.5 text-left transition",
                    checked ? "border-primary bg-accent" : "border-base-300 bg-base-100 hover:bg-base-200",
                  )}
                >
                  <span className="block text-sm font-semibold text-base-content">{o.label}</span>
                  <span className="text-xs leading-snug text-base-content/60">{o.hint}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {sells && (
              <TextInput
                id="np-price"
                label="Prix de vente (FCFA)"
                inputMode="numeric"
                value={price}
                onChange={setPrice}
                placeholder="25000"
                hint={digitsToInt(price) > 0 ? fcfa(digitsToInt(price)) : undefined}
              />
            )}
            {serves && (
              <SelectField label="Unité dans les recettes" value={unit} onChange={setUnit} options={RECIPE_UNIT_OPTIONS} />
            )}
          </div>
        </section>

        <section>
          <h3 className="text-[15px] font-semibold text-base-content">Stock de départ</h3>
          <p className="mt-0.5 text-xs text-base-content/60">En unités. Laissez vide ce qui n&apos;est pas encore arrivé.</p>
          <div className="mt-3 overflow-hidden rounded-box border border-base-300">
            <div
              className={cn(
                "grid items-center gap-3 border-b border-base-300 bg-base-200 px-4 py-2 text-xs font-medium text-base-content/60",
                sells && serves ? "grid-cols-[minmax(0,1fr)_120px_120px]" : "grid-cols-[minmax(0,1fr)_120px]",
              )}
            >
              <span>Emplacement</span>
              {sells && <span>Stock vente</span>}
              {serves && <span>Stock prestations</span>}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_252px] items-center gap-3 border-b border-base-300 px-4 py-2.5">
              <span>
                <span className="block text-sm font-medium text-base-content">Réserve centrale</span>
                <span className="text-xs text-base-content/55">Un seul stock, réparti au transfert vers un salon</span>
              </span>
              <span className={cn(sells && serves ? "" : "ml-auto w-[120px]")}>
                <QtyInput label="Réserve centrale" value={reserve} onChange={setReserve} />
              </span>
            </div>
            {salons.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "grid items-center gap-3 border-b border-base-300 px-4 py-2.5 last:border-b-0",
                  sells && serves ? "grid-cols-[minmax(0,1fr)_120px_120px]" : "grid-cols-[minmax(0,1fr)_120px]",
                )}
              >
                <span className="text-sm font-medium text-base-content">{s.name}</span>
                {sells && (
                  <QtyInput label={`${s.name} — stock vente`} value={bySalon[s.id].vente} onChange={(v) => setSalonQty(s.id, "vente", v)} />
                )}
                {serves && (
                  <QtyInput
                    label={`${s.name} — stock prestations`}
                    value={bySalon[s.id].prestations}
                    onChange={(v) => setSalonQty(s.id, "prestations", v)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[15px] font-semibold text-base-content">Alertes</h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <TextInput id="np-min" label="Seuil par salon" inputMode="numeric" value={salonMin} onChange={setSalonMin} />
            <TextInput id="np-company" label="Seuil entreprise" inputMode="numeric" value={companyMin} onChange={setCompanyMin} />
            <TextInput id="np-lead" label="Délai fournisseur (jours)" inputMode="numeric" value={leadDays} onChange={setLeadDays} />
          </div>
        </section>

        <div className="flex items-center gap-3 border-t border-base-300 pt-5">
          <button type="button" className={btnPrimary} disabled={Boolean(missing)} onClick={submit}>
            Ajouter le produit
          </button>
          <button type="button" className={btnGhost} onClick={onClose}>
            Annuler
          </button>
          {missing && <span className="text-sm text-base-content/60">{missing}.</span>}
        </div>
      </div>
    </DetailModal>
  );
}

function QtyInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      placeholder="0"
      className="h-10 w-full rounded-field border border-base-300 bg-base-100 px-3 text-right text-sm tabular-nums text-base-content focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
    />
  );
}
