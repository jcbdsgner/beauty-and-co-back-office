"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  REWARD_TYPE_OPTIONS,
  points as fmtPoints,
  rewardValueLabel,
  type LoyaltyReward,
  type RewardType,
} from "@/lib/mock/fidelite";
import { SelectField, TextInput } from "./ui";
import RewardItemPicker from "./RewardItemPicker";
import {
  EditorPanel,
  EmptyRow,
  ItemHeader,
  ItemRow,
  SettingsGroup,
  btnOutline,
} from "../reglages/kit";

// Réglages › Programme de fidélité › récompenses : liste, ajout et
// modification en panneau latéral.

let seq = 0;
const uid = () => `reward-${Date.now()}-${seq++}`;

type FormState = {
  name: string;
  costPoints: string;
  type: RewardType;
  value: string;
  itemId: string | null;
  // Dernier nom proposé d'office : tant que « Nom » vaut encore ça, il suit le choix.
  autoName: string;
  description: string;
};

const EMPTY: FormState = { name: "", costPoints: "", type: "fixed", value: "", itemId: null, autoName: "", description: "" };

const isGift = (t: RewardType): t is "service" | "product" => t === "service" || t === "product";

const isInt = (raw: string) => raw.trim() !== "" && Number.isInteger(Number(raw)) && Number(raw) >= 0;

export default function RewardsPanel({
  rewards,
  onChange,
}: {
  rewards: LoyaltyReward[];
  onChange: (next: LoyaltyReward[]) => void;
}) {
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY);

  // Une prestation / un produit offert se choisit dans le catalogue, sans valeur à saisir.
  const valid =
    form.name.trim().length > 0 &&
    isInt(form.costPoints) &&
    (isGift(form.type) ? form.itemId !== null : isInt(form.value));
  const sorted = [...rewards].sort((a, b) => a.costPoints - b.costPoints);

  const open = (r?: LoyaltyReward) => {
    setEditing(r ? r.id : null);
    setForm(
      r
        ? {
            name: r.name,
            costPoints: String(r.costPoints),
            type: r.type,
            value: isGift(r.type) ? "" : String(r.value),
            itemId: r.itemId ?? null,
            autoName: "",
            description: r.description ?? "",
          }
        : EMPTY,
    );
  };

  const submit = () => {
    if (!valid) return;
    const next: LoyaltyReward = {
      id: editing ?? uid(),
      name: form.name.trim(),
      costPoints: Number(form.costPoints),
      type: form.type,
      value: isGift(form.type) ? 0 : Number(form.value),
      itemId: isGift(form.type) ? (form.itemId ?? undefined) : undefined,
      description: form.description.trim() || undefined,
    };
    onChange(editing ? rewards.map((r) => (r.id === editing ? next : r)) : [...rewards, next]);
    setEditing(undefined);
  };

  const valueLabel = form.type === "percent" ? "Remise (%)" : "Remise (FCFA)";

  return (
    <SettingsGroup
      title="Récompenses"
      description="Ce que les clientes peuvent échanger contre leurs points."
      action={
        <button type="button" onClick={() => open()} className={`${btnOutline} gap-1.5`}>
          <Plus className="size-4" aria-hidden />
          Ajouter une récompense
        </button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyRow>Aucune récompense : les clientes cumulent des points sans rien pouvoir échanger.</EmptyRow>
      ) : (
        <>
          <ItemHeader label="Récompense" columns={["Coût", "Valeur"]} />
          {sorted.map((r) => (
            <ItemRow
              key={r.id}
              title={r.name}
              meta={r.description}
              columns={[fmtPoints(r.costPoints), rewardValueLabel(r)]}
              onEdit={() => open(r)}
              onDelete={() => onChange(rewards.filter((x) => x.id !== r.id))}
              deleteLabel={`Supprimer la récompense ${r.name}`}
            />
          ))}
        </>
      )}

      <EditorPanel
        open={editing !== undefined}
        title={editing ? "Modifier la récompense" : "Nouvelle récompense"}
        onClose={() => setEditing(undefined)}
        onSubmit={submit}
        submitLabel={editing ? "Enregistrer" : "Ajouter la récompense"}
        canSubmit={valid}
      >
        <TextInput
          label="Nom"
          placeholder="Remise de 2.000 FCFA"
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
          onChange={(v) =>
            // Changer entre prestation et produit vide le choix : les catalogues diffèrent.
            setForm((f) =>
              v === f.type
                ? f
                : { ...f, type: v, itemId: null, name: f.name === f.autoName ? "" : f.name, autoName: "" },
            )
          }
          options={REWARD_TYPE_OPTIONS}
        />
        {isGift(form.type) ? (
          <RewardItemPicker
            key={form.type}
            kind={form.type}
            value={form.itemId}
            // Nom proposé d'office tant qu'il n'a pas été saisi.
            onChange={(id, name) =>
              setForm((f) => {
                const auto = `${name} offert${f.type === "service" ? "e" : ""}`;
                const keep = f.name.trim() !== "" && f.name !== f.autoName;
                return { ...f, itemId: id, name: keep ? f.name : auto, autoName: auto };
              })
            }
          />
        ) : (
          <TextInput
            label={valueLabel}
            inputMode="numeric"
            placeholder="0"
            value={form.value}
            onChange={(v) => setForm((f) => ({ ...f, value: v }))}
          />
        )}
        <TextInput
          label="Description (facultatif)"
          placeholder="Ce que la cliente reçoit, en une phrase"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
        />
      </EditorPanel>
    </SettingsGroup>
  );
}
