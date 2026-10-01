"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { fcfa, groupThousands } from "@/lib/mock/beautyandco";
import { foldZoneName, newDeliveryZoneId, type DeliveryZone } from "@/lib/mock/livraison";
import { TextInput } from "../fidelite/ui";
import { EditorPanel, EmptyRow, ItemHeader, ItemRow, SettingsGroup, UnitInput, btnOutline } from "./kit";

// Réglages › Livraison (2026-10-01) — quartiers où une carte cadeau peut être
// livrée et prix de la livraison dans chacun.
//
// 1. Où en est la propriétaire ? En pilotage, rarement : elle ouvre un
//    nouveau quartier ou ajuste un tarif.
// 2. Ce qui doit sauter aux yeux : la liste des quartiers et leur prix,
//    triée par nom.
// 3. Cas dégradés : aucun quartier → la livraison n'est proposée nulle part
//    (dit en toutes lettres) ; nom vide, en double ou prix non entier →
//    ajout bloqué avec le motif.

type FormState = { name: string; price: string };
const EMPTY: FormState = { name: "", price: "" };

export default function LivraisonPanel({
  zones,
  onChange,
}: {
  zones: DeliveryZone[];
  onChange: (next: DeliveryZone[]) => void;
}) {
  // `undefined` = panneau fermé, `null` = création, id = modification.
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY);

  const sorted = [...zones].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const priceDigits = form.price.replace(/\D/g, "");
  const duplicate = zones.some((z) => z.id !== editing && foldZoneName(z.name) === foldZoneName(form.name));
  const problem =
    form.name.trim() === ""
      ? "Indiquez le nom du quartier."
      : duplicate
        ? "Ce quartier est déjà dans la liste."
        : priceDigits === ""
          ? "Indiquez le prix de la livraison (0 si elle est offerte)."
          : null;

  const open = (z?: DeliveryZone) => {
    setEditing(z ? z.id : null);
    setForm(z ? { name: z.name, price: String(z.priceFcfa) } : EMPTY);
  };

  const submit = () => {
    if (problem) return;
    const next: DeliveryZone = { id: editing ?? newDeliveryZoneId(), name: form.name.trim(), priceFcfa: Number(priceDigits) };
    onChange(editing ? zones.map((z) => (z.id === editing ? next : z)) : [...zones, next]);
    setEditing(undefined);
  };

  return (
    <SettingsGroup
      title="Quartiers de livraison"
      description="Les cartes cadeaux peuvent être livrées dans ces quartiers. Le prix s'ajoute à la commande de la cliente."
      action={
        <button type="button" onClick={() => open()} className={`${btnOutline} gap-1.5`}>
          <Plus className="size-4" aria-hidden />
          Ajouter un quartier
        </button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyRow>Aucun quartier : la livraison des cartes cadeaux n&apos;est proposée nulle part.</EmptyRow>
      ) : (
        <>
          <ItemHeader label="Quartier" columns={["Prix de la livraison"]} />
          {sorted.map((z) => (
            <ItemRow
              key={z.id}
              title={z.name}
              columns={[z.priceFcfa === 0 ? "Offerte" : fcfa(z.priceFcfa)]}
              onEdit={() => open(z)}
              onDelete={() => onChange(zones.filter((x) => x.id !== z.id))}
              deleteLabel={`Supprimer le quartier ${z.name}`}
            />
          ))}
        </>
      )}

      <EditorPanel
        open={editing !== undefined}
        title={editing ? "Modifier le quartier" : "Nouveau quartier"}
        onClose={() => setEditing(undefined)}
        onSubmit={submit}
        submitLabel={editing ? "Enregistrer" : "Ajouter le quartier"}
        canSubmit={!problem}
      >
        <TextInput
          label="Quartier"
          placeholder="Mermoz"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <div>
          <label htmlFor="livraison-prix" className="mb-1.5 block text-sm font-medium text-base-content">
            Prix de la livraison
          </label>
          <UnitInput
            id="livraison-prix"
            unit="FCFA"
            placeholder="2.000"
            value={priceDigits === "" ? "" : groupThousands(Number(priceDigits))}
            onChange={(v) => setForm((f) => ({ ...f, price: v }))}
          />
          <p className="mt-1.5 text-sm text-base-content/55">0 = livraison offerte.</p>
        </div>
        {problem && form.name.trim() !== "" && <p className="text-sm text-error-600">{problem}</p>}
      </EditorPanel>
    </SettingsGroup>
  );
}
