"use client";

import { useState } from "react";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  getPackIndividualTotal,
  getPackPrestations,
  getPackPrice,
  getPackSavings,
  newPackId,
  type Pack,
} from "@/lib/mock/packs";
import {
  SectionCard,
  TextInput,
  EditableRow,
  EmptyList,
  Toggle,
  SettingRow,
  btnPrimary,
  btnGhost,
} from "./ui";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const preview = previewDerived(form.prestationIds);
  const valid =
    form.label.trim().length > 0 &&
    form.prestationIds.length > 0 &&
    (!form.forcePrice || isInt(form.priceOverrideFcfa));

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
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
    setConfirmId(null);
    setEditingId(p.id);
    setForm({
      label: p.label,
      description: p.description,
      prestationIds: [...p.prestationIds],
      forcePrice: p.priceOverrideFcfa != null,
      priceOverrideFcfa: p.priceOverrideFcfa != null ? String(p.priceOverrideFcfa) : "",
    });
  };

  const remove = (id: string) => {
    onChange(packs.filter((p) => p.id !== id));
    setConfirmId(null);
    if (editingId === id) resetForm();
  };

  return (
    <SectionCard
      title="Packs prépayés"
      description="Un pack : des prestations payées d'avance, consommées visite après visite. Il n'expire jamais et ne se recharge pas. Prix = −20 % sur la somme à l'unité, arrondi à 500 FCFA."
    >
      {packs.length === 0 ? (
        <EmptyList>Aucun pack proposé.</EmptyList>
      ) : (
        <ul className="space-y-2.5">
          {packs.map((p) => {
            const price = getPackPrice(p);
            const savings = getPackSavings(p);
            const names = getPackPrestations(p).map((x) => x.label).join(", ");
            return (
              <EditableRow
                key={p.id}
                title={`${p.label} · ${fcfa(price)}${
                  p.priceOverrideFcfa != null ? " (prix forcé)" : ""
                }`}
                subtitle={
                  savings > 0
                    ? `${names} · ${fcfa(getPackIndividualTotal(p))} à l'unité, soit ${fcfa(savings)} d'économie`
                    : names
                }
                confirming={confirmId === p.id}
                onEdit={() => startEdit(p)}
                onAskDelete={() => setConfirmId(p.id)}
                onConfirmDelete={() => remove(p.id)}
                onCancelDelete={() => setConfirmId(null)}
                deleteLabel={`Supprimer le pack ${p.label}`}
              />
            );
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="text-theme-sm font-semibold text-gray-800">
          {editingId ? "Modifier le pack" : "Ajouter un pack"}
        </h3>

        <div className="mt-4 space-y-3">
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

          <div className="rounded-xl bg-gray-50 px-4 py-3 text-theme-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span>Somme à l&apos;unité</span>
              <span className="tabular-nums">{fcfa(preview.total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-medium text-gray-800">
              <span>Prix packagé (−20 %)</span>
              <span className="tabular-nums">{fcfa(preview.packaged)}</span>
            </div>
          </div>

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
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={submit} disabled={!valid} className={btnPrimary}>
            {editingId ? "Enregistrer" : "Ajouter le pack"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className={btnGhost}>
              Annuler
            </button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
