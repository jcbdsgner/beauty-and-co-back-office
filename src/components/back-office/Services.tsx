"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/back-office/PageHeader";
import PageTabs from "@/components/back-office/PageTabs";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";
import {
  newId,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";
import type { ServiceDraft } from "./services/ServiceInfoForm";
import ServicesCatalog from "./services/ServicesCatalog";
import CategoryPanel from "./services/CategoryPanel";
import PrestationPanel from "./services/PrestationPanel";
import BoissonsPanel from "./services/BoissonsPanel";
import { useServicesData } from "./services/ServicesData";

// Écran « Services ». Onglet Prestations = carte des services en sections
// continues avec sommaire (`services/ServicesCatalog`, 2026-09-27 — remplace
// le tableau Kanban : voir ce fichier pour les 3 questions de design) ;
// fiches catégorie et prestation en panneau latéral par-dessus.

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

// Deux onglets, deux routes (2026-09-27) : Prestations = `/services`,
// Boissons = `/services/boissons`. L'état du catalogue vit dans
// `services/ServicesData` (layout de la route) pour survivre au changement
// d'onglet.
export type ServicesSection = "prestations" | "boissons";

type View =
  | { kind: "list" }
  | { kind: "category"; id: string | null }
  | { kind: "prestation"; id: string | null; serviceId: string; subcategoryId: string | null };

export default function Services({ section }: { section: ServicesSection }) {
  const { scope, setScope } = useLocation();

  // Aucun backend : tout est édité en mémoire de session (comme Fidélité).
  // Boissons = carte du bar (famille à part, sans stock — cf. `Boisson`).
  const {
    services,
    setServices,
    prestations,
    setPrestations,
    questions,
    setQuestions,
    boissons,
    setBoissons,
  } = useServicesData();
  // `undefined` = aucun panneau boisson ; `null` = création.
  const [editingBoisson, setEditingBoisson] = useState<string | null | undefined>(undefined);

  const [view, setView] = useState<View>({ kind: "list" });

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
    // « sans catégorie » et réapparaissent dans la section épinglée en tête.
    setPrestations((list) =>
      list.map((p) => (p.serviceId === id ? { ...p, serviceId: null, subcategoryId: null } : p)),
    );
    setQuestions((list) =>
      list.map((q) => (q.serviceId === id ? { ...q, serviceId: null } : q)),
    );
    setServices((list) => list.filter((s) => s.id !== id));
    setView((v) => (v.kind === "category" && v.id === id ? { kind: "list" } : v));
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

  const closePanel = () => setView({ kind: "list" });

  return (
    <div>
      <PageHeader
        title="Services"
        actions={
          section === "prestations" ? (
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
                disabled={services.length === 0}
                onClick={() =>
                  services[0] &&
                  setView({ kind: "prestation", id: null, serviceId: services[0].id, subcategoryId: null })
                }
                className="btn btn-primary btn-sm normal-case text-[15px] font-semibold active:scale-[0.97] gap-2"
              >
                <Plus aria-hidden className="size-4" />
                Nouvelle prestation
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditingBoisson(null)}
              className="btn btn-primary btn-sm normal-case text-[15px] font-semibold active:scale-[0.97] gap-2"
            >
              <Plus aria-hidden className="size-4" />
              Ajouter une boisson
            </button>
          )
        }
      />

      <PageTabs
        label="Sections du catalogue"
        tabs={[
          { href: "/services", label: "Prestations", active: section === "prestations" },
          { href: "/services/boissons", label: "Boissons", active: section === "boissons" },
        ]}
      />

      {section === "boissons" && (
        <BoissonsPanel
          boissons={boissons}
          editing={editingBoisson}
          onOpen={setEditingBoisson}
          onClose={() => setEditingBoisson(undefined)}
          onSave={(id, d) => {
            setBoissons((list) =>
              id ? list.map((b) => (b.id === id ? { ...d, id } : b)) : [...list, { ...d, id: newId("boisson") }],
            );
            setEditingBoisson(undefined);
          }}
          onDelete={(id) => {
            setBoissons((list) => list.filter((b) => b.id !== id));
            setEditingBoisson(undefined);
          }}
        />
      )}

      {section === "prestations" && (
      <ServicesCatalog
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
        onTogglePrestation={(p, active) => upsertPrestation({ ...p, active })}
        onAttachOrphanPrestation={(id, serviceId) => movePrestation(id, serviceId, null)}
        onDeleteOrphanPrestation={deletePrestation}
        onAttachOrphanQuestion={(id, serviceId) =>
          upsertQuestion({ ...questions.find((q) => q.id === id)!, serviceId })
        }
        onDeleteOrphanQuestion={deleteQuestion}
      />
      )}

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
          services={services}
          prestation={editingPrestation}
          initialSubcategoryId={prestationView.subcategoryId}
          onClose={closePanel}
          onSave={(data) => {
            upsertPrestation({ id: editingPrestation?.id ?? newId("pr"), ...data });
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
