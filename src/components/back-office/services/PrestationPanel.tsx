"use client";

import { useState } from "react";
import DetailModal from "@/components/back-office/detail/DetailModal";
import Alert from "@/components/ui/alert/Alert";
import { TrashBinIcon } from "@/icons";
import { salonName, type SalonId } from "@/lib/mock/beautyandco";
import { membersForPrestation } from "@/lib/mock/staff";
import {
  digitsToInt,
  durationLabel,
  fcfa,
  type Prestation,
  type RecipeItem,
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
  twoPractitioners: boolean;
  serviceId: string;
  subcategoryId: string | null;
};

const draftOf = (
  service: Service,
  initialSubcategoryId: string | null,
  p?: Prestation,
): Draft => ({
  name: p?.name ?? "",
  price: p ? String(p.priceFcfa) : "",
  duration: p ? String(p.durationMin) : "",
  active: p?.active ?? true,
  recipe: p?.recipe ?? [],
  salonIds: p && p.salonIds.length > 0 ? p.salonIds : service.salonIds,
  twoPractitioners: p?.twoPractitioners ?? false,
  serviceId: service.id,
  subcategoryId: p ? p.subcategoryId ?? null : initialSubcategoryId,
});

function RealiseePar({ prestationId }: { prestationId: string | null }) {
  const members = prestationId ? membersForPrestation(prestationId) : [];

  if (!prestationId) {
    return (
      <p className="text-xs text-base-content/60">
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
    <p className="text-sm text-base-content/80">
      <span className="text-base-content/60">Réalisée par : </span>
      {members.map((m) => m.firstName).join(", ")}
    </p>
  );
}

type Props = {
  service: Service;
  // Toutes les catégories — la fiche porte le changement de catégorie (ce que
  // faisait le glisser-déposer du Kanban, retiré le 2026-09-27).
  services: Service[];
  prestation: Prestation | null; // null = création
  initialSubcategoryId: string | null;
  onClose: () => void;
  onSave: (data: Omit<Prestation, "id" | "serviceId"> & { serviceId: string }) => void;
  onDelete: () => void;
};

// Fiche panneau latéral d'une prestation. Ouverte en cliquant une ligne de la
// carte des services, ou via « Ajouter » depuis une section / sous-catégorie
// (`initialSubcategoryId` préremplit alors la sous-catégorie visée).
export default function PrestationPanel({
  service: initialService,
  services,
  prestation,
  initialSubcategoryId,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Draft>(
    draftOf(initialService, initialSubcategoryId, prestation ?? undefined),
  );
  const service = services.find((s) => s.id === draft.serviceId) ?? initialService;

  // Changer de catégorie : la sous-catégorie et les salons dépendent du
  // parent, on repart de ses valeurs par défaut.
  const changeService = (id: string) => {
    const next = services.find((s) => s.id === id);
    if (!next || next.id === draft.serviceId) return;
    setDraft({ ...draft, serviceId: next.id, subcategoryId: null, salonIds: next.salonIds });
  };
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
      serviceId: draft.serviceId,
      subcategoryId: draft.subcategoryId,
      name: draft.name.trim(),
      priceFcfa: digitsToInt(draft.price),
      durationMin: digitsToInt(draft.duration),
      active: draft.active,
      recipe: draft.recipe,
      salonIds: draft.salonIds.length > 0 ? draft.salonIds : [],
      twoPractitioners: draft.twoPractitioners,
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
            <label className="flex items-center gap-2 text-sm text-base-content/70">
              <Toggle
                checked={draft.active}
                onChange={(v) => setDraft({ ...draft, active: v })}
                aria-label="Prestation active"
              />
              {draft.active ? "Active" : "Inactive"}
            </label>
          </div>
        </div>

        <div className={service.subcategories.length > 0 ? "grid grid-cols-2 gap-3" : ""}>
          <SelectField
            label="Catégorie"
            value={draft.serviceId}
            onChange={changeService}
            options={services.map((s) => ({ value: s.id, label: s.name }))}
          />
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
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-base-content">Proposée dans</span>
          {service.salonIds.length === 0 ? (
            <p className="text-xs text-warning-600">
              Le service parent n&apos;est proposé dans aucun salon.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {service.salonIds.map((id) => {
                const checked = draft.salonIds.includes(id);
                return (
                  <label
                    key={id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? "border-brand-300 bg-white text-base-content"
                        : "border-base-300 bg-white text-base-content/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSalon(id)}
                      className="checkbox checkbox-primary checkbox-sm shrink-0"
                    />
                    {salonName(id)}
                  </label>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-xs text-base-content/60">
            Par défaut, tous les salons de la catégorie. Décochez pour restreindre.
          </p>
        </div>

        {/* Pas de « mode de réservation » (praticienne choisie par la cliente ou
            non, retiré le 2026-09-27) : la réservation pose la praticienne
            d'office, la moins chargée parmi les libres. Seul réglage réel :
            deux praticiennes en parallèle, temps de chaise divisé. */}
        <label className="flex items-center justify-between gap-4 rounded-lg border border-base-300 bg-white p-3">
          <span>
            <span className="block text-sm font-medium text-base-content">Réalisable à deux praticiennes</span>
            <span className="text-xs text-base-content/55">
              Chacune sur une zone distincte, en parallèle — le temps de chaise est divisé.
            </span>
          </span>
          <Toggle
            checked={draft.twoPractitioners}
            onChange={(v) => setDraft({ ...draft, twoPractitioners: v })}
            aria-label="Réalisable à deux praticiennes"
          />
        </label>

        <div className="rounded-lg border border-base-300 bg-white p-3">
          <RealiseePar prestationId={prestation?.id ?? null} />
        </div>

        <div className="border-t border-base-300 pt-5">
          <RecipeEditor
            recipe={draft.recipe}
            onChange={(recipe) => setDraft({ ...draft, recipe })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-5">
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
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-base-content/60">Supprimer&nbsp;?</span>
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
                    className="font-medium text-base-content/60 hover:underline"
                  >
                    Non
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Supprimer la prestation ${prestation.name}`}
                  className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
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
