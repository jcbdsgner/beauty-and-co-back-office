"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ImageOff, MessageCircleQuestion, Pencil, Plus, X } from "lucide-react";
import { TextInput } from "@/components/ui/atoms/text-input";
import { Field } from "@/components/ui/molecules/field";
import { TrashBinIcon } from "@/icons";
import {
  newId,
  prestationQuestionValid,
  type PrestationQuestion,
  type PrestationQuestionOption,
} from "@/lib/mock/services";
import ImagePicker from "../shared/ImagePicker";
import { btnGhost } from "./ui";

type Props = {
  questions: PrestationQuestion[];
  onChange: (questions: PrestationQuestion[]) => void;
  // Signale une question ouverte non enregistrée : la fiche bloque alors son
  // propre « Enregistrer » pour ne pas la perdre en silence.
  onEditingChange?: (editing: boolean) => void;
};

const blankOption = (): PrestationQuestionOption => ({ id: newId("pqo"), label: "", photo: null });
const blankQuestion = (): PrestationQuestion => ({
  id: newId("pq"),
  label: "",
  options: [blankOption(), blankOption()],
});

// Ce qui manque pour enregistrer, écrit en clair (le bouton reste grisé sinon).
function missing(q: PrestationQuestion): string | null {
  if (q.label.trim() === "") return "Écrivez la question.";
  if (q.options.length < 2) return "Ajoutez au moins deux réponses.";
  const unnamed = q.options.filter((o) => o.label.trim() === "").length;
  if (unnamed > 0) return unnamed > 1 ? `${unnamed} réponses n'ont pas de nom.` : "Une réponse n'a pas de nom.";
  return null;
}

