"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import { TrashBinIcon } from "@/icons";
import { salonName, type SalonId } from "@/lib/mock/beautyandco";
import { membersForPrestation } from "@/lib/mock/staff";
import {
  RESERVATION_MODE_OPTIONS,
  digitsToInt,
  durationLabel,
  fcfa,
  newId,
  reservationModeLabel,
  type Prestation,
  type RecipeItem,
  type ReservationMode,
} from "@/lib/mock/services";
import RecipeEditor from "./RecipeEditor";
import { SectionCard, SelectField, TextInput, Toggle, btnGhost, btnPrimary } from "./ui";

type Props = {
  serviceId: string;
  serviceSalonIds: SalonId[];
  prestations: Prestation[];
  onUpsert: (p: Prestation) => void;
  onDelete: (id: string) => void;
};

type Draft = {
  name: string;
  price: string;
  duration: string;
  active: boolean;
  recipe: RecipeItem[];
  salonIds: SalonId[];
  reservationMode: ReservationMode;
};

const draftOf = (serviceSalonIds: SalonId[], p?: Prestation): Draft => ({
  name: p?.name ?? "",
  price: p ? String(p.priceFcfa) : "",
  duration: p ? String(p.durationMin) : "",
  active: p?.active ?? true,
  recipe: p?.recipe ?? [],
  // `[]` en stock = héritée de tous les salons du parent → on coche tout.
  salonIds: p && p.salonIds.length > 0 ? p.salonIds : serviceSalonIds,
  reservationMode: p?.reservationMode ?? "both",
});

// Miroir en lecture seule : qui, dans l'équipe, sait réaliser cette prestation.
function RealiseePar({ prestationId }: { prestationId: string | null }) {
  const members = prestationId ? membersForPrestation(prestationId) : [];

  if (!prestationId) {
    return (
      <p className="text-theme-xs text-gray-500">
        La liste des praticiennes compétentes s&apos;affichera après l&apos;enregistrement.
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <Alert
        variant="warning"
        title="Aucune praticienne compétente"
        message="Personne dans l'équipe ne sait réaliser cette prestation. Ajoutez-lui cette compétence depuis Équipe, sinon elle restera non réservable."
        showLink
        linkHref="/equipe"
        linkText="Ouvrir Équipe"
      />
    );
  }

  return (
    <p className="text-theme-sm text-gray-700">
      <span className="text-gray-500">Réalisée par : </span>
      {members.map((m) => m.firstName).join(", ")}
    </p>
  );
}

