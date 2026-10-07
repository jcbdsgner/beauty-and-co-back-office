"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrashBinIcon } from "@/icons";
import { newId, type PrestationQuestion, type PrestationQuestionOption } from "@/lib/mock/services";
import { AddLink, FicheGroup } from "./FicheGroup";

type Props = {
  questions: PrestationQuestion[];
  onChange: (questions: PrestationQuestion[]) => void;
};

const blankOption = (): PrestationQuestionOption => ({ id: newId("pqo"), label: "", photo: null });
const blankQuestion = (): PrestationQuestion => ({
  id: newId("pq"),
  label: "",
  options: [blankOption(), blankOption()],
});

// Ce qui empêche d'enregistrer la prestation, en une phrase (`null` = rien) —
// affiché à côté du bouton « Enregistrer » de la fiche.
export function questionsProblem(questions: PrestationQuestion[]): string | null {
  for (const [i, q] of questions.entries()) {
    const which = questions.length > 1 ? `Question ${i + 1} : ` : "Question : ";
    if (q.label.trim() === "") return `${which}écrivez la question.`;
    if (q.options.length < 2) return `${which}ajoutez au moins deux réponses.`;
    if (q.options.some((o) => o.label.trim() === "")) return `${which}nommez chaque réponse.`;
  }
  return null;
}

// « Questions à la cliente » de la fiche prestation, montrées comme la
// cliente les verra : la question, puis une tuile photo par réponse. Tout se
// modifie sur place et part avec le bouton « Enregistrer » de la fiche.
export default function PrestationQuestionsEditor({ questions, onChange }: Props) {
  // Question tout juste ajoutée : son champ prend le focus.
  const [fresh, setFresh] = useState<string | null>(null);

  const update = (id: string, next: PrestationQuestion) =>
    onChange(questions.map((q) => (q.id === id ? next : q)));
  const add = () => {
    const q = blankQuestion();
    setFresh(q.id);
    onChange([...questions, q]);
  };

  return (
    <FicheGroup
      title="Questions à la cliente"
      count={questions.length}
      action={questions.length > 0 && <AddLink onClick={add}>Ajouter une question</AddLink>}
    >
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          autoFocus={q.id === fresh}
          onChange={(next) => update(q.id, next)}
          onRemove={() => onChange(questions.filter((x) => x.id !== q.id))}
        />
      ))}

      {questions.length === 0 && (
        <div className="p-4">
          <button
            type="button"
            onClick={add}
            className="flex w-full items-center justify-center gap-2 rounded-field border-2 border-dashed border-base-300 px-4 py-4 text-sm font-semibold text-secondary transition hover:border-primary hover:bg-accent/50"
          >
            <Plus aria-hidden className="size-4" />
            Ajouter une question avec photos
          </button>
        </div>
      )}
    </FicheGroup>
  );
}

function QuestionCard({
  question,
  autoFocus,
  onChange,
  onRemove,
}: {
  question: PrestationQuestion;
  autoFocus: boolean;
  onChange: (q: PrestationQuestion) => void;
  onRemove: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const setOption = (id: string, patch: Partial<PrestationQuestionOption>) =>
    onChange({ ...question, options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const removeOption = (id: string) =>
    onChange({ ...question, options: question.options.filter((o) => o.id !== id) });
  const moveOption = (from: number, to: number) => {
    if (from === to) return;
    const options = [...question.options];
    const [moved] = options.splice(from, 1);
    options.splice(to, 0, moved);
    onChange({ ...question, options });
  };

  return (
    <div className="px-5 py-4">
      <div className="-ml-2 flex items-center gap-2">
        <input
          value={question.label}
          autoFocus={autoFocus}
          onChange={(e) => onChange({ ...question, label: e.target.value })}
          placeholder="Votre question — ex. Quel type de tresses souhaitez-vous ?"
          aria-label="Question posée à la cliente"
          className="min-w-0 flex-1 rounded-field border border-transparent px-2 py-1.5 text-base font-semibold text-base-content transition placeholder:font-normal placeholder:text-base-content/40 hover:border-base-300 focus:border-primary focus:outline-none"
        />
        {confirmRemove ? (
          <span className="flex shrink-0 items-center gap-2 text-sm">
            <span className="text-base-content/70">Supprimer&nbsp;?</span>
            <button type="button" onClick={onRemove} className="font-semibold text-error-600 hover:underline">
              Oui
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="font-medium text-base-content/60 hover:underline"
            >
              Non
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label="Supprimer la question"
            title="Supprimer la question"
            className="shrink-0 rounded-lg p-2 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
          >
            <TrashBinIcon className="size-4" />
          </button>
        )}
      </div>

      <ol className="mt-3 flex flex-wrap gap-2.5" aria-label="Réponses proposées">
        {question.options.map((o, i) => (
          <li
            key={o.id}
            draggable
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(e) => dragFrom !== null && e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null) moveOption(dragFrom, i);
              setDragFrom(null);
            }}
            className={cn("w-40", dragFrom === i && "opacity-40")}
          >
            <AnswerTile
              option={o}
              index={i}
              canRemove={question.options.length > 2}
              onChange={(patch) => setOption(o.id, patch)}
              onRemove={() => removeOption(o.id)}
            />
          </li>
        ))}
        <li className="flex w-24">
          <button
            type="button"
            onClick={() => onChange({ ...question, options: [...question.options, blankOption()] })}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-field border-2 border-dashed border-base-300 text-sm font-semibold text-secondary transition hover:border-primary hover:bg-accent/50"
          >
            <Plus aria-hidden className="size-5" />
            Réponse
          </button>
        </li>
      </ol>
    </div>
  );
}

function AnswerTile({
  option,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  option: PrestationQuestionOption;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<PrestationQuestionOption>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const name = option.label.trim() || `réponse ${index + 1}`;

  const pick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && onChange({ photo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="group relative cursor-grab overflow-hidden rounded-field border border-base-300 bg-white active:cursor-grabbing">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label={option.photo ? `Changer la photo de ${name}` : `Ajouter une photo à ${name}`}
        className={cn(
          "relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 text-xs font-medium",
          option.photo ? "bg-base-200" : "bg-base-200 text-base-content/50 hover:bg-accent hover:text-secondary",
        )}
      >
        {option.photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- chemin public/ ou dataURL de session */}
            <img src={option.photo} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-neutral/70 py-1.5 text-center text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              Changer la photo
            </span>
          </>
        ) : (
          <>
            <ImagePlus aria-hidden className="size-6" />
            Photo
          </>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <input
        value={option.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Nom"
        aria-label={`Nom de la réponse ${index + 1}`}
        className="w-full border-t border-base-300 px-2 py-2 text-sm font-medium text-base-content placeholder:font-normal placeholder:text-base-content/40 focus:bg-accent/40 focus:outline-none"
      />

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer ${name}`}
          title="Supprimer cette réponse"
          className="absolute top-2 right-2 rounded-full bg-white/95 p-1.5 text-base-content/70 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100 hover:text-error-600"
        >
          <TrashBinIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
