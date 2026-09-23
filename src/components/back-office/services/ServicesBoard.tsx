"use client";

import { useState } from "react";
import {
  groupPrestationsBySubcategory,
  orphanPrestations,
  orphanQuestions,
  serviceRows,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";
import type { SalonScope } from "@/lib/mock/beautyandco";
import CategoryColumn from "./CategoryColumn";
import UnassignedColumn from "./UnassignedColumn";
import { PlusIcon } from "@/icons";

type Props = {
  services: Service[];
  prestations: Prestation[];
  questions: ServiceQuestion[];
  scope: SalonScope;
  onReorderServices: (next: Service[]) => void;
  onToggleServiceActive: (service: Service, active: boolean) => void;
  onDeleteService: (id: string) => void;
  onOpenCategory: (id: string) => void;
  onOpenNewCategory: () => void;
  onOpenPrestation: (id: string) => void;
  onOpenNewPrestation: (serviceId: string, subcategoryId: string | null) => void;
  onMovePrestation: (
    prestationId: string,
    serviceId: string | null,
    subcategoryId: string | null,
  ) => void;
  onDeleteOrphanPrestation: (id: string) => void;
  onAttachOrphanQuestion: (id: string, serviceId: string) => void;
  onDeleteOrphanQuestion: (id: string) => void;
};

type DragState =
  | { kind: "category"; id: string }
  | { kind: "prestation"; id: string }
  | null;

type DropZone = { serviceId: string | null; subcategoryId: string | null } | null;

// Tableau Kanban du parcours Services — une colonne par catégorie, glissable
// pour réordonner (uniquement sur « Tous les salons », même règle que
// l'ancien réordonnancement par flèches — un voisin masqué par le filtre
// salon donnerait l'impression que rien ne bouge), plus une colonne épinglée
// « Sans catégorie » pour les prestations/questions détachées et une carte
// « Nouvelle catégorie » en bout de tableau. Toute la mécanique de
// glisser-déposer (colonnes ET prestations) est centralisée ici ; les
// colonnes ne font que refléter l'état de survol qu'on leur passe.
export default function ServicesBoard({
  services,
  prestations,
  questions,
  scope,
  onReorderServices,
  onToggleServiceActive,
  onDeleteService,
  onOpenCategory,
  onOpenNewCategory,
  onOpenPrestation,
  onOpenNewPrestation,
  onMovePrestation,
  onDeleteOrphanPrestation,
  onAttachOrphanQuestion,
  onDeleteOrphanQuestion,
}: Props) {
  const canReorderColumns = scope === "all";

  const [dragState, setDragState] = useState<DragState>(null);
  const [dropCategory, setDropCategory] = useState<{ id: string; side: "before" | "after" } | null>(
    null,
  );
  const [dropZone, setDropZone] = useState<DropZone>(null);

  const rows = serviceRows(services, prestations, questions, scope);
  const orphanPres = orphanPrestations(prestations);
  const orphanQues = orphanQuestions(questions);

  const clearDrag = () => {
    setDragState(null);
    setDropCategory(null);
    setDropZone(null);
  };

  /* ---- glisser-déposer : colonnes (catégories) ---- */

  const handleColumnHandleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDragState({ kind: "category", id });
  };

  const handleColumnDragOver = (e: React.DragEvent, id: string) => {
    if (dragState?.kind !== "category" || !canReorderColumns) return;
    if (dragState.id === id) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const side = e.clientX - rect.left < rect.width / 2 ? "before" : "after";
    setDropCategory({ id, side });
  };

  const handleColumnDrop = (e: React.DragEvent, id: string) => {
    if (dragState?.kind !== "category" || !canReorderColumns) return;
    e.preventDefault();
    const draggedId = dragState.id;
    if (draggedId !== id) {
      const withoutDragged = services.filter((s) => s.id !== draggedId);
      const dragged = services.find((s) => s.id === draggedId);
      let targetIndex = withoutDragged.findIndex((s) => s.id === id);
      if (dragged && targetIndex !== -1) {
        if (dropCategory?.side === "after") targetIndex += 1;
        const next = [...withoutDragged];
        next.splice(targetIndex, 0, dragged);
        onReorderServices(next);
      }
    }
    clearDrag();
  };

  /* ---- glisser-déposer : prestations (recatégorisation) ---- */

  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDragState({ kind: "prestation", id });
  };

  const handleZoneDragOver = (
    e: React.DragEvent,
    serviceId: string | null,
    subcategoryId: string | null,
  ) => {
    if (dragState?.kind !== "prestation") return;
    e.preventDefault();
    e.stopPropagation();
    setDropZone({ serviceId, subcategoryId });
  };

  const handleZoneDrop = (
    e: React.DragEvent,
    serviceId: string | null,
    subcategoryId: string | null,
  ) => {
    if (dragState?.kind !== "prestation") return;
    e.preventDefault();
    e.stopPropagation();
    onMovePrestation(dragState.id, serviceId, subcategoryId);
    clearDrag();
  };

  const isZoneActive = (serviceId: string | null, subcategoryId: string | null) =>
    dropZone !== null && dropZone.serviceId === serviceId && dropZone.subcategoryId === subcategoryId;

  return (
    <div className="flex items-stretch gap-4 overflow-x-auto pb-4">
      {rows.map((row) => {
        const service = row.service;
        return (
          <CategoryColumn
            key={service.id}
            service={service}
            row={row}
            groups={groupPrestationsBySubcategory(service, prestations)}
            canReorder={canReorderColumns}
            dropIndicator={dropCategory?.id === service.id ? dropCategory.side : null}
            dragging={dragState?.kind === "category" && dragState.id === service.id}
            draggingPrestationId={dragState?.kind === "prestation" ? dragState.id : null}
            isZoneActive={(subcategoryId) => isZoneActive(service.id, subcategoryId)}
            onHandleDragStart={(e) => handleColumnHandleDragStart(e, service.id)}
            onHandleDragEnd={clearDrag}
            onColumnDragOver={(e) => handleColumnDragOver(e, service.id)}
            onColumnDrop={(e) => handleColumnDrop(e, service.id)}
            onZoneDragOver={(e, subcategoryId) => handleZoneDragOver(e, service.id, subcategoryId)}
            onZoneDrop={(e, subcategoryId) => handleZoneDrop(e, service.id, subcategoryId)}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={clearDrag}
            onOpenCategory={() => onOpenCategory(service.id)}
            onOpenPrestation={onOpenPrestation}
            onAddPrestation={(subcategoryId) => onOpenNewPrestation(service.id, subcategoryId)}
            onToggleActive={(active) => onToggleServiceActive(service, active)}
            onDeleteCategory={() => onDeleteService(service.id)}
          />
        );
      })}

      <UnassignedColumn
        services={services}
        prestations={orphanPres}
        questions={orphanQues}
        draggingPrestationId={dragState?.kind === "prestation" ? dragState.id : null}
        isZoneActive={isZoneActive(null, null)}
        onZoneDragOver={(e) => handleZoneDragOver(e, null, null)}
        onZoneDrop={(e) => handleZoneDrop(e, null, null)}
        onCardDragStart={handleCardDragStart}
        onCardDragEnd={clearDrag}
        onAttachPrestation={(id, serviceId) => onMovePrestation(id, serviceId, null)}
        onDeletePrestation={onDeleteOrphanPrestation}
        onAttachQuestion={onAttachOrphanQuestion}
        onDeleteQuestion={onDeleteOrphanQuestion}
      />

      <button
        type="button"
        onClick={onOpenNewCategory}
        className="flex h-full min-h-[160px] w-[220px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
          <PlusIcon className="size-4" />
        </span>
        <span className="text-theme-sm font-medium">Nouvelle catégorie</span>
      </button>
    </div>
  );
}