function PrestationForm({
  title,
  draft,
  setDraft,
  serviceSalonIds,
  prestationId,
  onSave,
  onCancel,
  saveLabel,
}: {
  title: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  serviceSalonIds: SalonId[];
  prestationId: string | null;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const valid =
    draft.name.trim() !== "" &&
    digitsToInt(draft.price) > 0 &&
    digitsToInt(draft.duration) > 0;

  const toggleSalon = (id: SalonId) => {
    const next = draft.salonIds.includes(id)
      ? draft.salonIds.filter((s) => s !== id)
      : [...draft.salonIds, id];
    setDraft({ ...draft, salonIds: next });
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <h4 className="text-theme-sm font-semibold text-gray-800">{title}</h4>
      <div className="mt-4 space-y-4">
        <TextInput
          label="Nom de la prestation"
          placeholder="Vernis permanent mains"
          value={draft.name}
          onChange={(v) => setDraft({ ...draft, name: v })}
        />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3">
          <TextInput
            label="Prix (FCFA)"
            inputMode="numeric"
            placeholder="17000"
            value={draft.price}
            onChange={(v) => setDraft({ ...draft, price: v })}
            hint={digitsToInt(draft.price) > 0 ? fcfa(digitsToInt(draft.price)) : undefined}
          />
          <TextInput
            label="Durée (minutes)"
            inputMode="numeric"
            placeholder="30"
            value={draft.duration}
            onChange={(v) => setDraft({ ...draft, duration: v })}
            hint={
              digitsToInt(draft.duration) > 0
                ? durationLabel(digitsToInt(draft.duration))
                : undefined
            }
          />
          <div className="pt-7">
            <label className="flex items-center gap-2 text-theme-sm text-gray-600">
              <Toggle
                checked={draft.active}
                onChange={(v) => setDraft({ ...draft, active: v })}
                aria-label="Prestation active"
              />
              {draft.active ? "Active" : "Inactive"}
            </label>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-800">Proposée dans</span>
          {serviceSalonIds.length === 0 ? (
            <p className="text-theme-xs text-warning-600">
              Le service parent n&apos;est proposé dans aucun salon.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {serviceSalonIds.map((id) => {
                const checked = draft.salonIds.includes(id);
                return (
                  <label
                    key={id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-theme-sm ${
                      checked
                        ? "border-brand-300 bg-white text-gray-800"
                        : "border-gray-200 bg-white text-gray-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSalon(id)}
                      className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                    />
                    {salonName(id)}
                  </label>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-theme-xs text-gray-500">
            Par défaut, tous les salons du service. Décochez pour restreindre.
          </p>
        </div>

        <SelectField<ReservationMode>
          label="Réservation"
          value={draft.reservationMode}
          onChange={(v) => setDraft({ ...draft, reservationMode: v })}
          options={RESERVATION_MODE_OPTIONS}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <RealiseePar prestationId={prestationId} />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <RecipeEditor
            recipe={draft.recipe}
            onChange={(recipe) => setDraft({ ...draft, recipe })}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button type="button" onClick={onSave} disabled={!valid} className={btnPrimary}>
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function PrestationsPanel({
  serviceId,
  serviceSalonIds,
  prestations,
  onUpsert,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(draftOf(serviceSalonIds));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setConfirmId(null);
    setDraft(draftOf(serviceSalonIds));
    setCreating(true);
  };

  const startEdit = (p: Prestation) => {
    setCreating(false);
    setConfirmId(null);
    setEditingId(p.id);
    setDraft(draftOf(serviceSalonIds, p));
  };

  const reset = () => {
    setEditingId(null);
    setCreating(false);
  };

  const commit = (id: string) => {
    onUpsert({
      id,
      serviceId,
      name: draft.name.trim(),
      priceFcfa: digitsToInt(draft.price),
      durationMin: digitsToInt(draft.duration),
      active: draft.active,
      recipe: draft.recipe,
      // Aucun salon coché = on retombe sur « héritée du parent ».
      salonIds: draft.salonIds.length > 0 ? draft.salonIds : [],
      reservationMode: draft.reservationMode,
    });
    reset();
  };

  return (
    <SectionCard
      title="Prestations"
      description="Les prestations facturables de ce service : prix, durée, salons, mode de réservation et recette de consommation."
    >
      {prestations.length === 0 && !creating ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-theme-sm text-gray-500">
          Aucune prestation pour ce service. Ajoutez-en une pour qu&apos;il soit réservable.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {prestations.map((p) =>
            editingId === p.id ? (
              <li key={p.id}>
                <PrestationForm
                  title="Modifier la prestation"
                  draft={draft}
                  setDraft={setDraft}
                  serviceSalonIds={serviceSalonIds}
                  prestationId={p.id}
                  onSave={() => commit(p.id)}
                  onCancel={reset}
                  saveLabel="Enregistrer"
                />
              </li>
            ) : (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {p.name}
                    {!p.active && (
                      <span className="ml-2 text-theme-xs font-medium text-gray-400">Inactive</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-theme-xs text-gray-500">
                    {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)} ·{" "}
                    {reservationModeLabel(p.reservationMode)} ·{" "}
                    {p.recipe.length === 0
                      ? "aucune recette"
                      : `${p.recipe.length} ingrédient${p.recipe.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                {confirmId === p.id ? (
                  <span className="flex shrink-0 items-center gap-2 text-theme-xs">
                    <span className="text-gray-500">Supprimer&nbsp;?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(p.id);
                        setConfirmId(null);
                      }}
                      className="font-semibold text-error-600 hover:underline"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="font-medium text-gray-500 hover:underline"
                    >
                      Non
                    </button>
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(p.id)}
                      aria-label={`Supprimer la prestation ${p.name}`}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-100 pt-6">
        {creating ? (
          <PrestationForm
            title="Ajouter une prestation"
            draft={draft}
            setDraft={setDraft}
            serviceSalonIds={serviceSalonIds}
            prestationId={null}
            onSave={() => commit(newId("pr"))}
            onCancel={reset}
            saveLabel="Ajouter la prestation"
          />
        ) : (
          <button type="button" onClick={startCreate} className={btnPrimary}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ajouter une prestation
          </button>
        )}
      </div>
    </SectionCard>
  );
}
