"use client";

import { useState } from "react";
import {
  REWARD_TYPE_OPTIONS,
  points as fmtPoints,
  rewardValueLabel,
  type LoyaltyReward,
  type RewardType,
} from "@/lib/mock/fidelite";
import {
  SectionCard,
  TextInput,
  SelectField,
  EditableRow,
  EmptyList,
  btnPrimary,
  btnGhost,
} from "./ui";

let seq = 0;
const uid = () => `reward-${Date.now()}-${seq++}`;

type FormState = {
  name: string;
  costPoints: string;
  type: RewardType;
  value: string;
  description: string;
};

const EMPTY: FormState = {
  name: "",
  costPoints: "",
  type: "fixed",
  value: "0",
  description: "",
};

const isInt = (raw: string) => raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) >= 0;

export default function RewardsPanel({
  rewards,
  onChange,
}: {
  rewards: LoyaltyReward[];
  onChange: (next: LoyaltyReward[]) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const valid =
    form.name.trim().length > 0 && isInt(form.costPoints) && isInt(form.value);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = () => {
    if (!valid) return;
    const next: LoyaltyReward = {
      id: editingId ?? uid(),
      name: form.name.trim(),
      costPoints: Number(form.costPoints),
      type: form.type,
      value: Number(form.value),
      description: form.description.trim() || undefined,
    };
    onChange(
      editingId
        ? rewards.map((r) => (r.id === editingId ? next : r))
        : [...rewards, next],
    );
    resetForm();
  };

  const startEdit = (r: LoyaltyReward) => {
    setConfirmId(null);
    setEditingId(r.id);
    setForm({
      name: r.name,
      costPoints: String(r.costPoints),
      type: r.type,
      value: String(r.value),
      description: r.description ?? "",
    });
  };

  const remove = (id: string) => {
    onChange(rewards.filter((r) => r.id !== id));
    setConfirmId(null);
    if (editingId === id) resetForm();
  };

  return (
    <SectionCard
      title="Catalogue de récompenses"
      description="Ce que les clientes peuvent échanger contre leurs points."
    >
      {rewards.length === 0 ? (
        <EmptyList>
          Aucune récompense. Les clientes accumulent des points mais n&apos;ont rien à échanger.
        </EmptyList>
      ) : (
        <ul className="space-y-2.5">
          {rewards.map((r) => (
            <EditableRow
              key={r.id}
              title={r.name}
              subtitle={`${fmtPoints(r.costPoints)} · ${rewardValueLabel(r)}${
                r.description ? ` · ${r.description}` : ""
              }`}
              confirming={confirmId === r.id}
              onEdit={() => startEdit(r)}
              onAskDelete={() => setConfirmId(r.id)}
              onConfirmDelete={() => remove(r.id)}
              onCancelDelete={() => setConfirmId(null)}
              deleteLabel={`Supprimer la récompense ${r.name}`}
            />
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="text-theme-sm font-semibold text-gray-800">
          {editingId ? "Modifier la récompense" : "Ajouter une récompense"}
        </h3>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_150px_200px] items-start gap-3">
          <TextInput
            label="Nom"
            placeholder="−2000 FCFA"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <TextInput
            label="Coût (points)"
            inputMode="numeric"
            placeholder="100"
            value={form.costPoints}
            onChange={(v) => setForm((f) => ({ ...f, costPoints: v }))}
          />
          <SelectField
            label="Type"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            options={REWARD_TYPE_OPTIONS}
          />
        </div>

        <div className="mt-3 grid grid-cols-[200px_minmax(0,1fr)] items-start gap-3">
          <TextInput
            label="Valeur (FCFA ou %)"
            inputMode="numeric"
            placeholder="0"
            value={form.value}
            onChange={(v) => setForm((f) => ({ ...f, value: v }))}
          />
          <TextInput
            label="Description"
            placeholder="Facultatif"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={submit} disabled={!valid} className={btnPrimary}>
            {editingId ? "Enregistrer" : "Ajouter la récompense"}
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
