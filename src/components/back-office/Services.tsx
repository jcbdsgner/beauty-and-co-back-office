"use client";

import { useState } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";
import {
  newId,
  prestationSeeds,
  questionSeeds,
  serviceSeeds,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";
import type { ServiceDraft } from "./services/ServiceInfoForm";
import ServicesBoard from "./services/ServicesBoard";
import CategoryPanel from "./services/CategoryPanel";
import PrestationPanel from "./services/PrestationPanel";

// Écran « Services » — un tableau Kanban unique pour tout le catalogue.
//
// 1. Où en est la propriétaire ? Deux registres. Retouche rapide (« changer le
//    prix de Vernis permanent mains », « désactiver Brows / Lashes ») : elle
//    entre, corrige, sort. Mise en place (« ajouter une catégorie avec ses
//    prestations, ses questions et leurs recettes ») : session posée. Le
//    Kanban sert les deux — une carte se corrige en un clic, une colonne
//    entière se construit sans changer d'écran.
// 2. Ce qui doit sauter aux yeux : les catégories et, à l'intérieur, les
//    prestations avec leur prix — le sujet n°1 de la propriétaire, c'est
//    l'argent (cf. carte). Le classement en colonnes/lanes remplace le
//    tableau à plat : on voit d'un coup d'œil ce que contient chaque
//    catégorie, pas seulement un compteur.
// 3. Quand ça se passe mal : prestations / questions « sans catégorie » →
//    colonne épinglée toujours visible (jamais cachée derrière un lien),
//    rattachement en un glissé ou un sélecteur ; catégorie sans prestation →
//    colonne avec état vide explicite ; suppression d'une catégorie →
//    confirmation, prestations et questions détachées, pas perdues ;
//    réordonnancement des colonnes possible uniquement sur « Tous les
//    salons » (sinon un voisin masqué donnerait l'impression que rien ne
//    bouge).

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

type View =
  | { kind: "board" }
  | { kind: "category"; id: string | null }
  | { kind: "prestation"; id: string | null; serviceId: string; subcategoryId: string | null };

export default function Services() {
  const { scope, setScope } = useLocation();

  // Aucun backend : tout est édité en mémoire de session (comme Fidélité).
  const [services, setServices] = useState<Service[]>(serviceSeeds);
  const [prestations, setPrestations] = useState<Prestation[]>(prestationSeeds);
  const [questions, setQuestions] = useState<ServiceQuestion[]>(questionSeeds);

  const [view, setView] = useState<View>({ kind: "board" });

  /* ---- opérations catégories (services) ---- */

  const upsertService = (next: Service) =>
    setServices((list) =>
      list.some((s) => s.id === next.id)
        ? list.map((s) => (s.id === next.id ? next : s))
        : [...list, next],
    );

  const createService = (data: ServiceDraft) => {
    const id = newId("s");
    upsertService({ id, ...data, subcategories: [] });
    setView({ kind: "category", id });
  };

  const deleteService = (id: string) => {
    // Les prestations et questions ne sont jamais perdues : elles retombent
    // « sans catégorie » et réapparaissent dans la colonne épinglée.
    setPrestations((list) =>
      list.map((p) => (p.serviceId === id ? { ...p, serviceId: null, subcategoryId: null } : p)),
    );
    setQuestions((list) =>
      list.map((q) => (q.serviceId === id ? { ...q, serviceId: null } : q)),
    );
    setServices((list) => list.filter((s) => s.id !== id));
    setView((v) => (v.kind === "category" && v.id === id ? { kind: "board" } : v));
  };

  const deleteSubcategory = (serviceId: string, subcategoryId: string) => {
    setServices((list) =>
      list.map((s) =>
        s.id === serviceId
          ? { ...s, subcategories: s.subcategories.filter((sc) => sc.id !== subcategoryId) }
          : s,
      ),
    );
    setPrestations((list) =>
      list.map((p) => (p.subcategoryId === subcategoryId ? { ...p, subcategoryId: null } : p)),
    );
  };

  /* ---- opérations prestations / questions ---- */

  const upsertPrestation = (next: Prestation) =>
    setPrestations((list) =>
      list.some((p) => p.id === next.id)
        ? list.map((p) => (p.id === next.id ? next : p))
        : [...list, next],
    );
  const deletePrestation = (id: string) =>
    setPrestations((list) => list.filter((p) => p.id !== id));

  const movePrestation = (
    prestationId: string,
    serviceId: string | null,
    subcategoryId: string | null,
  ) =>
    setPrestations((list) =>
      list.map((p) => (p.id === prestationId ? { ...p, serviceId, subcategoryId } : p)),
    );

  const upsertQuestion = (next: ServiceQuestion) =>
    setQuestions((list) =>
      list.some((q) => q.id === next.id)
        ? list.map((q) => (q.id === next.id ? next : q))
        : [...list, next],
    );
  const deleteQuestion = (id: string) =>
    setQuestions((list) => list.filter((q) => q.id !== id));

  /* ---- panneaux ---- */

  const categoryView = view.kind === "category" ? view : null;
  const categoryService =
    categoryView && categoryView.id ? services.find((s) => s.id === categoryView.id) ?? null : null;

  const prestationView = view.kind === "prestation" ? view : null;
  const prestationService = prestationView
    ? services.find((s) => s.id === prestationView.serviceId) ?? null
    : null;
  const editingPrestation =
    prestationView && prestationView.id
      ? prestations.find((p) => p.id === prestationView.id) ?? null
      : null;

  const closePanel = () => setView({ kind: "board" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        actions={
          <>
            <SegmentedControl
              options={SALON_OPTIONS}
              value={scope}
              onChange={setScope}
              aria-label="Filtrer par salon"
              variant="tinted"
            />
            <button
              type="button"
              onClick={() => setView({ kind: "category", id: null })}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-brand-600"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Ajouter une catégorie
            </button>
          </>
        }
      />

      <ServicesBoard
        services={services}
        prestations={prestations}
        questions={questions}
        scope={scope}
        onReorderServices={setServices}
        onToggleServiceActive={(s, active) => upsertService({ ...s, active })}
        onDeleteService={deleteService}
        onOpenCategory={(id) => setView({ kind: "category", id })}
        onOpenNewCategory={() => setView({ kind: "category", id: null })}
        onOpenPrestation={(id) => {
          const p = prestations.find((x) => x.id === id);
          if (!p || !p.serviceId) return;
          setView({ kind: "prestation", id, serviceId: p.serviceId, subcategoryId: p.subcategoryId ?? null });
        }}
        onOpenNewPrestation={(serviceId, subcategoryId) =>
          setView({ kind: "prestation", id: null, serviceId, subcategoryId })
        }
        onMovePrestation={movePrestation}
        onDeleteOrphanPrestation={deletePrestation}
        onAttachOrphanQuestion={(id, serviceId) =>
          upsertQuestion({ ...questions.find((q) => q.id === id)!, serviceId })
        }
        onDeleteOrphanQuestion={deleteQuestion}
      />

      {categoryView && (
        <CategoryPanel
          service={categoryService}
          prestationCount={
            categoryService ? prestations.filter((p) => p.serviceId === categoryService.id).length : 0
          }
          questions={categoryService ? questions.filter((q) => q.serviceId === categoryService.id) : []}
          onClose={closePanel}
          onCreate={createService}
          onUpdate={upsertService}
          onDeleteSubcategory={(subcategoryId) =>
            categoryService && deleteSubcategory(categoryService.id, subcategoryId)
          }
          onUpsertQuestion={upsertQuestion}
          onDeleteQuestion={deleteQuestion}
        />
      )}

      {prestationView && prestationService && (
        <PrestationPanel
          service={prestationService}
          prestation={editingPrestation}
          initialSubcategoryId={prestationView.subcategoryId}
          onClose={closePanel}
          onSave={(data) => {
            upsertPrestation({
              id: editingPrestation?.id ?? newId("pr"),
              serviceId: prestationService.id,
              ...data,
            });
            closePanel();
          }}
          onDelete={() => {
            if (editingPrestation) deletePrestation(editingPrestation.id);
            closePanel();
          }}
        />
      )}
    </div>
  );
}
