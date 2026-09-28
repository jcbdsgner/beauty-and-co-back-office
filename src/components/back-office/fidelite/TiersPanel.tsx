"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";
import { multiplier, points as fmtPoints, type LoyaltyTier } from "@/lib/mock/fidelite";
import { TextInput } from "./ui";
import {
  EditorPanel,
  EmptyRow,
  ItemHeader,
  ItemRow,
  SettingsGroup,
  btnOutline,
} from "../reglages/kit";

// Réglages › Programme de fidélité › paliers : liste triée par seuil, ajout et
// modification en panneau latéral.

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
  // `undefined` = panneau fermé, `null` = création, id = modification.
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY);

  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  const valid = form.name.trim().length > 0 && isInt(form.minPoints) && isInt(form.multiplierPct);

  const open = (t?: LoyaltyTier) => {
    setEditing(t ? t.id : null);
    setForm(
      t ? { name: t.name, minPoints: String(t.minPoints), multiplierPct: String(t.multiplierPct) } : EMPTY,
    );
  };

  const submit = () => {
    if (!valid) return;
    const next: LoyaltyTier = {
      id: editing ?? uid(),
      name: form.name.trim(),
      minPoints: Number(form.minPoints),
      multiplierPct: Number(form.multiplierPct),
      // Garde la teinte de badge d'un palier existant (paliers de point-de-vente).
      badge: tiers.find((t) => t.id === editing)?.badge,
    };
    onChange(editing ? tiers.map((t) => (t.id === editing ? next : t)) : [...tiers, next]);
    setEditing(undefined);
  };

  const pct = Number(form.multiplierPct);

  return (
    <SettingsGroup
      title="Paliers"
      description="Chaque palier multiplie les points gagnés à partir d'un total cumulé. En dessous du premier, les clientes cumulent au taux de base."
      action={
        <button type="button" onClick={() => open()} className={`${btnOutline} gap-1.5`}>
          <Plus className="size-4" aria-hidden />
          Ajouter un palier
        </button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyRow>Aucun palier : toutes les clientes cumulent au taux de base (×1,00).</EmptyRow>
      ) : (
        <>
          <ItemHeader label="Palier" columns={["À partir de", "Multiplicateur"]} />
          {sorted.map((t) => (
            <ItemRow
              key={t.id}
              title={
                t.badge ? (
                  <Badge variant={t.badge} className="align-middle">
                    {t.name}
                  </Badge>
                ) : (
                  t.name
                )
              }
              columns={[fmtPoints(t.minPoints), multiplier(t.multiplierPct)]}
              onEdit={() => open(t)}
              onDelete={() => onChange(tiers.filter((x) => x.id !== t.id))}
              deleteLabel={`Supprimer le palier ${t.name}`}
            />
          ))}
        </>
      )}

      <EditorPanel
        open={editing !== undefined}
        title={editing ? "Modifier le palier" : "Nouveau palier"}
        onClose={() => setEditing(undefined)}
        onSubmit={submit}
        submitLabel={editing ? "Enregistrer" : "Ajouter le palier"}
        canSubmit={valid}
      >
        <TextInput
          label="Nom"
          placeholder="Gold"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <TextInput
          label="À partir de (points cumulés)"
          inputMode="numeric"
          placeholder="500"
          value={form.minPoints}
          onChange={(v) => setForm((f) => ({ ...f, minPoints: v }))}
        />
        <TextInput
          label="Multiplicateur (%)"
          inputMode="numeric"
          placeholder="150"
          value={form.multiplierPct}
          onChange={(v) => setForm((f) => ({ ...f, multiplierPct: v }))}
          hint={
            isInt(form.multiplierPct)
              ? `Les clientes de ce palier gagnent ${multiplier(pct)} les points de base.`
              : "100 = ×1,00 (taux de base), 150 = ×1,50."
          }
        />
      </EditorPanel>
    </SettingsGroup>
  );
}
