"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import { salons, type SalonScope } from "@/lib/mock/beautyandco";
import {
  newId,
  orphanPrestations,
  orphanQuestions,
  prestationSeeds,
  questionSeeds,
  serviceRows,
  serviceSeeds,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";
import ServicesList from "./services/ServicesList";
import ServiceDetail from "./services/ServiceDetail";
import ServiceInfoForm from "./services/ServiceInfoForm";
import OrphansPanel from "./services/OrphansPanel";
import { BackButton } from "./services/ui";

// Écran « Services » — un seul parcours pour tout le catalogue.
//
// 1. Où en est la propriétaire ? Deux registres. Retouche rapide (« changer le
//    prix de Vernis permanent mains », « désactiver Brows / Lashes ») : elle
//    entre, corrige, sort. Mise en place (« ajouter un service avec ses
//    prestations, ses questions et leurs recettes ») : session posée. Avant, il
//    fallait jongler entre quatre écrans (Gestion, Prestations, Questions,
//    Recettes) et re-filtrer chacun sur la même catégorie.
// 2. Ce qui doit sauter aux yeux : la liste des services, leur statut (ce que la
//    cliente voit à la réservation) et leur ordre ; sur une fiche, les
//    prestations avec leurs prix — le sujet n°1 de la propriétaire, c'est
//    l'argent.
// 3. Quand ça se passe mal : prestations / questions « sans catégorie » →
//    bandeau d'alerte, jamais caché, avec rattachement en un clic ; service sans
//    prestation → invite claire ; suppression d'un service → confirmation, les
//    prestations et questions sont détachées, pas perdues. Réorganisation de
//    l'ordre possible uniquement sur « Tous les salons » (sinon un voisin masqué
//    donnerait l'impression que rien ne bouge).

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

type View =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "detail"; id: string }
  | { kind: "orphans" };

export default function Services() {
  const { scope, setScope } = useLocation();

  // Aucun backend : tout est édité en mémoire de session (comme Fidélité).
  const [services, setServices] = useState<Service[]>(serviceSeeds);
  const [prestations, setPrestations] = useState<Prestation[]>(prestationSeeds);
  const [questions, setQuestions] = useState<ServiceQuestion[]>(questionSeeds);

  const [view, setView] = useState<View>({ kind: "list" });

  const rows = useMemo(
    () => serviceRows(services, prestations, questions, scope),
    [services, prestations, questions, scope],
  );

  const orphanPres = useMemo(() => orphanPrestations(prestations), [prestations]);
  const orphanQues = useMemo(() => orphanQuestions(questions), [questions]);
  const orphanCount = orphanPres.length + orphanQues.length;

  /* ---- opérations services ---- */

  const upsertService = (next: Service) =>
    setServices((list) =>
      list.some((s) => s.id === next.id)
        ? list.map((s) => (s.id === next.id ? next : s))
        : [...list, next],
    );

  const deleteService = (id: string) => {
    // Les prestations et questions ne sont jamais perdues : elles retombent
    // « sans catégorie » et réapparaissent dans le bandeau à rattacher.
    setPrestations((list) =>
      list.map((p) => (p.serviceId === id ? { ...p, serviceId: null } : p)),
    );
    setQuestions((list) =>
      list.map((q) => (q.serviceId === id ? { ...q, serviceId: null } : q)),
    );
    setServices((list) => list.filter((s) => s.id !== id));
    setView({ kind: "list" });
  };

  const moveService = (id: string, dir: -1 | 1) =>
    setServices((list) => {
      const i = list.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  /* ---- opérations prestations / questions ---- */

  const upsertPrestation = (next: Prestation) =>
    setPrestations((list) =>
      list.some((p) => p.id === next.id)
        ? list.map((p) => (p.id === next.id ? next : p))
        : [...list, next],
    );
  const deletePrestation = (id: string) =>
    setPrestations((list) => list.filter((p) => p.id !== id));

  const upsertQuestion = (next: ServiceQuestion) =>
    setQuestions((list) =>
      list.some((q) => q.id === next.id)
        ? list.map((q) => (q.id === next.id ? next : q))
        : [...list, next],
    );
  const deleteQuestion = (id: string) =>
    setQuestions((list) => list.filter((q) => q.id !== id));

  /* ---- rendu ---- */

  const selected =
    view.kind === "detail" ? services.find((s) => s.id === view.id) ?? null : null;

  if (view.kind === "new") {
    return (
      <div className="space-y-6">
        <div>
          <BackButton onClick={() => setView({ kind: "list" })} />
          <PageHeader
            title="Nouveau service"
            description="Créez la catégorie, puis ajoutez ses prestations et ses questions."
          />
        </div>
        <div className="max-w-3xl">
          <ServiceInfoForm
            mode="create"
            onCancel={() => setView({ kind: "list" })}
            onSubmit={(data) => {
              const id = newId("s");
              upsertService({ id, ...data });
              setView({ kind: "detail", id });
            }}
          />
        </div>
      </div>
    );
  }

  if (view.kind === "detail" && selected) {
    return (
      <ServiceDetail
        service={selected}
        prestations={prestations.filter((p) => p.serviceId === selected.id)}
        questions={questions.filter((q) => q.serviceId === selected.id)}
        onBack={() => setView({ kind: "list" })}
        onUpdate={upsertService}
        onDelete={() => deleteService(selected.id)}
        onUpsertPrestation={upsertPrestation}
        onDeletePrestation={deletePrestation}
        onUpsertQuestion={upsertQuestion}
        onDeleteQuestion={deleteQuestion}
      />
    );
  }

  if (view.kind === "orphans") {
    return (
      <OrphansPanel
        services={services}
        prestations={orphanPres}
        questions={orphanQues}
        onBack={() => setView({ kind: "list" })}
        onUpsertPrestation={upsertPrestation}
        onDeletePrestation={deletePrestation}
        onUpsertQuestion={upsertQuestion}
        onDeleteQuestion={deleteQuestion}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Services"
          description="Catégories, prestations facturables, questions d'accueil et recettes de consommation — tout le catalogue au même endroit."
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
              Salon
            </span>
            <SegmentedControl
              options={SALON_OPTIONS}
              value={scope}
              onChange={setScope}
              aria-label="Filtrer par salon"
            />
          </div>
          <button
            type="button"
            onClick={() => setView({ kind: "new" })}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-brand-600"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ajouter un service
          </button>
        </div>
      </div>

      {orphanCount > 0 && (
        <button
          type="button"
          onClick={() => setView({ kind: "orphans" })}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-left text-theme-sm text-warning-700 transition hover:bg-warning-100"
        >
          <span>
            <span className="font-semibold">À ranger : </span>
            {orphanPres.length > 0 && (
              <>
                {orphanPres.length} prestation{orphanPres.length > 1 ? "s" : ""} sans catégorie
              </>
            )}
            {orphanPres.length > 0 && orphanQues.length > 0 && " · "}
            {orphanQues.length > 0 && (
              <>
                {orphanQues.length} question{orphanQues.length > 1 ? "s" : ""} sans catégorie
              </>
            )}
          </span>
          <span className="shrink-0 font-medium">Rattacher →</span>
        </button>
      )}

      <ServicesList
        rows={rows}
        canReorder={scope === "all"}
        onOpen={(id) => setView({ kind: "detail", id })}
        onToggleActive={(s, active) => upsertService({ ...s, active })}
        onMove={moveService}
        onDelete={deleteService}
      />
    </div>
  );
}
