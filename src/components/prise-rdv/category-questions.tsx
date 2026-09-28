import type { CategoryQuestion } from "@/lib/prise-rdv/data/booking-services";

type CategoryQuestionsProps = {
  questions: CategoryQuestion[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  showErrors: boolean;
};

export function CategoryQuestions({ questions, answers, onAnswer, showErrors }: CategoryQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-[rgba(128,101,98,0.2)] bg-[rgba(237,220,218,0.4)] p-[17px]">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 shrink-0 rounded-full bg-[var(--brand-taupe-muted)]" />
        <p className="text-[17px] font-semibold text-[var(--brand-taupe-muted)]">Informations complémentaires</p>
        <span className="text-[13px] text-[var(--color-error)]">(obligatoire)</span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {questions.map((question) => {
          const value = answers[question.id] ?? "";
          const isMissing = showErrors && value.trim() === "";

          return (
            <div key={question.id}>
              <p className="text-[15px] font-[450] text-[var(--color-gray-800)]">
                {question.label} <span className="text-[var(--color-error)]">*</span>
              </p>

              {question.type === "yesno" ? (
                <div className="mt-2 flex items-center gap-6">
                  {(["Oui", "Non"] as const).map((option) => (
                    <label key={option} className="flex items-center gap-2 text-[15px] font-[450] text-[var(--color-gray-800)]">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={value === option}
                        onChange={() => onAnswer(question.id, option)}
                        className="size-4 accent-[var(--brand-taupe-muted)]"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(event) => onAnswer(question.id, event.target.value)}
                  placeholder={question.placeholder}
                  className="mt-2 w-full rounded-lg border border-[var(--color-slate-200)] bg-white/60 px-3 py-2.5 text-[15px] text-[var(--color-gray-800)] placeholder:text-[#94a3b8] focus:border-[var(--brand-taupe-muted)] focus:outline-none"
                />
              )}

              {isMissing && (
                <p className="mt-2 text-[13px] text-[var(--color-error)]">
                  {question.type === "yesno" ? "Veuillez sélectionner une réponse" : "Veuillez compléter ce champ"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
