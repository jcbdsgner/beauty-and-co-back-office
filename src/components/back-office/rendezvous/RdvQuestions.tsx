"use client";

import { TextInput } from "@/components/ui/atoms/text-input";
import { BOOKING_QUESTIONS, rdvAnswerKey, type RdvAnswers } from "@/lib/mock/booking-questions";
import { cn } from "@/lib/utils";

/** Une personne et les catégories (services) qu'elle a choisies, dans l'ordre du catalogue. */
export type RdvQuestionPerson = { key: string; label: string; serviceIds: string[] };

/** Questions restées sans réponse, toutes personnes confondues — affiché, jamais bloquant. */
export function missingAnswers(people: RdvQuestionPerson[], answers: RdvAnswers): number {
  return people.reduce(
    (n, p) =>
      n +
      p.serviceIds.reduce(
        (m, sid) =>
          m + (BOOKING_QUESTIONS[sid] ?? []).filter((q) => !(answers[rdvAnswerKey(p.key, sid)]?.[q.id] ?? "").trim()).length,
        0,
      ),
    0,
  );
}

/**
 * Les questions de catégorie de la prise de RDV b&co, dans la fenêtre rendez-vous : une section par
 * personne × catégorie choisie, libellés verbatim (même composant que point-de-vente).
 */
export default function RdvQuestions({
  people,
  serviceName,
  answers,
  onAnswer,
}: {
  people: RdvQuestionPerson[];
  serviceName: (serviceId: string) => string;
  answers: RdvAnswers;
  onAnswer: (personKey: string, serviceId: string, questionId: string, value: string) => void;
}) {
  const sections = people.flatMap((p) => p.serviceIds.filter((sid) => BOOKING_QUESTIONS[sid]).map((sid) => ({ person: p, sid })));
  if (sections.length === 0) return null;
  const showPerson = people.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {sections.map(({ person, sid }) => {
        const key = rdvAnswerKey(person.key, sid);
        return (
          <fieldset key={key} className="rounded-box border border-base-300 px-4 py-3">
            <legend className="px-1 text-sm font-semibold text-base-content">
              {serviceName(sid)}
              {showPerson && <span className="font-normal text-base-content/60"> · {person.label}</span>}
            </legend>
            <div className="flex flex-col divide-y divide-base-300">
              {BOOKING_QUESTIONS[sid].map((q) => {
                const value = answers[key]?.[q.id] ?? "";
                return q.type === "yesno" ? (
                  <div key={q.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm text-base-content">{q.label}</span>
                    <div role="radiogroup" aria-label={q.label} className="flex shrink-0 gap-2">
                      {["Oui", "Non"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={value === opt}
                          onClick={() => onAnswer(person.key, sid, q.id, value === opt ? "" : opt)}
                          className={cn(
                            "h-11 min-w-16 rounded-field border px-4 text-sm font-semibold transition",
                            value === opt
                              ? "border-primary bg-primary text-primary-content"
                              : "border-base-300 bg-base-100 text-base-content hover:border-primary/50",
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <label key={q.id} className="flex flex-col gap-1.5 py-2">
                    <span className="text-sm text-base-content">{q.label}</span>
                    <TextInput value={value} onChange={(e) => onAnswer(person.key, sid, q.id, e.target.value)} />
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
