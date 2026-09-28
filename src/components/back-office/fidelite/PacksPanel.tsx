"use client";

import { useState } from "react";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  getPackIndividualTotal,
  getPackPrestations,
  getPackPrice,
  newPackId,
  type Pack,
} from "@/lib/mock/packs";
import { Plus } from "lucide-react";
import { TextInput, Toggle, SettingRow } from "./ui";
import {
  EditorPanel,
  EmptyRow,
  ItemHeader,
  ItemRow,
  SettingsGroup,
  btnOutline,
} from "../reglages/kit";
import PrestationPicker from "./PrestationPicker";

type FormState = {
  label: string;
  description: string;
  prestationIds: string[];
  forcePrice: boolean;
  priceOverrideFcfa: string;
};

const EMPTY: FormState = {
  label: "",
  description: "",
  prestationIds: [],
  forcePrice: false,
  priceOverrideFcfa: "",
};

const isInt = (raw: string) =>
  raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) > 0;

// Aperçu du prix dérivé pendant la saisie — un pack éphémère passé aux helpers
// pour garder la formule au même endroit (`getPackPrice`).
const previewDerived = (ids: string[]) => {
  const draft: Pack = {
    id: "",
    label: "",
    description: "",
    prestationIds: ids,
    priceOverrideFcfa: null,
  };
  return { total: getPackIndividualTotal(draft), packaged: getPackPrice(draft) };
};

export default function PacksPanel({
  packs,
  onChange,
}: {
  packs: Pack[];
  onChange: (next: Pack[]) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  // `undefined` = panneau fermé, `null` = création, id = modification.
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);

  const preview = previewDerived(form.prestationIds);
  const valid =
    form.label.trim().length > 0 &&
    form.prestationIds.length > 0 &&
    (!form.forcePrice || isInt(form.priceOverrideFcfa));

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(undefined);
  };

  const submit = () => {
    if (!valid) return;
    const next: Pack = {
      id: editingId ?? newPackId(),
      label: form.label.trim(),
      description: form.description.trim(),
      prestationIds: form.prestationIds,
      priceOverrideFcfa: form.forcePrice ? Number(form.priceOverrideFcfa) : null,
    };
    onChange(
      editingId ? packs.map((p) => (p.id === editingId ? next : p)) : [...packs, next],
    );
    resetForm();
  };

  const startEdit = (p: Pack) => {
    setEditingId(p.id);
    setForm({
      label: p.label,
      description: p.description,
      prestationIds: [...p.prestationIds],
      forcePrice: p.priceOverrideFcfa != null,
      priceOverrideFcfa: p.priceOverrideFcfa != null ? String(p.priceOverrideFcfa) : "",
    });
  };

  const remove = (id: string) => onChange(packs.filter((p) => p.id !== id));

  return (
    <SettingsGroup
      title="Packs prépayés"
      description="Des prestations payées d'avance, consommées visite après visite. Sans expiration ni recharge. Prix : −20 % sur la somme à l'unité, arrondi à 500 FCFA."
      action={
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setEditingId(null);
          }}
          className={`${btnOutline} gap-1.5`}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter un pack
        </button>
      }
    >
      {packs.length === 0 ? (
        <EmptyRow>Aucun pack proposé.</EmptyRow>
      ) : (
        <>
          <ItemHeader label="Pack" columns={["À l'unité", "Prix du pack"]} />
          {packs.map((p) => (
            <ItemRow
              key={p.id}
              title={p.label}
              meta={getPackPrestations(p)
                .map((x) => x.label)
                .join(" · ")}
              columns={[
                <span key="u" className="text-base-content/50 line-through decoration-base-content/30">
                  {fcfa(getPackIndividualTotal(p))}
                </span>,
                <span key="p" className="font-semibold text-base-content">
                  {fcfa(getPackPrice(p))}
                  {p.priceOverrideFcfa != null && (
                    <span className="block text-xs font-normal text-base-content/50">prix forcé</span>
                  )}
                </span>,
              ]}
              onEdit={() => startEdit(p)}
              onDelete={() => remove(p.id)}
              deleteLabel={`Supprimer le pack ${p.label}`}
            />
          ))}
        </>
      )}

      <EditorPanel
        open={editingId !== undefined}
        title={editingId ? "Modifier le pack" : "Nouveau pack"}
        onClose={resetForm}
        onSubmit={submit}
        submitLabel={editingId ? "Enregistrer" : "Ajouter le pack"}
        canSubmit={valid}
      >
        <TextInput
          label="Nom"
          placeholder="Pack Éclat Express"
          value={form.label}
          onChange={(v) => setForm((f) => ({ ...f, label: v }))}
        />
        <TextInput
          label="Description"
          placeholder="Ce que contient le pack, en une phrase"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
        />
        <PrestationPicker
          selected={form.prestationIds}
          onChange={(ids) => setForm((f) => ({ ...f, prestationIds: ids }))}
        />
        <dl className="space-y-1.5 rounded-box bg-base-200 px-4 py-3 text-sm">
          <div className="flex justify-between text-base-content/60">
            <dt>Somme à l&apos;unité</dt>
            <dd className="tabular-nums">{fcfa(preview.total)}</dd>
          </div>
          <div className="flex justify-between font-semibold text-base-content">
            <dt>Prix du pack (−20 %)</dt>
            <dd className="tabular-nums">{fcfa(preview.packaged)}</dd>
          </div>
        </dl>
        <SettingRow
          title="Forcer un prix"
          description="Ignorer la formule et fixer le prix du pack à la main."
          control={
            <Toggle
              checked={form.forcePrice}
              onChange={(v) => setForm((f) => ({ ...f, forcePrice: v }))}
              aria-label="Forcer un prix pour le pack"
            />
          }
        />
        {form.forcePrice && (
          <TextInput
            label="Prix forcé (FCFA)"
            inputMode="numeric"
            placeholder={String(preview.packaged)}
            value={form.priceOverrideFcfa}
            onChange={(v) => setForm((f) => ({ ...f, priceOverrideFcfa: v }))}
          />
        )}
      </EditorPanel>
    </SettingsGroup>
  );
}
