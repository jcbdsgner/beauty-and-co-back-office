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
  onAttachPrestation: (id: string, serviceId: string) => void;
  onDeletePrestation: (id: string) => void;
  onAttachQuestion: (id: string, serviceId: string) => void;
  onDeleteQuestion: (id: string) => void;
};

// Section « Sans catégorie », épinglée en tête de la carte des services —
// pas une vraie catégorie (pas de fiche, non réordonnable : une prestation
// orpheline n'a pas de parent pour fournir son contexte), juste l'endroit où
// atterrissent les prestations et questions d'une catégorie supprimée.
// Chaque élément se rattache via son sélecteur « Rattacher à… ». Rendue
// seulement s'il y a quelque chose à ranger.
export default function UnassignedSection({
  services,
  prestations,
  questions,
  onAttachPrestation,
  onDeletePrestation,
  onAttachQuestion,
  onDeleteQuestion,
}: Props) {
  if (prestations.length === 0 && questions.length === 0) return null;

  return (
    <section
      id="categorie-sans"
      aria-labelledby="categorie-sans-titre"
      className="scroll-mt-24 rounded-box border border-warning-300 bg-warning-50/40"
    >
      <div className="border-b border-warning-200 px-4 py-3">
        <h2 id="categorie-sans-titre" className="text-lg font-semibold text-warning-700">
          Sans catégorie
        </h2>
        <p className="text-sm text-warning-700/80">
          Ces éléments ne sont proposés nulle part. Choisissez une catégorie pour chacun, ou
          supprimez-les.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {prestations.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-warning-600">
              Prestations · {prestations.length}
            </p>
            {prestations.map((p) => (
              <div key={p.id} className="rounded-field border border-base-300 bg-base-100 p-3 text-xs">
                <p className="line-clamp-2 font-medium text-base-content">{p.name}</p>
                <p className="mt-1 text-base-content/60">
                  {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <select
                      aria-label={`Rattacher la prestation ${p.name}`}
                      value=""
                      onChange={(e) => e.target.value && onAttachPrestation(p.id, e.target.value)}
                      className="h-8 w-full appearance-none rounded-field border border-base-300 bg-white pl-2.5 pr-7 text-xs font-medium text-base-content/80 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
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
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-base-content/45" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePrestation(p.id)}
                    aria-label={`Supprimer la prestation ${p.name}`}
                    className="shrink-0 rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
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
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-warning-600">
              Questions · {questions.length}
            </p>
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-base-300 bg-white p-3 text-xs"
              >
                <p className="line-clamp-2 font-medium text-base-content">{q.label}</p>
                <p className="mt-1 text-base-content/60">Réponse : {questionTypeLabel(q.type)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <select
                      aria-label={`Rattacher la question « ${q.label} »`}
                      value=""
                      onChange={(e) => e.target.value && onAttachQuestion(q.id, e.target.value)}
                      className="h-8 w-full appearance-none rounded-field border border-base-300 bg-white pl-2.5 pr-7 text-xs font-medium text-base-content/80 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
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
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-base-content/45" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteQuestion(q.id)}
                    aria-label={`Supprimer la question « ${q.label} »`}
                    className="shrink-0 rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
