"use client";

import { ChevronDownIcon, TrashBinIcon } from "@/icons";
import {
  durationLabel,
  fcfa,
  questionTypeLabel,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";

type Props = {
  services: Service[];
  prestations: Prestation[];
  questions: ServiceQuestion[];
  draggingPrestationId: string | null;
  isZoneActive: boolean;
  onZoneDragOver: (e: React.DragEvent) => void;
  onZoneDrop: (e: React.DragEvent) => void;
  onCardDragStart: (e: React.DragEvent, prestationId: string) => void;
  onCardDragEnd: () => void;
  onAttachPrestation: (id: string, serviceId: string) => void;
  onDeletePrestation: (id: string) => void;
  onAttachQuestion: (id: string, serviceId: string) => void;
  onDeleteQuestion: (id: string) => void;
};

// Colonne épinglée « Sans catégorie » — pas une vraie catégorie (non
// réordonnable, pas de fiche panneau : une prestation orpheline n'a pas de
// service parent pour en fournir le contexte), juste l'endroit où
// atterrissent les prestations et questions détachées d'un service
// supprimé. Chaque bloc se rattache soit en le glissant vers une colonne du
// tableau, soit via son propre sélecteur « Rattacher à ». N'est rendue que
// s'il y a quelque chose à ranger.
export default function UnassignedColumn({
  services,
  prestations,
  questions,
  draggingPrestationId,
  isZoneActive,
  onZoneDragOver,
  onZoneDrop,
  onCardDragStart,
  onCardDragEnd,
  onAttachPrestation,
  onDeletePrestation,
  onAttachQuestion,
  onDeleteQuestion,
}: Props) {
  if (prestations.length === 0 && questions.length === 0) return null;

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col rounded-2xl border border-dashed border-warning-300 bg-warning-50/40">
      <div className="shrink-0 border-b border-warning-200 p-3">
        <p className="text-theme-sm font-semibold text-warning-700">Sans catégorie</p>
        <p className="text-theme-xs text-warning-600">
          À rattacher — glissez une prestation vers une catégorie, ou choisissez-en une pour
          chaque question.
        </p>
      </div>

      <div
        onDragOver={onZoneDragOver}
        onDrop={onZoneDrop}
        className={`min-h-[80px] flex-1 space-y-4 overflow-y-auto p-3 transition ${
          isZoneActive ? "bg-brand-50 ring-2 ring-brand-300" : ""
        }`}
      >
        {prestations.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-theme-xs font-semibold uppercase tracking-wide text-warning-600">
              Prestations · {prestations.length}
            </p>
            {prestations.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => onCardDragStart(e, p.id)}
                onDragEnd={onCardDragEnd}
                className={`cursor-grab rounded-lg border bg-white p-3 text-theme-xs shadow-theme-xs transition active:cursor-grabbing ${
                  draggingPrestationId === p.id ? "border-brand-300 opacity-40" : "border-gray-200"
                }`}
              >
                <p className="line-clamp-2 font-medium text-gray-800">{p.name}</p>
                <p className="mt-1 text-gray-500">
                  {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <select
                      aria-label={`Rattacher la prestation ${p.name}`}
                      value=""
                      onChange={(e) => e.target.value && onAttachPrestation(p.id, e.target.value)}
                      className="h-8 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-2.5 pr-7 text-theme-xs font-medium text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
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
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePrestation(p.id)}
                    aria-label={`Supprimer la prestation ${p.name}`}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-theme-xs font-semibold uppercase tracking-wide text-warning-600">
              Questions · {questions.length}
            </p>
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-gray-200 bg-white p-3 text-theme-xs"
              >
                <p className="line-clamp-2 font-medium text-gray-800">{q.label}</p>
                <p className="mt-1 text-gray-500">Réponse : {questionTypeLabel(q.type)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <select
                      aria-label={`Rattacher la question « ${q.label} »`}
                      value=""
                      onChange={(e) => e.target.value && onAttachQuestion(q.id, e.target.value)}
                      className="h-8 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-2.5 pr-7 text-theme-xs font-medium text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
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
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteQuestion(q.id)}
                    aria-label={`Supprimer la question « ${q.label} »`}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
