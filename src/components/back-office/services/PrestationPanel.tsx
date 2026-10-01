"use client";

import { useState } from "react";
import { X } from "lucide-react";
import DetailModal from "@/components/back-office/detail/DetailModal";
import Alert from "@/components/ui/alert/Alert";
import { TrashBinIcon } from "@/icons";
import { salonName, type SalonId } from "@/lib/mock/beautyandco";
import { membersForPrestation } from "@/lib/mock/staff";
import {
  digitsToInt,
  availabilitySummary,
  defaultAvailability,
  durationLabel,
  fcfa,
  incompatiblesOf,
  type Prestation,
  type PrestationAvailability,
  type PrestationPause,
  type RecipeItem,
  type Service,
} from "@/lib/mock/services";
import PrestationPicker from "../fidelite/PrestationPicker";
import HoursEditor, { hoursHaveError } from "../salons/HoursEditor";
import { useServicesData } from "./ServicesData";
import PausesEditor from "./PausesEditor";
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
  availability: PrestationAvailability | null; // null = heures d'ouverture du salon
  unavailablePeriods: PrestationPause[];
  incompatibleWith: string[];
};

const draftOf = (
  service: Service,
  initialSubcategoryId: string | null,
  catalog: Prestation[],
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
  availability: p?.availability ?? null,
  unavailablePeriods: p?.unavailablePeriods ?? [],
  incompatibleWith: p ? incompatiblesOf(catalog, p.id) : [],
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
  const { prestations: catalog } = useServicesData();
  const [draft, setDraft] = useState<Draft>(
    draftOf(initialService, initialSubcategoryId, catalog, prestation ?? undefined),
  );
  const [pickIncompatible, setPickIncompatible] = useState(false);
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
    draft.name.trim() !== "" &&
    digitsToInt(draft.price) > 0 &&
    digitsToInt(draft.duration) > 0 &&
    !(draft.availability && hoursHaveError(draft.availability));
  // Premier salon qui la propose : sert de point de départ aux jours personnalisés.
  const refSalon: SalonId | undefined = (draft.salonIds.length > 0 ? draft.salonIds : service.salonIds)[0];

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
      availability: draft.availability,
      unavailablePeriods: draft.unavailablePeriods,
      incompatibleWith: draft.incompatibleWith,
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

        <div>
          <span className="mb-1.5 block text-sm font-medium text-base-content">Jours de disponibilité</span>
          <div role="radiogroup" aria-label="Jours de disponibilité" className="grid grid-cols-2 gap-2">
            {[
              { custom: false, title: "Comme le salon", hint: "Tous les jours et heures d'ouverture" },
              { custom: true, title: "Jours précis", hint: "Certains jours ou certaines heures seulement" },
            ].map((o) => {
              const checked = (draft.availability !== null) === o.custom;
              return (
                <button
                  key={o.title}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  disabled={o.custom && !refSalon}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      availability: o.custom ? (draft.availability ?? (refSalon ? defaultAvailability(refSalon) : null)) : null,
                    })
                  }
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    checked ? "border-primary bg-accent" : "border-base-300 bg-white hover:bg-base-200"
                  }`}
                >
                  <span className="block text-sm font-medium text-base-content">{o.title}</span>
                  <span className="text-xs text-base-content/60">{o.hint}</span>
                </button>
              );
            })}
          </div>
          {draft.availability && (
            <div className="mt-3">
              <HoursEditor
                hours={draft.availability}
                onChange={(availability) => setDraft({ ...draft, availability })}
                closedLabel="Indisponible"
                openLabel="disponible"
              />
              <p className="mt-2 text-xs text-base-content/60">
                {availabilitySummary(draft.availability)} — les jours où le salon est fermé restent fermés. La prise de
                rendez-vous ne propose que ces créneaux.
              </p>
            </div>
          )}
        </div>

        <PausesEditor
          prestationId={prestation?.id ?? null}
          pauses={draft.unavailablePeriods}
          onChange={(unavailablePeriods) => setDraft({ ...draft, unavailablePeriods })}
        />

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

        <div>
          <span className="block text-sm font-medium text-base-content">Incompatible avec</span>
          <p className="mb-2 text-xs text-base-content/60">
            Ces prestations ne peuvent pas être réservées pour la même personne dans la même visite. La règle
            s&apos;applique dans les deux sens.
          </p>
          {draft.incompatibleWith.length > 0 ? (
            <ul className="mb-2 flex flex-wrap gap-2">
              {draft.incompatibleWith.map((id) => {
                const other = catalog.find((p) => p.id === id);
                if (!other) return null;
                const cat = services.find((s) => s.id === other.serviceId)?.name;
                return (
                  <li
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-white py-1 pr-1.5 pl-3 text-sm text-base-content"
                  >
                    {other.name}
                    {cat && cat !== service.name && <span className="text-xs text-base-content/50">· {cat}</span>}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, incompatibleWith: draft.incompatibleWith.filter((x) => x !== id) })
                      }
                      aria-label={`Retirer ${other.name}`}
                      className="rounded-full p-0.5 text-base-content/45 transition hover:bg-base-200 hover:text-base-content"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            !pickIncompatible && <p className="mb-2 text-sm text-base-content/60">Compatible avec tout le catalogue.</p>
          )}
          {pickIncompatible ? (
            <div className="rounded-lg border border-base-300 bg-white p-3">
              <PrestationPicker
                label="Choisir les prestations incompatibles"
                selected={draft.incompatibleWith}
                onChange={(incompatibleWith) => setDraft({ ...draft, incompatibleWith })}
                showPricing={false}
                catalog={{ services, prestations: catalog }}
                excludeId={prestation?.id}
              />
              <button type="button" onClick={() => setPickIncompatible(false)} className={`${btnGhost} mt-2`}>
                Terminé
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setPickIncompatible(true)} className={btnGhost}>
              {draft.incompatibleWith.length > 0 ? "Modifier la liste" : "Ajouter une incompatibilité"}
            </button>
          )}
        </div>

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
