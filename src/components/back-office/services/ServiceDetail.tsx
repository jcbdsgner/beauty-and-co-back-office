"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon } from "@/icons";
import { salonName } from "@/lib/mock/beautyandco";
import { isUnbookable, type Prestation, type Service, type ServiceQuestion } from "@/lib/mock/services";
import Alert from "@/components/ui/alert/Alert";
import ServiceInfoForm from "./ServiceInfoForm";
import PrestationsPanel from "./PrestationsPanel";
import QuestionsPanel from "./QuestionsPanel";
import { SERVICE_ICONS } from "./serviceIcons";
import { BackButton } from "./ui";

type TabId = "infos" | "prestations" | "questions";

type Props = {
  service: Service;
  prestations: Prestation[];
  questions: ServiceQuestion[];
  onBack: () => void;
  onUpdate: (s: Service) => void;
  onDelete: () => void;
  onUpsertPrestation: (p: Prestation) => void;
  onDeletePrestation: (id: string) => void;
  onUpsertQuestion: (q: ServiceQuestion) => void;
  onDeleteQuestion: (id: string) => void;
};

export default function ServiceDetail({
  service,
  prestations,
  questions,
  onBack,
  onUpdate,
  onDelete,
  onUpsertPrestation,
  onDeletePrestation,
  onUpsertQuestion,
  onDeleteQuestion,
}: Props) {
  const [tab, setTab] = useState<TabId>("infos");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Prestations actives que personne dans l'équipe ne sait réaliser → non réservables.
  const unbookable = prestations.filter(isUnbookable);
  const Icon = SERVICE_ICONS[service.icon];

  const tabs: { id: TabId; label: string }[] = [
    { id: "infos", label: "Informations" },
    { id: "prestations", label: `Prestations · ${prestations.length}` },
    { id: "questions", label: `Questions · ${questions.length}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="size-6" />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
                {service.name}
                {!service.active && (
                  <Badge size="sm" color="light">
                    Inactif
                  </Badge>
                )}
                {service.active && unbookable.length > 0 && (
                  <Badge size="sm" color="warning">
                    Non réservable
                  </Badge>
                )}
              </h1>
              <div className="mt-1 flex flex-wrap gap-1">
                {service.salonIds.length === 0 ? (
                  <span className="text-theme-xs text-warning-600">Proposé dans aucun salon</span>
                ) : (
                  service.salonIds.map((id) => (
                    <Badge key={id} size="sm" color="light">
                      {salonName(id)}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          {confirmDelete ? (
            <div className="flex items-center gap-2 text-theme-sm">
              <span className="text-gray-500">
                Supprimer ce service ? Ses prestations et questions passent « sans catégorie ».
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="font-semibold text-error-600 hover:underline"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="font-medium text-gray-500 hover:underline"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-theme-sm font-medium text-gray-600 transition hover:border-error-200 hover:bg-error-50 hover:text-error-600"
            >
              <TrashBinIcon className="size-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Sections du service"
        className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1"
      >
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-theme-sm font-medium transition-colors ${
                active
                  ? "bg-white text-gray-900 shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-3xl">
        {tab === "infos" && (
          <div className="space-y-5">
            {!service.active && (
              <Alert
                variant="warning"
                title="Service inactif"
                message="Ce service et ses prestations n'apparaissent pas à la réservation tant qu'il n'est pas réactivé. Le paramétrage reste modifiable."
              />
            )}
            <ServiceInfoForm
              mode="edit"
              service={service}
              onSubmit={(data) => onUpdate({ id: service.id, ...data })}
            />
          </div>
        )}

        {tab === "prestations" && (
          <div className="space-y-5">
            {unbookable.length > 0 && (
              <Alert
                variant="warning"
                title={`${unbookable.length} prestation${
                  unbookable.length > 1 ? "s" : ""
                } non réservable${unbookable.length > 1 ? "s" : ""}`}
                message={`Aucune praticienne compétente pour : ${unbookable
                  .map((p) => p.name)
                  .join(", ")}. Ajoutez la compétence depuis Équipe.`}
                showLink
                linkHref="/equipe"
                linkText="Ouvrir Équipe"
              />
            )}
            <PrestationsPanel
              serviceId={service.id}
              serviceSalonIds={service.salonIds}
              prestations={prestations}
              onUpsert={onUpsertPrestation}
              onDelete={onDeletePrestation}
            />
          </div>
        )}

        {tab === "questions" && (
          <QuestionsPanel
            serviceId={service.id}
            questions={questions}
            onUpsert={onUpsertQuestion}
            onDelete={onDeleteQuestion}
          />
        )}
      </div>
    </div>
  );
}
