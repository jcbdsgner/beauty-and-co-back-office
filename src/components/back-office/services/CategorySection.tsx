"use client";

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { ConfirmDialog } from "@/components/ui/molecules/confirm-dialog";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu";
import type { Prestation, Service, SubcategoryGroup } from "@/lib/mock/services";
import CategoryThumb from "../shared/CategoryThumb";
import PrestationRow, { ROW_GRID } from "./PrestationRow";
import { Toggle } from "./ui";

type Props = {
  service: Service;
  // Groupes déjà filtrés (salon, recherche, statut) par `ServicesCatalog`.
  groups: SubcategoryGroup[];
  prestationCount: number;
  questionCount: number;
  // Une recherche ou un filtre est actif : les sous-catégories vides ne
  // s'affichent pas et les boutons d'ajout se taisent.
  filtering: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpenCategory: () => void;
  onOpenPrestation: (id: string) => void;
  onAddPrestation: (subcategoryId: string | null) => void;
  onTogglePrestation: (p: Prestation, active: boolean) => void;
  onToggleActive: (active: boolean) => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
};

// Une section de la carte des services = une catégorie. En-tête (vignette,
// nom, compteurs, interrupteur, menu), puis les prestations en lignes-blocs,
// avec les sous-catégories en intertitres (plus de lanes).
export default function CategorySection({
  service,
  groups,
  prestationCount,
  questionCount,
  filtering,
  canMoveUp,
  canMoveDown,
  onOpenCategory,
  onOpenPrestation,
  onAddPrestation,
  onTogglePrestation,
  onToggleActive,
  onMove,
  onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const visible = filtering ? groups.filter((g) => g.prestations.length > 0) : groups;
  const hasSubcategories = service.subcategories.length > 0;

  return (
    <section
      id={`categorie-${service.id}`}
      aria-labelledby={`categorie-${service.id}-titre`}
      className="scroll-mt-24"
    >
      <header className="flex items-center gap-3 pb-3">
        <CategoryThumb image={service.image} name={service.name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              id={`categorie-${service.id}-titre`}
              className={`truncate text-lg font-semibold ${
                service.active ? "text-base-content" : "text-base-content/45"
              }`}
            >
              {service.name}
            </h2>
            {!service.active && (
              <Badge size="sm" color="light">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-sm text-base-content/60">
            {prestationCount} prestation{prestationCount > 1 ? "s" : ""}
            {questionCount > 0 && ` · ${questionCount} question${questionCount > 1 ? "s" : ""} de réservation`}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-base-content/60">
          {service.active ? "Active" : "Inactive"}
          <Toggle
            checked={service.active}
            onChange={onToggleActive}
            aria-label={`Catégorie ${service.name} ${service.active ? "active" : "inactive"}`}
          />
        </label>
        <button
          type="button"
          onClick={onOpenCategory}
          className="btn btn-ghost btn-sm normal-case text-[15px] font-semibold text-base-content/70 hover:text-base-content"
        >
          Modifier
        </button>
        <DropdownMenu
          trigger={
            <button
              type="button"
              aria-label={`Autres actions sur ${service.name}`}
              className="rounded-field p-2 text-base-content/55 transition hover:bg-muted hover:text-base-content"
            >
              <MoreHorizontal aria-hidden className="size-5" />
            </button>
          }
          items={[
            { label: "Monter d'un rang", onSelect: () => onMove(-1), disabled: !canMoveUp },
            { label: "Descendre d'un rang", onSelect: () => onMove(1), disabled: !canMoveDown },
            { type: "separator" },
            { label: "Supprimer la catégorie", tone: "danger", onSelect: () => setConfirmDelete(true) },
          ]}
        />
      </header>

      <div className="rounded-box border border-base-300 bg-base-100 p-3">
        {visible.length === 0 ? (
          <div className="flex items-center justify-between gap-3 px-2 py-3">
            <p className="text-sm text-base-content/60">
              {filtering ? "Aucune prestation ne correspond." : "Aucune prestation dans cette catégorie."}
            </p>
            {!filtering && (
              <AddButton label="Ajouter une prestation" onClick={() => onAddPrestation(null)} />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`${ROW_GRID} px-4 text-xs font-medium uppercase tracking-wide text-base-content/45`}
              aria-hidden
            >
              <span>Prestation</span>
              <span>Durée</span>
              <span className="text-right">Prix</span>
              <span className="text-right">Active</span>
            </div>
            {visible.map((group) => {
              const title = group.subcategory?.name ?? (hasSubcategories ? "Autres" : null);
              return (
                <div key={group.subcategory?.id ?? "__autres"} className="space-y-1.5">
                  {title && (
                    <div className="flex items-baseline justify-between px-1 pt-1">
                      <h3 className="text-sm font-semibold text-base-content/80">
                        {title}
                        <span className="ml-2 font-normal text-base-content/45">
                          {group.prestations.length}
                        </span>
                      </h3>
                      {!filtering && group.subcategory && (
                        <AddButton
                          label="Ajouter"
                          onClick={() => onAddPrestation(group.subcategory!.id)}
                        />
                      )}
                    </div>
                  )}
                  {group.prestations.length === 0 && (
                    <p className="rounded-field border border-dashed border-base-300 px-4 py-2.5 text-sm text-base-content/45">
                      Aucune prestation dans cette sous-catégorie.
                    </p>
                  )}
                  {group.prestations.map((p) => (
                    <PrestationRow
                      key={p.id}
                      prestation={p}
                      onOpen={() => onOpenPrestation(p.id)}
                      onToggleActive={(active) => onTogglePrestation(p, active)}
                    />
                  ))}
                </div>
              );
            })}
            {!filtering && (
              <div className="border-t border-base-300 pt-3">
                <AddButton label="Ajouter une prestation" onClick={() => onAddPrestation(null)} />
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Supprimer « ${service.name} » ?`}
        description="Ses prestations et questions ne sont pas supprimées : elles passent « Sans catégorie », en haut de la page, pour être rattachées ailleurs."
        confirmLabel="Supprimer"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-field px-2 py-1 text-sm font-medium text-brand-600 transition hover:bg-accent hover:text-secondary"
    >
      <Plus aria-hidden className="size-4" />
      {label}
    </button>
  );
}
