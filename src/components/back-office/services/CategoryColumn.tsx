"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon, PlusIcon } from "@/icons";
import type { Service, ServiceRow, SubcategoryGroup } from "@/lib/mock/services";
import PrestationCard from "./PrestationCard";
import { SERVICE_ICONS } from "./serviceIcons";
import { Toggle } from "./ui";

type Props = {
  service: Service;
  row: ServiceRow;
  groups: SubcategoryGroup[];
  canReorder: boolean;
  dropIndicator: "before" | "after" | null;
  dragging: boolean;
  draggingPrestationId: string | null;
  isZoneActive: (subcategoryId: string | null) => boolean;
  onHandleDragStart: (e: React.DragEvent) => void;
  onHandleDragEnd: () => void;
  onColumnDragOver: (e: React.DragEvent) => void;
  onColumnDrop: (e: React.DragEvent) => void;
  onZoneDragOver: (e: React.DragEvent, subcategoryId: string | null) => void;
  onZoneDrop: (e: React.DragEvent, subcategoryId: string | null) => void;
  onCardDragStart: (e: React.DragEvent, prestationId: string) => void;
  onCardDragEnd: () => void;
  onOpenCategory: () => void;
  onOpenPrestation: (id: string) => void;
  onAddPrestation: (subcategoryId: string | null) => void;
  onToggleActive: (active: boolean) => void;
  onDeleteCategory: () => void;
};

// Une colonne du tableau Kanban « Services » = une catégorie. Le corps
// regroupe les prestations en lanes par sous-catégorie (ou à plat si le
// service n'en a pas) ; chaque lane est une zone de dépôt indépendante pour
// le glisser-déposer d'une prestation, la colonne entière l'est pour le
// glisser-déposer d'une autre catégorie (réordonnancement, poignée dans
// l'en-tête).
export default function CategoryColumn({
  service,
  row,
  groups,
  canReorder,
  dropIndicator,
  dragging,
  draggingPrestationId,
  isZoneActive,
  onHandleDragStart,
  onHandleDragEnd,
  onColumnDragOver,
  onColumnDrop,
  onZoneDragOver,
  onZoneDrop,
  onCardDragStart,
  onCardDragEnd,
  onOpenCategory,
  onOpenPrestation,
  onAddPrestation,
  onToggleActive,
  onDeleteCategory,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = SERVICE_ICONS[service.icon];

  return (
    <div
      onDragOver={onColumnDragOver}
      onDrop={onColumnDrop}
      className={`relative flex h-full w-[300px] shrink-0 flex-col rounded-2xl border bg-gray-50/60 transition ${
        dragging ? "border-brand-300 opacity-40" : "border-gray-200"
      }`}
    >
      {dropIndicator === "before" && (
        <div className="absolute -left-2.5 top-2 bottom-2 w-1 rounded-full bg-brand-400" />
      )}
      {dropIndicator === "after" && (
        <div className="absolute -right-2.5 top-2 bottom-2 w-1 rounded-full bg-brand-400" />
      )}

      <div className="flex shrink-0 items-start gap-2 border-b border-gray-200 p-3">
        {canReorder && (
          <button
            type="button"
            draggable
            onDragStart={onHandleDragStart}
            onDragEnd={onHandleDragEnd}
            aria-label={`Réordonner la catégorie ${service.name}`}
            className="mt-1 flex shrink-0 cursor-grab items-center justify-center rounded p-1 text-gray-300 transition hover:bg-gray-200/60 hover:text-gray-500 active:cursor-grabbing"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="7" cy="5" r="1.3" fill="currentColor" />
              <circle cx="13" cy="5" r="1.3" fill="currentColor" />
              <circle cx="7" cy="10" r="1.3" fill="currentColor" />
              <circle cx="13" cy="10" r="1.3" fill="currentColor" />
              <circle cx="7" cy="15" r="1.3" fill="currentColor" />
              <circle cx="13" cy="15" r="1.3" fill="currentColor" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCategory}
          className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-theme-sm font-semibold text-gray-800 group-hover:text-brand-600">
                {service.name}
              </span>
              {row.unbookableCount > 0 && service.active && (
                <Badge size="sm" color="warning">
                  {row.unbookableCount}
                </Badge>
              )}
            </span>
            <span className="block text-theme-xs text-gray-500">
              {row.prestationCount} prestation{row.prestationCount > 1 ? "s" : ""}
              {row.questionCount > 0 && ` · ${row.questionCount} question${row.questionCount > 1 ? "s" : ""}`}
            </span>
          </span>
        </button>

        <Toggle
          checked={service.active}
          onChange={onToggleActive}
          aria-label={`Catégorie ${service.name} ${service.active ? "active" : "inactive"}`}
        />

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`Options de la catégorie ${service.name}`}
            className="dropdown-toggle rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200/60 hover:text-gray-700"
          >
            <MoreDotIcon className="size-4" />
          </button>
          <Dropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
            <DropdownItem
              onItemClick={() => {
                setMenuOpen(false);
                onOpenCategory();
              }}
            >
              Modifier
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setMenuOpen(false);
                setConfirmDelete(true);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50"
            >
              Supprimer
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {confirmDelete && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-warning-200 bg-warning-50 px-3 py-2 text-theme-xs text-warning-700">
          <span>Supprimer ? Prestations détachées.</span>
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDeleteCategory}
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
        </div>
      )}

      <div className="min-h-[80px] flex-1 space-y-4 overflow-y-auto p-3">
        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-theme-xs text-gray-400">
            Aucune prestation.
          </p>
        )}
        {groups.map((group) => (
          <div
            key={group.subcategory?.id ?? "__autres"}
            onDragOver={(e) => onZoneDragOver(e, group.subcategory?.id ?? null)}
            onDrop={(e) => onZoneDrop(e, group.subcategory?.id ?? null)}
            className={`space-y-2 rounded-lg p-1 transition ${
              isZoneActive(group.subcategory?.id ?? null)
                ? "bg-brand-50 ring-2 ring-brand-300"
                : ""
            }`}
          >
            {group.subcategory && (
              <p className="px-1 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                {group.subcategory.name}
              </p>
            )}
            {!group.subcategory && service.subcategories.length > 0 && (
              <p className="px-1 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                Autres
              </p>
            )}
            {group.prestations.map((p) => (
              <PrestationCard
                key={p.id}
                prestation={p}
                dragging={draggingPrestationId === p.id}
                onOpen={() => onOpenPrestation(p.id)}
                onDragStart={(e) => onCardDragStart(e, p.id)}
                onDragEnd={onCardDragEnd}
              />
            ))}
            {group.subcategory && (
              <button
                type="button"
                onClick={() => onAddPrestation(group.subcategory!.id)}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-theme-xs font-medium text-gray-500 transition hover:border-brand-300 hover:text-brand-600"
              >
                <PlusIcon className="size-3.5" />
                Ajouter
              </button>
            )}
          </div>
        ))}
        {/* Zone de dépôt de secours : sur le fond de la colonne (hors lane), un
            drop range dans « Autres » — utile quand le service n'a pas encore
            de sous-catégories ou que la lane visée est vide. */}
        <div
          onDragOver={(e) => onZoneDragOver(e, null)}
          onDrop={(e) => onZoneDrop(e, null)}
          className="min-h-2"
        />
      </div>

      <div className="shrink-0 border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={() => onAddPrestation(null)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-theme-xs font-medium text-gray-600 transition hover:border-brand-300 hover:bg-white hover:text-brand-600"
        >
          <PlusIcon className="size-3.5" />
          Ajouter une prestation
        </button>
      </div>
    </div>
  );
}