// « Questions à la réservation » de la fiche prestation : des questions à choix
// unique, obligatoires, avec une photo facultative par réponse. Une question
// s'édite en place (une seule à la fois) ; le reste de la liste reste lisible.
export default function PrestationQuestionsEditor({ questions, onChange, onEditingChange }: Props) {
  // Brouillon de la question en cours d'édition ; `isNew` = pas encore dans la liste.
  const [editing, setEditingState] = useState<{ draft: PrestationQuestion; isNew: boolean } | null>(null);
  const setEditing = (next: { draft: PrestationQuestion; isNew: boolean } | null) => {
    if ((next === null) !== (editing === null)) onEditingChange?.(next !== null);
    setEditingState(next);
  };
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const startAdd = () => {
    setConfirmDelete(null);
    setEditing({ draft: blankQuestion(), isNew: true });
  };
  const startEdit = (q: PrestationQuestion) => {
    setConfirmDelete(null);
    setEditing({ draft: { ...q, options: q.options.map((o) => ({ ...o })) }, isNew: false });
  };

  const commit = () => {
    if (!editing || !prestationQuestionValid(editing.draft)) return;
    const clean: PrestationQuestion = {
      ...editing.draft,
      label: editing.draft.label.trim(),
      options: editing.draft.options.map((o) => ({ ...o, label: o.label.trim() })),
    };
    onChange(
      editing.isNew ? [...questions, clean] : questions.map((q) => (q.id === clean.id ? clean : q)),
    );
    setEditing(null);
  };

  const remove = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div>
      <span className="block text-sm font-medium text-base-content">Questions à la réservation</span>
      <p className="mb-2 text-xs text-base-content/60">
        À la réservation, la cliente devra choisir une réponse à chaque question.
      </p>

      {questions.length > 0 ? (
        <ul className="mb-2 space-y-2">
          {questions.map((q) =>
            editing && !editing.isNew && editing.draft.id === q.id ? (
              <li key={q.id}>
                <QuestionForm
                  draft={editing.draft}
                  onDraft={(draft) => setEditing({ ...editing, draft })}
                  onCommit={commit}
                  onCancel={() => setEditing(null)}
                  submitLabel="Enregistrer la question"
                />
              </li>
            ) : (
              <li key={q.id} className="rounded-lg border border-base-300 bg-white px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <p className="min-w-0 flex-1 text-sm font-medium text-base-content">{q.label}</p>
                  {confirmDelete === q.id ? (
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="text-base-content/60">Supprimer la question&nbsp;?</span>
                      <button
                        type="button"
                        onClick={() => remove(q.id)}
                        className="font-semibold text-error-600 hover:underline"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="font-medium text-base-content/60 hover:underline"
                      >
                        Non
                      </button>
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => startEdit(q)}
                        disabled={editing !== null}
                        aria-label={`Modifier la question « ${q.label} »`}
                        className="rounded-lg p-1.5 text-base-content/55 transition hover:bg-base-200 hover:text-base-content disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(q.id)}
                        disabled={editing !== null}
                        aria-label={`Supprimer la question « ${q.label} »`}
                        className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600 disabled:pointer-events-none disabled:opacity-40"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </span>
                  )}
                </div>
                <ul className="mt-2 flex flex-wrap gap-2" aria-label="Réponses proposées">
                  {q.options.map((o) => (
                    <li key={o.id} className="w-20">
                      <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-field border border-base-300 bg-base-200 text-base-content/35">
                        {o.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- chemin public/ ou dataURL de session
                          <img src={o.photo} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageOff aria-hidden className="size-5" />
                        )}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-tight text-base-content/75">
                        {o.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>
      ) : (
        !editing && (
          <p className="mb-2 flex items-center gap-2 text-sm text-base-content/60">
            <MessageCircleQuestion aria-hidden className="size-4 text-base-content/40" />
            Aucune question : la prestation se réserve directement.
          </p>
        )
      )}

      {editing?.isNew ? (
        <QuestionForm
          draft={editing.draft}
          onDraft={(draft) => setEditing({ ...editing, draft })}
          onCommit={commit}
          onCancel={() => setEditing(null)}
          submitLabel="Ajouter la question"
        />
      ) : (
        <button type="button" onClick={startAdd} disabled={editing !== null} className={btnGhost}>
          <Plus aria-hidden className="size-4" />
          Ajouter une question
        </button>
      )}
    </div>
  );
}

function QuestionForm({
  draft,
  onDraft,
  onCommit,
  onCancel,
  submitLabel,
}: {
  draft: PrestationQuestion;
  onDraft: (q: PrestationQuestion) => void;
  onCommit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  // Le manque ne s'affiche qu'après une première tentative, pour ne pas
  // accueillir la propriétaire par un message d'erreur sur un formulaire vide.
  const [tried, setTried] = useState(false);
  const problem = missing(draft);

  const setOption = (id: string, patch: Partial<PrestationQuestionOption>) =>
    onDraft({ ...draft, options: draft.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.options.length) return;
    const options = [...draft.options];
    [options[i], options[j]] = [options[j], options[i]];
    onDraft({ ...draft, options });
  };

  const submit = () => {
    if (problem) {
      setTried(true);
      return;
    }
    onCommit();
  };

  return (
    <div className="rounded-lg border border-primary/40 bg-white p-4">
      <Field label="Question posée à la cliente">
        <TextInput
          value={draft.label}
          autoFocus
          onChange={(e) => onDraft({ ...draft, label: e.target.value })}
          placeholder="Quel type de tresses souhaitez-vous ?"
        />
      </Field>

      <div className="mt-4">
        <span className="block text-sm font-medium text-base-content">Réponses</span>
        <p className="mb-2 text-xs text-base-content/60">Une seule réponse possible. Photo facultative.</p>
        <ol className="space-y-2">
          {draft.options.map((o, i) => (
            <li key={o.id} className="flex items-center gap-3">
              <div className="relative">
                <ImagePicker
                  compact
                  size={56}
                  fit="cover"
                  value={o.photo}
                  onChange={(photo) => setOption(o.id, { photo })}
                  label={`la photo de la réponse ${i + 1}`}
                />
                {o.photo && (
                  <button
                    type="button"
                    onClick={() => setOption(o.id, { photo: null })}
                    aria-label={`Retirer la photo de la réponse ${i + 1}`}
                    className="absolute -top-1.5 -right-1.5 rounded-full border border-base-300 bg-white p-0.5 text-base-content/60 shadow-sm transition hover:text-error-600"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              <TextInput
                value={o.label}
                onChange={(e) => setOption(o.id, { label: e.target.value })}
                placeholder={`Réponse ${i + 1}`}
                aria-label={`Nom de la réponse ${i + 1}`}
                aria-invalid={tried && o.label.trim() === "" ? true : undefined}
                className="min-w-0 flex-1"
              />
              <span className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Monter la réponse ${i + 1}`}
                  className="rounded-lg p-1.5 text-base-content/50 transition hover:bg-base-200 hover:text-base-content disabled:opacity-25"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === draft.options.length - 1}
                  aria-label={`Descendre la réponse ${i + 1}`}
                  className="rounded-lg p-1.5 text-base-content/50 transition hover:bg-base-200 hover:text-base-content disabled:opacity-25"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDraft({ ...draft, options: draft.options.filter((x) => x.id !== o.id) })}
                  aria-label={`Retirer la réponse ${i + 1}`}
                  className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => onDraft({ ...draft, options: [...draft.options, blankOption()] })}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
        >
          <Plus aria-hidden className="size-4" />
          Ajouter une réponse
        </button>
      </div>

      {tried && problem && (
        <p role="alert" className="mt-3 text-xs font-medium text-error-600">
          {problem}
        </p>
      )}

      <div className="mt-4 flex gap-2 border-t border-base-300 pt-3">
        <button type="button" onClick={submit} className={btnGhost}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Annuler
        </button>
      </div>
    </div>
  );
}
