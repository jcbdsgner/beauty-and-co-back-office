"use client";

import { useState } from "react";
import { CupSoda } from "lucide-react";
import { Card } from "@/components/ui/atoms/card";
import { Badge } from "@/components/ui/atoms/badge";
import { EmptyState } from "@/components/ui/molecules/empty-state";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import { digitsToInt, fcfa, type Boisson } from "@/lib/mock/services";
import DetailModal from "../detail/DetailModal";
import ImagePicker from "../shared/ImagePicker";
import { TextInput, Toggle, btnGhost, btnPrimary } from "./ui";

// Onglet « Boissons » de `/services` (2026-09-27) — la carte du Bar Beauty &
// Co, famille à part : ni catégorie, ni sous-catégorie, ni stock, ni recette
// (comme `Boisson` de point-de-vente, ADR 0016). Ce que la propriétaire règle
// ici — nom, prix, composition, photo, disponibilité — est ce que la
// réservation en ligne (pré-commande) et la caisse affichent.

type Draft = Omit<Boisson, "id">;

const BLANK: Draft = { name: "", priceFcfa: 0, active: true, description: "", image: undefined };

function BoissonCard({ b, onOpen }: { b: Boisson; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-box border border-base-300 bg-white text-left transition hover:border-secondary"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-base-200">
        {b.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo locale ou dataURL de session
          <img src={b.image} alt="" className="size-full object-cover" />
        ) : (
          <CupSoda aria-hidden className="size-10 text-base-content/25" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-base-content group-hover:text-secondary">{b.name}</p>
          {!b.active && <Badge variant="neutral" className="badge-sm">Indisponible</Badge>}
        </div>
        {b.description && (
          <p className="line-clamp-2 text-sm text-base-content/60">{b.description}</p>
        )}
        <p className="mt-auto pt-2 text-sm font-semibold tabular-nums text-base-content">
          {fcfa(b.priceFcfa)}
        </p>
      </div>
    </button>
  );
}

function BoissonForm({
  boisson,
  onClose,
  onSave,
  onDelete,
}: {
  boisson: Boisson | null;
  onClose: () => void;
  onSave: (d: Draft) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(boisson ? { ...boisson } : BLANK);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const valid = draft.name.trim() !== "" && draft.priceFcfa > 0;

  return (
    <DetailModal
      title={boisson ? `Boisson · ${boisson.name}` : "Nouvelle boisson"}
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <div className="space-y-6">
        <div>
          <span className="mb-2 block text-sm font-medium text-base-content/70">Photo</span>
          <ImagePicker
            value={draft.image ?? null}
            onChange={(v) => set("image", v ?? undefined)}
            label="la photo de la boisson"
            size={96}
            fit="cover"
          />
        </div>
        <TextInput label="Nom" value={draft.name} onChange={(v) => set("name", v)} placeholder="Pure Glow" />
        <TextInput
          label="Prix (FCFA)"
          inputMode="numeric"
          value={draft.priceFcfa ? String(draft.priceFcfa) : ""}
          onChange={(v) => set("priceFcfa", digitsToInt(v))}
          hint={draft.priceFcfa ? fcfa(draft.priceFcfa) : undefined}
        />
        <Field label="Composition">
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Collagène, passion, orange amer…"
          />
        </Field>
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-medium text-base-content">Disponible</span>
            <span className="text-xs text-base-content/55">
              Une boisson indisponible n&apos;est plus proposée à la réservation ni en caisse.
            </span>
          </span>
          <Toggle checked={draft.active} onChange={(v) => set("active", v)} aria-label="Boisson disponible" />
        </label>

        <div className="flex items-center gap-2 border-t border-base-300 pt-6">
          <button
            type="button"
            disabled={!valid}
            onClick={() =>
              onSave({
                ...draft,
                name: draft.name.trim(),
                description: draft.description?.trim() || undefined,
              })
            }
            className={btnPrimary}
          >
            {boisson ? "Enregistrer" : "Ajouter la boisson"}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Annuler
          </button>
          {boisson &&
            (confirmDelete ? (
              <span className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-base-content/60">Supprimer ?</span>
                <button type="button" onClick={onDelete} className="font-semibold text-error hover:underline">
                  Oui
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-base-content/60 hover:underline">
                  Non
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="ml-auto text-sm text-base-content/55 hover:text-error"
              >
                Supprimer la boisson
              </button>
            ))}
        </div>
      </div>
    </DetailModal>
  );
}

export default function BoissonsPanel({
  boissons,
  editing,
  onOpen,
  onClose,
  onSave,
  onDelete,
}: {
  boissons: Boisson[];
  // `undefined` = aucun panneau ; `null` = création ; sinon l'id édité.
  editing: string | null | undefined;
  onOpen: (id: string) => void;
  onClose: () => void;
  onSave: (id: string | null, d: Draft) => void;
  onDelete: (id: string) => void;
}) {
  const current = editing ? boissons.find((b) => b.id === editing) ?? null : null;
  return (
    <>
      {boissons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CupSoda />}
            title="Aucune boisson à la carte"
            subtitle="Ajoutez les boissons du bar : elles seront proposées en pré-commande à la réservation."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {boissons.map((b) => (
            <BoissonCard key={b.id} b={b} onOpen={() => onOpen(b.id)} />
          ))}
        </div>
      )}
      {editing !== undefined && (
        <BoissonForm
          key={editing ?? "new"}
          boisson={current}
          onClose={onClose}
          onSave={(d) => onSave(editing, d)}
          onDelete={() => editing && onDelete(editing)}
        />
      )}
    </>
  );
}
