"use client";

import { useState } from "react";
import DetailModal from "@/components/back-office/detail/DetailModal";
import Alert from "@/components/ui/alert/Alert";
import { TrashBinIcon } from "@/icons";
import { salonName, type SalonId } from "@/lib/mock/beautyandco";
import { membersForPrestation } from "@/lib/mock/staff";
import {
  RESERVATION_MODE_OPTIONS,
  digitsToInt,
  durationLabel,
  fcfa,
  type Prestation,
  type RecipeItem,
  type ReservationMode,
  type Service,
} from "@/lib/mock/services";
import RecipeEditor from "./RecipeEditor";
import { SelectField, TextInput, Toggle, btnGhost, btnPrimary } from "./ui";

type Draft = {
  name: string;
  price: string;
  duration: string;
  active: boolean;
  recipe: RecipeItem[];
  salonIds: SalonId[];
  reservationMode: ReservationMode;
  subcategoryId: string | null;
};

const draftOf = (serviceSalonIds: SalonId[], initialSubcategoryId: string | null, p?: Prestation): Draft => ({
  name: p?.name ?? "",
  price: p ? String(p.priceFcfa) : "",
  duration: p ? String(p.durationMin) : "",
  active: p?.active ?? true,
  recipe: p?.recipe ?? [],
  salonIds: p && p.salonIds.length > 0 ? p.salonIds : serviceSalonIds,
  reservationMode: p?.reservationMode ?? "both",
  subcategoryId: p ? p.subcategoryId ?? null : initialSubcategoryId,
});

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

type Props = {
  service: Service;
  prestation: Prestation | null; // null = création
  initialSubcategoryId: string | null;
  onClose: () => void;
  onSave: (data: Omit<Prestation, "id" | "serviceId">) => void;
  onDelete: () => void;
};

// Fiche panneau latéral d'une prestation — remplace le formulaire inline de
// l'ancien `PrestationsPanel`. Ouverte en cliquant une carte du tableau
// Kanban, ou via « Ajouter une prestation » depuis une colonne/lane
// (`initialSubcategoryId` préremplit alors la sous-catégorie visée).
export default function PrestationPanel({
  service,
  prestation,
  initialSubcategoryId,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Draft>(
    draftOf(service.salonIds, initialSubcategoryId, prestation ?? undefined),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const valid =
    draft.name.trim() !== "" && digitsToInt(draft.price) > 0 && digitsToInt(draft.duration) > 0;

  const toggleSalon = (id: SalonId) => {
    const next = draft.salonIds.includes(id)
      ? draft.salonIds.filter((s) => s !== id)
      : [...draft.salonIds, id];
    setDraft({ ...draft, salonIds: next });
  };

  const save = () => {
    if (!valid) return;
    onSave({
      subcategoryId: draft.subcategoryId,
      name: draft.name.trim(),
      priceFcfa: digitsToInt(draft.price),
      durationMin: digitsToInt(draft.duration),
      active: draft.active,
      recipe: draft.recipe,
      salonIds: draft.salonIds.length > 0 ? draft.salonIds : [],
      reservationMode: draft.reservationMode,
      twoPractitioners: prestation?.twoPractitioners,
    });
  };

  return (
    <DetailModal
      title={prestation ? `${service.name} · ${prestation.name}` : `${service.name} · Nouvelle prestation`}
      onClose={onClose}
    >
      <div className="space-y-5">
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

        {service.subcategories.length > 0 && (
          <SelectField
            label="Sous-catégorie"
            value={draft.subcategoryId ?? "__none"}
            onChange={(v) => setDraft({ ...draft, subcategoryId: v === "__none" ? null : v })}
            options={[
              { value: "__none", label: "Autres (sans sous-catégorie)" },
              ...service.subcategories.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        )}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-800">Proposée dans</span>
          {service.salonIds.length === 0 ? (
            <p className="text-theme-xs text-warning-600">
              Le service parent n&apos;est proposé dans aucun salon.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {service.salonIds.map((id) => {
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
            Par défaut, tous les salons de la catégorie. Décochez pour restreindre.
          </p>
        </div>

        <SelectField<ReservationMode>
          label="Réservation"
          value={draft.reservationMode}
          onChange={(v) => setDraft({ ...draft, reservationMode: v })}
          options={RESERVATION_MODE_OPTIONS}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <RealiseePar prestationId={prestation?.id ?? null} />
        </div>

        <div className="border-t border-gray-200 pt-5">
          <RecipeEditor
            recipe={draft.recipe}
            onChange={(recipe) => setDraft({ ...draft, recipe })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={save} disabled={!valid} className={btnPrimary}>
              {prestation ? "Enregistrer" : "Ajouter la prestation"}
            </button>
            <button type="button" onClick={onClose} className={btnGhost}>
              Annuler
            </button>
          </div>

          {prestation && (
            <div>
              {confirmDelete ? (
                <span className="flex items-center gap-2 text-theme-xs">
                  <span className="text-gray-500">Supprimer&nbsp;?</span>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="font-semibold text-error-600 hover:underline"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="font-medium text-gray-500 hover:underline"
                  >
                    Non
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Supprimer la prestation ${prestation.name}`}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DetailModal>
  );
}
