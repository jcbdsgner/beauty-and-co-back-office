"use client";

import DetailModal from "@/components/back-office/detail/DetailModal";
import type { Service, ServiceQuestion } from "@/lib/mock/services";
import type { ServiceDraft } from "./ServiceInfoForm";
import ServiceInfoForm from "./ServiceInfoForm";
import SubcategoriesPanel from "./SubcategoriesPanel";
import QuestionsPanel from "./QuestionsPanel";

type Props = {
  service: Service | null; // null = création
  prestationCount: number;
  questions: ServiceQuestion[];
  onClose: () => void;
  onCreate: (data: ServiceDraft) => void;
  onUpdate: (next: Service) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
  onUpsertQuestion: (q: ServiceQuestion) => void;
  onDeleteQuestion: (id: string) => void;
};

// Fiche panneau latéral d'une catégorie (Service) — informations + (en
// édition seulement, une fois l'id connu) sous-catégories et questions
// d'accueil. Les prestations elles-mêmes ne se gèrent plus ici : elles se
// voient dans la section de la catégorie et se modifient (catégorie comprise)
// dans leur propre fiche, cf. `ServicesCatalog` / `PrestationPanel`.
export default function CategoryPanel({
  service,
  prestationCount,
  questions,
  onClose,
  onCreate,
  onUpdate,
  onDeleteSubcategory,
  onUpsertQuestion,
  onDeleteQuestion,
}: Props) {
  return (
    <DetailModal title={service ? service.name : "Nouvelle catégorie"} onClose={onClose}>
      <div className="space-y-6">
        <ServiceInfoForm
          mode={service ? "edit" : "create"}
          service={service ?? undefined}
          onCancel={onClose}
          onSubmit={(data) => (service ? onUpdate({ ...service, ...data }) : onCreate(data))}
        />

        {service && (
          <>
            <p className="text-xs text-base-content/60">
              {prestationCount} prestation{prestationCount > 1 ? "s" : ""} dans cette catégorie —
              elles se gèrent depuis la page, sous le nom de la catégorie.
            </p>

            <SubcategoriesPanel
              service={service}
              onUpdate={onUpdate}
              onDeleteSubcategory={onDeleteSubcategory}
            />

            <QuestionsPanel
              serviceId={service.id}
              questions={questions}
              onUpsert={onUpsertQuestion}
              onDelete={onDeleteQuestion}
            />
          </>
        )}
      </div>
    </DetailModal>
  );
}
