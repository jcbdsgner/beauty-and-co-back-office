"use client";

import { useState } from "react";
import { fcfa } from "@/lib/mock/beautyandco";
import {
  CYCLE_PRESETS,
  getForfaitPrestations,
  newForfaitId,
  type Forfait,
} from "@/lib/mock/forfaits";
import { Plus } from "lucide-react";
import { TextInput, SelectField } from "./ui";
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
  // `undefined` = panneau fermé, `null` = création, id = modification.
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);

  const isCustomCycle = form.cyclePreset === "custom";
  const valid =
    form.label.trim().length > 0 &&
    isInt(form.priceFcfa) &&
    isInt(form.cycleDays) &&
    form.prestationIds.length > 0;

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(undefined);
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

  const remove = (id: string) => onChange(forfaits.filter((f) => f.id !== id));

  return (
    <SettingsGroup
      title="Forfaits d'abonnement"
      description="Des prestations rechargées à chaque cycle, à un prix que vous fixez librement."
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
          Ajouter un forfait
        </button>
      }
    >
      {forfaits.length === 0 ? (
        <EmptyRow>Aucun forfait : les clientes ne peuvent souscrire à aucun abonnement.</EmptyRow>
      ) : (
        <>
          <ItemHeader label="Forfait" columns={["Cycle", "Prix"]} />
          {forfaits.map((f) => (
            <ItemRow
              key={f.id}
              title={f.label}
              meta={getForfaitPrestations(f)
                .map((p) => p.label)
                .join(" · ")}
              columns={[f.cycleLabel, fcfa(f.priceFcfa)]}
              onEdit={() => startEdit(f)}
              onDelete={() => remove(f.id)}
              deleteLabel={`Supprimer le forfait ${f.label}`}
            />
          ))}
        </>
      )}

      <EditorPanel
        open={editingId !== undefined}
        title={editingId ? "Modifier le forfait" : "Nouveau forfait"}
        onClose={resetForm}
        onSubmit={submit}
        submitLabel={editingId ? "Enregistrer" : "Ajouter le forfait"}
        canSubmit={valid}
      >
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
        <TextInput
          label="Prix (FCFA)"
          inputMode="numeric"
          placeholder="65000"
          hint="Prix libre, jamais calculé sur la somme des prestations."
          value={form.priceFcfa}
          onChange={(v) => setForm((f) => ({ ...f, priceFcfa: v }))}
        />
        <div className="grid grid-cols-[minmax(0,1fr)_140px] items-start gap-3">
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
      </EditorPanel>
    </SettingsGroup>
  );
}
