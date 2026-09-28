"use client";

import { useState } from "react";
import { TrashBinIcon } from "@/icons";
import {
  QUESTION_TYPE_OPTIONS,
  newId,
  questionTypeLabel,
  type QuestionType,
  type ServiceQuestion,
} from "@/lib/mock/services";
import { SectionCard, SelectField, TextInput, Toggle, btnGhost, btnPrimary } from "./ui";

type Props = {
  serviceId: string;
  questions: ServiceQuestion[];
  onUpsert: (q: ServiceQuestion) => void;
  onDelete: (id: string) => void;
};

type Draft = { label: string; type: QuestionType; placeholder: string; active: boolean };

const draftOf = (q?: ServiceQuestion): Draft => ({
  label: q?.label ?? "",
  type: q?.type ?? "oui-non",
  placeholder: q?.placeholder ?? "",
  active: q?.active ?? true,
});

function QuestionForm({
  title,
  draft,
  setDraft,
  onSave,
  onCancel,
  saveLabel,
}: {
  title: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const valid = draft.label.trim() !== "";
  return (
    <div className="rounded-xl border border-brand-200 bg-accent/40 p-4">
      <h4 className="text-sm font-semibold text-base-content">{title}</h4>
      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="question-label"
            className="mb-1.5 block text-sm font-medium text-base-content"
          >
            Question posée à la cliente
          </label>
          <textarea
            id="question-label"
            rows={2}
            value={draft.label}
            placeholder="Avez-vous un vernis permanent ou un gel à retirer ?"
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="w-full rounded-field border border-base-300 bg-white px-4 py-2.5 text-sm text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <SelectField
            label="Type de réponse"
            value={draft.type}
            onChange={(v) => setDraft({ ...draft, type: v })}
            options={QUESTION_TYPE_OPTIONS}
          />
          <div className="pb-2.5">
            <label className="flex items-center gap-2 text-sm text-base-content/70">
              <Toggle
                checked={draft.active}
                onChange={(v) => setDraft({ ...draft, active: v })}
                aria-label="Question active"
              />
              {draft.active ? "Active" : "Inactive"}
            </label>
          </div>
        </div>
        {draft.type === "texte" && (
          <TextInput
            label="Texte d'aide du champ"
            placeholder="Précisez votre choix d'huile"
            value={draft.placeholder}
            onChange={(v) => setDraft({ ...draft, placeholder: v })}
          />
        )}
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button type="button" onClick={onSave} disabled={!valid} className={btnPrimary}>
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function QuestionsPanel({ serviceId, questions, onUpsert, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(draftOf());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setConfirmId(null);
    setDraft(draftOf());
    setCreating(true);
  };
  const startEdit = (q: ServiceQuestion) => {
    setCreating(false);
    setConfirmId(null);
    setEditingId(q.id);
    setDraft(draftOf(q));
  };
  const reset = () => {
    setEditingId(null);
    setCreating(false);
  };
  const commit = (id: string) => {
    onUpsert({
      id,
      serviceId,
      label: draft.label.trim(),
      type: draft.type,
      placeholder: draft.type === "texte" ? draft.placeholder.trim() || undefined : undefined,
      active: draft.active,
    });
    reset();
  };

  return (
    <SectionCard
      title="Questions de réservation"
      description="Obligatoires : la cliente y répond avant de réserver une prestation de cette catégorie."
    >
      {questions.length === 0 && !creating ? (
        <p className="rounded-xl border border-dashed border-base-300 px-4 py-10 text-center text-sm text-base-content/60">
          Aucune question pour cette catégorie.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {questions.map((q) =>
            editingId === q.id ? (
              <li key={q.id}>
                <QuestionForm
                  title="Modifier la question"
                  draft={draft}
                  setDraft={setDraft}
                  onSave={() => commit(q.id)}
                  onCancel={reset}
                  saveLabel="Enregistrer"
                />
              </li>
            ) : (
              <li
                key={q.id}
                className="flex items-center gap-4 rounded-xl border border-base-300 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-base-content">
                    {q.label}
                    {!q.active && (
                      <span className="ml-2 text-xs font-medium text-base-content/45">Inactive</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-base-content/60">
                    Réponse : {questionTypeLabel(q.type)}
                    {q.type === "texte" && q.placeholder && <> · « {q.placeholder} »</>}
                  </p>
                </div>
                {confirmId === q.id ? (
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-base-content/60">Supprimer&nbsp;?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(q.id);
                        setConfirmId(null);
                      }}
                      className="font-semibold text-error-600 hover:underline"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="font-medium text-base-content/60 hover:underline"
                    >
                      Non
                    </button>
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(q)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(q.id)}
                      aria-label={`Supprimer la question « ${q.label} »`}
                      className="rounded-lg p-1.5 text-base-content/45 transition hover:bg-error-50 hover:text-error-600"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      <div className="mt-6 border-t border-base-300 pt-6">
        {creating ? (
          <QuestionForm
            title="Ajouter une question"
            draft={draft}
            setDraft={setDraft}
            onSave={() => commit(newId("q"))}
            onCancel={reset}
            saveLabel="Ajouter la question"
          />
        ) : (
          <button type="button" onClick={startCreate} className={btnPrimary}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ajouter une question
          </button>
        )}
      </div>
    </SectionCard>
  );
}
