"use client";

import { useState } from "react";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  CYCLE_PRESETS,
  getForfaitPrestations,
  newForfaitId,
  type Forfait,
} from "@/lib/mock/forfaits";
import {
  SectionCard,
  TextInput,
  SelectField,
  EditableRow,
  EmptyList,
  btnPrimary,
  btnGhost,
} from "./ui";
import PrestationPicker from "./PrestationPicker";

type FormState = {
  label: string;
  description: string;
  priceFcfa: string;
  cyclePreset: string; // libellé du preset, ou "custom"
  cycleDays: string;
  prestationIds: string[];
};

const EMPTY: FormState = {
  label: "",
  description: "",
  priceFcfa: "",
  cyclePreset: CYCLE_PRESETS[0].label,
  cycleDays: String(CYCLE_PRESETS[0].days),
  prestationIds: [],
};

const isInt = (raw: string) =>
  raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) > 0;

const CYCLE_OPTIONS = CYCLE_PRESETS.map((c) => ({
  value: c.days == null ? "custom" : c.label,
  label: c.label,
}));

export default function ForfaitsPanel({
  forfaits,
  onChange,
}: {
  forfaits: Forfait[];
  onChange: (next: Forfait[]) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const isCustomCycle = form.cyclePreset === "custom";
  const valid =
    form.label.trim().length > 0 &&
    isInt(form.priceFcfa) &&
    isInt(form.cycleDays) &&
    form.prestationIds.length > 0;

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const pickCycle = (value: string) => {
    if (value === "custom") {
      setForm((f) => ({ ...f, cyclePreset: "custom" }));
      return;
    }
    const preset = CYCLE_PRESETS.find((c) => c.label === value);
    setForm((f) => ({
      ...f,
      cyclePreset: value,
      cycleDays: preset?.days != null ? String(preset.days) : f.cycleDays,
    }));
  };

  const submit = () => {
    if (!valid) return;
    const cycleLabel = isCustomCycle
      ? `Tous les ${form.cycleDays} jours`
      : form.cyclePreset;
    const next: Forfait = {
      id: editingId ?? newForfaitId(),
      label: form.label.trim(),
      description: form.description.trim(),
      priceFcfa: Number(form.priceFcfa),
      cycleLabel,
      cycleDays: Number(form.cycleDays),
      prestationIds: form.prestationIds,
    };
    onChange(
      editingId ? forfaits.map((f) => (f.id === editingId ? next : f)) : [...forfaits, next],
    );
    resetForm();
  };

  const startEdit = (f: Forfait) => {
    setConfirmId(null);
    setEditingId(f.id);
    const matchPreset = CYCLE_PRESETS.find(
      (c) => c.days === f.cycleDays && c.label === f.cycleLabel,
    );
    setForm({
      label: f.label,
      description: f.description,
      priceFcfa: String(f.priceFcfa),
      cyclePreset: matchPreset ? matchPreset.label : "custom",
      cycleDays: String(f.cycleDays),
      prestationIds: [...f.prestationIds],
    });
  };

  const remove = (id: string) => {
    onChange(forfaits.filter((f) => f.id !== id));
    setConfirmId(null);
    if (editingId === id) resetForm();
  };

  return (
    <SectionCard
      title="Forfaits d'abonnement"
      description="Un forfait : une liste fixe de prestations rechargée à chaque cycle, à un prix libre que vous décidez (jamais calculé sur la somme des prestations)."
    >
      {forfaits.length === 0 ? (
        <EmptyList>Aucun forfait. Les clientes ne peuvent souscrire à rien.</EmptyList>
      ) : (
        <ul className="space-y-2.5">
          {forfaits.map((f) => {
            const pres = getForfaitPrestations(f);
            return (
              <EditableRow
                key={f.id}
                title={`${f.label} · ${fcfa(f.priceFcfa)}`}
                subtitle={`${f.cycleLabel} · ${pres.map((p) => p.label).join(", ")}`}
                confirming={confirmId === f.id}
                onEdit={() => startEdit(f)}
                onAskDelete={() => setConfirmId(f.id)}
                onConfirmDelete={() => remove(f.id)}
                onCancelDelete={() => setConfirmId(null)}
                deleteLabel={`Supprimer le forfait ${f.label}`}
              />
            );
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="text-theme-sm font-semibold text-gray-800">
          {editingId ? "Modifier le forfait" : "Ajouter un forfait"}
        </h3>

        <div className="mt-4 space-y-3">
          <TextInput
            label="Nom"
            placeholder="Abonnement Éclat Mensuel"
            value={form.label}
            onChange={(v) => setForm((f) => ({ ...f, label: v }))}
          />
          <TextInput
            label="Description"
            placeholder="Ce que la cliente retient de l'offre"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />

          <div className="grid grid-cols-[200px_minmax(0,1fr)_140px] items-start gap-3">
            <TextInput
              label="Prix du forfait (FCFA)"
              inputMode="numeric"
              placeholder="65000"
              hint="Prix libre"
              value={form.priceFcfa}
              onChange={(v) => setForm((f) => ({ ...f, priceFcfa: v }))}
            />
            <SelectField
              label="Cycle de facturation"
              value={isCustomCycle ? "custom" : form.cyclePreset}
              onChange={pickCycle}
              options={CYCLE_OPTIONS}
            />
            <TextInput
              label="Durée (jours)"
              inputMode="numeric"
              placeholder="30"
              value={form.cycleDays}
              onChange={(v) => setForm((f) => ({ ...f, cycleDays: v }))}
            />
          </div>

          <PrestationPicker
            selected={form.prestationIds}
            onChange={(ids) => setForm((f) => ({ ...f, prestationIds: ids }))}
            showPricing={false}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={submit} disabled={!valid} className={btnPrimary}>
            {editingId ? "Enregistrer" : "Ajouter le forfait"}
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
