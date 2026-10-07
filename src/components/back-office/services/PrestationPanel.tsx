"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import DetailModal from "@/components/back-office/detail/DetailModal";
import { cn } from "@/lib/utils";
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
  type PrestationQuestion,
  type RecipeItem,
  type Service,
} from "@/lib/mock/services";
import PrestationPicker from "../fidelite/PrestationPicker";
import HoursEditor, { hoursHaveError } from "../salons/HoursEditor";
import { useServicesData } from "./ServicesData";
import { AddLink, FicheGroup, FicheRule, Muted, RuleLine } from "./FicheGroup";
import PausesEditor from "./PausesEditor";
import PrestationQuestionsEditor, { questionsProblem } from "./PrestationQuestionsEditor";
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
  questions: PrestationQuestion[];
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
  questions: p?.questions ?? [],
});

function RealiseePar({ prestationId }: { prestationId: string }) {
  const members = membersForPrestation(prestationId);
  const link = (
    <Link href="/equipe" className="rounded-lg px-2 py-1.5 text-sm font-semibold text-secondary transition hover:bg-accent">
      {members.length === 0 ? "Ajouter dans Équipe" : "Équipe"}
    </Link>
  );
  if (members.length === 0) {
    return (
      <RuleLine action={link}>
        <span className="flex items-center gap-2 font-medium text-warning-700">
          <AlertTriangle aria-hidden className="size-4 shrink-0" />
          Personne — non réservable
        </span>
      </RuleLine>
    );
  }
  return <RuleLine action={link}>{members.map((m) => m.firstName).join(", ")}</RuleLine>;
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

  const questionsIssue = questionsProblem(draft.questions);
  const valid =
    draft.name.trim() !== "" &&
    digitsToInt(draft.price) > 0 &&
    digitsToInt(draft.duration) > 0 &&
    !(draft.availability && hoursHaveError(draft.availability)) &&
    questionsIssue === null;
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
      questions: draft.questions,
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

        <FicheGroup title="Réservation">
          <FicheRule label="Salons">
            {service.salonIds.length === 0 ? (
              <RuleLine>
                <span className="text-warning-700">La catégorie n&apos;est proposée dans aucun salon.</span>
              </RuleLine>
            ) : (
              <div className="flex min-h-9 flex-wrap items-center gap-2">
                {service.salonIds.map((id) => {
                  const checked = draft.salonIds.includes(id);
                  return (
                    <label
                      key={id}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition",
                        checked
                          ? "border-primary/50 bg-accent text-base-content"
                          : "border-base-300 bg-white text-base-content/55 hover:bg-base-200",
                      )}
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
          </FicheRule>

          <FicheRule label="Jours et horaires">
            <RuleLine
              action={
                <div role="radiogroup" aria-label="Jours et horaires" className="flex rounded-lg bg-base-200 p-0.5">
                  {[
                    { custom: false, label: "Ceux du salon" },
                    { custom: true, label: "Jours précis" },
                  ].map((o) => {
                    const checked = (draft.availability !== null) === o.custom;
                    return (
                      <button
                        key={o.label}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        disabled={o.custom && !refSalon}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            availability: o.custom
                              ? (draft.availability ?? (refSalon ? defaultAvailability(refSalon) : null))
                              : null,
                          })
                        }
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium transition",
                          checked ? "bg-white text-base-content shadow-sm" : "text-base-content/60 hover:text-base-content",
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              }
            >
              {draft.availability && availabilitySummary(draft.availability)}
            </RuleLine>
            {draft.availability && (
              <div className="mt-3">
                <HoursEditor
                  hours={draft.availability}
                  onChange={(availability) => setDraft({ ...draft, availability })}
                  closedLabel="Indisponible"
                  openLabel="disponible"
                />
              </div>
            )}
          </FicheRule>

          <FicheRule label="Pauses">
            <PausesEditor
              prestationId={prestation?.id ?? null}
              pauses={draft.unavailablePeriods}
              onChange={(unavailablePeriods) => setDraft({ ...draft, unavailablePeriods })}
            />
          </FicheRule>

          {/* La réservation pose la praticienne d'office ; seul réglage réel :
              deux praticiennes en parallèle, temps de chaise divisé. */}
          <FicheRule label="À deux praticiennes">
            <RuleLine
              action={
                <Toggle
                  checked={draft.twoPractitioners}
                  onChange={(v) => setDraft({ ...draft, twoPractitioners: v })}
                  aria-label="À deux praticiennes"
                />
              }
            >
              {draft.twoPractitioners ? (
                digitsToInt(draft.duration) > 0 ? (
                  <>
                    Oui — {durationLabel(digitsToInt(draft.duration))} →{" "}
                    <span className="font-medium">{durationLabel(Math.ceil(digitsToInt(draft.duration) / 2))}</span>
                  </>
                ) : (
                  "Oui"
                )
              ) : (
                <Muted>Non</Muted>
              )}
            </RuleLine>
          </FicheRule>

          <FicheRule label="Pas avec">
            {draft.incompatibleWith.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-1 pb-1">
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
            )}
            {pickIncompatible ? (
              <div className="mt-1 rounded-lg bg-base-200/70 p-3">
                <PrestationPicker
                  label="Prestations à ne pas combiner dans la même visite"
                  selected={draft.incompatibleWith}
                  onChange={(incompatibleWith) => setDraft({ ...draft, incompatibleWith })}
                  showPricing={false}
                  catalog={{ services, prestations: catalog }}
                  excludeId={prestation?.id}
                />
                <button type="button" onClick={() => setPickIncompatible(false)} className={`${btnPrimary} mt-3`}>
                  Terminé
                </button>
              </div>
            ) : (
              <RuleLine
                action={
                  <AddLink onClick={() => setPickIncompatible(true)}>Ajouter</AddLink>
                }
              >
                {draft.incompatibleWith.length === 0 && <Muted>Se combine avec tout</Muted>}
              </RuleLine>
            )}
          </FicheRule>

          {prestation && (
            <FicheRule label="Réalisée par">
              <RealiseePar prestationId={prestation.id} />
            </FicheRule>
          )}
        </FicheGroup>

        <PrestationQuestionsEditor
          questions={draft.questions}
          onChange={(questions) => setDraft({ ...draft, questions })}
        />

        <RecipeEditor recipe={draft.recipe} onChange={(recipe) => setDraft({ ...draft, recipe })} />

        {questionsIssue && <p className="text-sm font-medium text-warning-700">{questionsIssue}</p>}
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
