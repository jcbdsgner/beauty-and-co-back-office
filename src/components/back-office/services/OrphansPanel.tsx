"use client";

import { useState } from "react";
import { ChevronDownIcon, TrashBinIcon } from "@/icons";
import {
  durationLabel,
  fcfa,
  questionTypeLabel,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";
import { BackButton, SectionCard } from "./ui";

type Props = {
  services: Service[];
  prestations: Prestation[];
  questions: ServiceQuestion[];
  onBack: () => void;
  onUpsertPrestation: (p: Prestation) => void;
  onDeletePrestation: (id: string) => void;
  onUpsertQuestion: (q: ServiceQuestion) => void;
  onDeleteQuestion: (id: string) => void;
};

function AttachSelect({
  services,
  onPick,
  label,
}: {
  services: Service[];
  onPick: (serviceId: string) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value=""
        onChange={(e) => e.target.value && onPick(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-9 text-theme-xs font-medium text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
      >
        <option value="" disabled>
          Rattacher à…
        </option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function Row({
  title,
  subtitle,
  services,
  onPick,
  onDelete,
  deleteLabel,
}: {
  title: string;
  subtitle: string;
  services: Service[];
  onPick: (serviceId: string) => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">{title}</p>
        <p className="mt-0.5 text-theme-xs text-gray-500">{subtitle}</p>
      </div>
      {confirming ? (
        <span className="flex shrink-0 items-center gap-2 text-theme-xs">
          <span className="text-gray-500">Supprimer&nbsp;?</span>
          <button
            type="button"
            onClick={onDelete}
            className="font-semibold text-error-600 hover:underline"
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="font-medium text-gray-500 hover:underline"
          >
            Non
          </button>
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <AttachSelect services={services} onPick={onPick} label={`Rattacher ${title}`} />
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={deleteLabel}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
          >
            <TrashBinIcon className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}

export default function OrphansPanel({
  services,
  prestations,
  questions,
  onBack,
  onUpsertPrestation,
  onDeletePrestation,
  onUpsertQuestion,
  onDeleteQuestion,
}: Props) {
  const nothing = prestations.length === 0 && questions.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-semibold text-gray-800">Éléments sans catégorie</h1>
        <p className="mt-1 max-w-2xl text-theme-sm text-gray-500">
          Ces prestations et questions ne sont rattachées à aucun service. Rattachez-les pour
          qu&apos;elles apparaissent à la réservation, ou supprimez-les.
        </p>
      </div>

      {nothing ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-theme-sm font-medium text-gray-700">Tout est rangé.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 text-theme-sm font-medium text-brand-500 hover:text-brand-600"
          >
            Retour aux services
          </button>
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          {prestations.length > 0 && (
            <SectionCard title={`Prestations sans catégorie · ${prestations.length}`}>
              <ul className="space-y-2.5">
                {prestations.map((p) => (
                  <Row
                    key={p.id}
                    title={p.name}
                    subtitle={`${fcfa(p.priceFcfa)} · ${durationLabel(p.durationMin)} · ${
                      p.recipe.length === 0
                        ? "aucune recette"
                        : `${p.recipe.length} ingrédient${p.recipe.length > 1 ? "s" : ""}`
                    }`}
                    services={services}
                    onPick={(serviceId) => onUpsertPrestation({ ...p, serviceId })}
                    onDelete={() => onDeletePrestation(p.id)}
                    deleteLabel={`Supprimer la prestation ${p.name}`}
                  />
                ))}
              </ul>
            </SectionCard>
          )}

          {questions.length > 0 && (
            <SectionCard title={`Questions sans catégorie · ${questions.length}`}>
              <ul className="space-y-2.5">
                {questions.map((q) => (
                  <Row
                    key={q.id}
                    title={q.label}
                    subtitle={`Réponse : ${questionTypeLabel(q.type)}`}
                    services={services}
                    onPick={(serviceId) => onUpsertQuestion({ ...q, serviceId })}
                    onDelete={() => onDeleteQuestion(q.id)}
                    deleteLabel={`Supprimer la question « ${q.label} »`}
                  />
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
