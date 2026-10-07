"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus } from "lucide-react";
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
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          title={questions.length > 1 ? `Question ${i + 1}` : "Question"}
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
  title,
  question,
  autoFocus,
  onChange,
  onRemove,
}: {
  title: string;
  question: PrestationQuestion;
  autoFocus: boolean;
  onChange: (q: PrestationQuestion) => void;
  onRemove: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const setOption = (id: string, patch: Partial<PrestationQuestionOption>) =>
    onChange({ ...question, options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const removeOption = (id: string) =>
    onChange({ ...question, options: question.options.filter((o) => o.id !== id) });
  const moveOption = (from: number, to: number) => {
    if (to < 0 || to >= question.options.length) return;
    const options = [...question.options];
    const [moved] = options.splice(from, 1);
    options.splice(to, 0, moved);
    onChange({ ...question, options });
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold text-base-content">{title}</span>
          <input
            value={question.label}
            autoFocus={autoFocus}
            onChange={(e) => onChange({ ...question, label: e.target.value })}
            placeholder="Quel type de tresses souhaitez-vous ?"
            className="h-11 w-full rounded-field border border-base-300 bg-white px-3.5 text-[15px] font-semibold text-base-content transition placeholder:font-normal placeholder:text-base-content/40 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
          />
        </label>
        {confirmRemove ? (
          <span className="flex h-11 shrink-0 items-center gap-2 text-sm">
            <span className="text-base-content/70">Supprimer la question&nbsp;?</span>
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
          <IconButton label="Supprimer la question" danger onClick={() => setConfirmRemove(true)}>
            <TrashBinIcon className="size-4" />
          </IconButton>
        )}
      </div>

      <p className="mt-4 mb-1.5 text-sm font-medium text-base-content/70">Réponses</p>
      <ol className="divide-y divide-base-300 rounded-field border border-base-300">
        {question.options.map((o, i) => (
          <AnswerRow
            key={o.id}
            option={o}
            index={i}
            isFirst={i === 0}
            isLast={i === question.options.length - 1}
            canRemove={question.options.length > 2}
            onChange={(patch) => setOption(o.id, patch)}
            onMove={(dir) => moveOption(i, i + dir)}
            onRemove={() => removeOption(o.id)}
          />
        ))}
      </ol>
      <AddLink
        onClick={() => onChange({ ...question, options: [...question.options, blankOption()] })}
        className="mt-2 -ml-2"
      >
        Ajouter une réponse
      </AddLink>
    </div>
  );
}

function IconButton({
  label,
  danger = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-base-content/55 transition disabled:opacity-25",
        danger ? "hover:bg-error-50 hover:text-error-600" : "hover:bg-base-200 hover:text-base-content",
      )}
    >
      {children}
    </button>
  );
}

// Une réponse = une ligne : miniature, nom, puis les actions, toutes visibles.
function AnswerRow({
  option,
  index,
  isFirst,
  isLast,
  canRemove,
  onChange,
  onMove,
  onRemove,
}: {
  option: PrestationQuestionOption;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<PrestationQuestionOption>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const name = option.label.trim() || `réponse ${index + 1}`;
  const choosePhoto = () => fileRef.current?.click();

  const pick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && onChange({ photo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <button
        type="button"
        onClick={choosePhoto}
        aria-label={option.photo ? `Changer la photo de ${name}` : `Ajouter une photo à ${name}`}
        className={cn(
          "flex h-16 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-lg transition",
          option.photo
            ? "bg-base-200 hover:opacity-85"
            : "border-2 border-dashed border-base-300 text-base-content/45 hover:border-primary hover:text-secondary",
        )}
      >
        {option.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- chemin public/ ou dataURL de session
          <img src={option.photo} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus aria-hidden className="size-5" />
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
        placeholder={`Réponse ${index + 1}`}
        aria-label={`Nom de la réponse ${index + 1}`}
        className="h-10 min-w-0 flex-1 rounded-field border border-base-300 bg-white px-3 text-[15px] text-base-content transition placeholder:text-base-content/40 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
      />

      <button
        type="button"
        onClick={choosePhoto}
        className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-secondary transition hover:bg-accent"
      >
        {option.photo ? "Changer la photo" : "Ajouter une photo"}
      </button>

      <span className="flex shrink-0 items-center">
        <IconButton label={`Monter ${name}`} disabled={isFirst} onClick={() => onMove(-1)}>
          <ArrowUp className="size-4" />
        </IconButton>
        <IconButton label={`Descendre ${name}`} disabled={isLast} onClick={() => onMove(1)}>
          <ArrowDown className="size-4" />
        </IconButton>
        <IconButton label={`Supprimer ${name}`} danger disabled={!canRemove} onClick={onRemove}>
          <TrashBinIcon className="size-4" />
        </IconButton>
      </span>
    </li>
  );
}
