"use client";

import { useState } from "react";
import {
  multiplier,
  points as fmtPoints,
  type LoyaltyTier,
} from "@/lib/mock/fidelite";
import {
  SectionCard,
  TextInput,
  EditableRow,
  EmptyList,
  btnPrimary,
  btnGhost,
} from "./ui";

let seq = 0;
const uid = () => `tier-${Date.now()}-${seq++}`;

type FormState = { name: string; minPoints: string; multiplierPct: string };
const EMPTY: FormState = { name: "", minPoints: "", multiplierPct: "100" };

const isInt = (raw: string) => raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) >= 0;

export default function TiersPanel({
  tiers,
  onChange,
}: {
  tiers: LoyaltyTier[];
  onChange: (next: LoyaltyTier[]) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);

  const valid =
    form.name.trim().length > 0 && isInt(form.minPoints) && isInt(form.multiplierPct);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = () => {
    if (!valid) return;
    const next: LoyaltyTier = {
      id: editingId ?? uid(),
      name: form.name.trim(),
      minPoints: Number(form.minPoints),
      multiplierPct: Number(form.multiplierPct),
    };
    onChange(
      editingId ? tiers.map((t) => (t.id === editingId ? next : t)) : [...tiers, next],
    );
    resetForm();
  };

  const startEdit = (t: LoyaltyTier) => {
    setConfirmId(null);
    setEditingId(t.id);
    setForm({
      name: t.name,
      minPoints: String(t.minPoints),
      multiplierPct: String(t.multiplierPct),
    });
  };

  const remove = (id: string) => {
    onChange(tiers.filter((t) => t.id !== id));
    setConfirmId(null);
    if (editingId === id) resetForm();
  };

  return (
    <SectionCard
      title="Paliers"
      description="Carte de fidélité : chaque palier applique un multiplicateur de points à partir d'un total cumulé. En dessous du premier palier, l'accumulation se fait au taux de base (×1,00)."
    >
      {sorted.length === 0 ? (
        <EmptyList>
          Aucun palier pour l&apos;instant. Toutes les clientes accumulent au taux de base.
        </EmptyList>
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((t) => (
            <EditableRow
              key={t.id}
              title={t.name}
              subtitle={`À partir de ${fmtPoints(t.minPoints)} · ${multiplier(t.multiplierPct)}`}
              confirming={confirmId === t.id}
              onEdit={() => startEdit(t)}
              onAskDelete={() => setConfirmId(t.id)}
              onConfirmDelete={() => remove(t.id)}
              onCancelDelete={() => setConfirmId(null)}
              deleteLabel={`Supprimer le palier ${t.name}`}
            />
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="text-theme-sm font-semibold text-gray-800">
          {editingId ? "Modifier le palier" : "Ajouter un palier"}
        </h3>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_150px_150px] items-start gap-3">
          <TextInput
            label="Nom"
            placeholder="Argent"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <TextInput
            label="Points min."
            inputMode="numeric"
            placeholder="0"
            value={form.minPoints}
            onChange={(v) => setForm((f) => ({ ...f, minPoints: v }))}
          />
          <TextInput
            label="Multiplicateur %"
            inputMode="numeric"
            placeholder="100"
            value={form.multiplierPct}
            onChange={(v) => setForm((f) => ({ ...f, multiplierPct: v }))}
          />
        </div>
        <p className="mt-2 text-theme-xs text-gray-500">
          Multiplicateur en pourcentage du taux de base : 100 = ×1,00, 150 = ×1,50.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={submit} disabled={!valid} className={btnPrimary}>
            {editingId ? "Enregistrer" : "Ajouter le palier"}
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
