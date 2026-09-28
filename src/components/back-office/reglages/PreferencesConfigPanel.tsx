"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Plus, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/atoms/card";
import { Badge } from "@/components/ui/atoms/badge";
import { EmptyState } from "@/components/ui/molecules/empty-state";
import { Alert } from "@/components/ui/molecules/alert";
import { usePreferenceConfig } from "@/context/PreferencesContext";
import {
  PREFERENCE_DOMAINS,
  PREFERENCE_DOMAIN_LABEL,
  newPrefId,
  type PreferenceDomain,
  type PreferenceOption,
  type PreferenceQuestion,
} from "@/lib/mock/preferences";
import { cn } from "@/lib/utils";
import DetailModal from "../detail/DetailModal";
import ImagePicker from "../shared/ImagePicker";
import { SettingRow, TextInput, Toggle, btnGhost, btnOutline, btnPrimary } from "../fidelite/ui";

// Réglages › Préférences clientes (2026-09-27) — le back-office DÉFINIT les
// questions et leurs options ; la caisse de point-de-vente les pose après
// l'encaissement (« Noter la cliente »), la fiche cliente et la fiche
// rendez-vous en affichent les réponses.
//
// 1. Où en est la propriétaire ? En mise en place, posée, rarement : ajouter
//    une réponse (« Chrome »), une photo, une question pour un domaine qui n'en
//    a pas encore.
// 2. Ce qui doit sauter aux yeux : par domaine, les questions et leurs options
//    telles que la réceptionniste les verra — en tuiles, photo comprise.
// 3. Cas dégradés : domaine sans question → état vide + ajout ; question à
//    moins de deux réponses → enregistrement bloqué ; suppression → confirmée,
//    avec l'avertissement que les réponses déjà données disparaissent des
//    fiches (désactiver la question les garde).

const BLANK = (domain: PreferenceDomain): PreferenceQuestion => ({
  id: "",
  domain,
  title: "",
  subtitle: "",
  noteLabel: "",
  multiple: true,
  askedAtCounter: false,
  active: true,
  options: [],
});

function OptionTile({ option }: { option: PreferenceOption }) {
  return (
    <span className="flex w-24 flex-col overflow-hidden rounded-field border border-base-300 bg-white">
      <span className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden bg-base-200">
        {option.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo locale ou dataURL de session
          <img src={option.photo} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <ImageIcon aria-hidden className="size-5 text-base-content/25" />
        )}
      </span>
      <span className="truncate px-2 py-1.5 text-center text-xs font-medium text-base-content">
        {option.label}
      </span>
    </span>
  );
}

function QuestionCard({
  q,
  first,
  last,
  onEdit,
  onMove,
}: {
  q: PreferenceQuestion;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onMove: (d: -1 | 1) => void;
}) {
  return (
    <Card className={cn("p-6", !q.active && "opacity-70")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[17px] font-semibold text-base-content">
            {q.title}
            {!q.active && (
              <Badge variant="warning" className="badge-sm">
                Inactive
              </Badge>
            )}
          </p>
          <p className="mt-0.5 text-sm text-base-content/60">{q.subtitle}</p>
          <p className="mt-2 text-sm text-base-content/55">
            {[
              q.multiple ? "Plusieurs réponses" : "Une seule réponse",
              q.askedAtCounter ? "Posée à la caisse" : "Hors caisse",
              `Sur la fiche : « ${q.noteLabel} »`,
            ].join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={first}
            onClick={() => onMove(-1)}
            aria-label="Monter la question"
            className="btn btn-ghost btn-sm btn-square text-base-content/55 disabled:!bg-transparent disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            disabled={last}
            onClick={() => onMove(1)}
            aria-label="Descendre la question"
            className="btn btn-ghost btn-sm btn-square text-base-content/55 disabled:!bg-transparent disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <button type="button" onClick={onEdit} className={cn(btnOutline, "ml-2")}>
            Modifier
          </button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {q.options.map((o) => (
          <OptionTile key={o.id} option={o} />
        ))}
      </div>
    </Card>
  );
}

function QuestionEditor({
  initial,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  initial: PreferenceQuestion;
  isNew: boolean;
  onClose: () => void;
  onSave: (q: PreferenceQuestion) => void;
  onDelete: () => void;
}) {
  const [q, setQ] = useState<PreferenceQuestion>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof PreferenceQuestion>(k: K, v: PreferenceQuestion[K]) => setQ((x) => ({ ...x, [k]: v }));
  const setOption = (id: string, patch: Partial<PreferenceOption>) =>
    set("options", q.options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const moveOption = (i: number, d: -1 | 1) => {
    const next = [...q.options];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set("options", next);
  };

  const filledOptions = q.options.filter((o) => o.label.trim());
  const valid = q.title.trim() !== "" && q.noteLabel.trim() !== "" && filledOptions.length >= 2;

  const save = () =>
    onSave({
      ...q,
      id: q.id || newPrefId("pq"),
      title: q.title.trim(),
      subtitle: q.subtitle.trim() || (q.multiple ? "Plusieurs réponses possibles." : "Une seule réponse."),
      noteLabel: q.noteLabel.trim(),
      options: filledOptions.map((o) => ({ ...o, label: o.label.trim(), hint: o.hint?.trim() || undefined })),
    });

  return (
    <DetailModal
      title={`${PREFERENCE_DOMAIN_LABEL[q.domain]} · ${isNew ? "Nouvelle question" : "Question"}`}
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <TextInput
          label="Question posée"
          value={q.title}
          onChange={(v) => set("title", v)}
          placeholder="Quel type d'ongles a-t-elle fait ?"
        />
        <TextInput
          label="Consigne sous la question"
          value={q.subtitle}
          onChange={(v) => set("subtitle", v)}
          placeholder="Touchez tout ce qu'elle a fait et apprécié."
          hint="Laissée vide, elle suit le nombre de réponses autorisé."
        />
        <TextInput
          label="Libellé sur la fiche cliente"
          value={q.noteLabel}
          onChange={(v) => set("noteLabel", v)}
          placeholder="Type"
          hint={q.noteLabel ? `La fiche affichera « ${q.noteLabel} : … »` : "Un mot court : « Type », « Longueur »…"}
        />

        <div className="space-y-4 rounded-box border border-base-300 p-4">
          <SettingRow
            title="Plusieurs réponses possibles"
            description="Sinon, une seule réponse par passage."
            control={<Toggle checked={q.multiple} onChange={(v) => set("multiple", v)} aria-label="Plusieurs réponses possibles" />}
          />
          <SettingRow
            title="Posée à la caisse"
            description="La réceptionniste la pose après l'encaissement (« Noter la cliente »)."
            control={<Toggle checked={q.askedAtCounter} onChange={(v) => set("askedAtCounter", v)} aria-label="Posée à la caisse" />}
          />
          <SettingRow
            title="Active"
            description="Inactive : plus posée, mais les réponses déjà données restent sur les fiches."
            control={<Toggle checked={q.active} onChange={(v) => set("active", v)} aria-label="Question active" />}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-base-content/70">Réponses</p>
          <p className="text-xs text-base-content/55">Au moins deux. La photo aide la réceptionniste à reconnaître la réponse d&apos;un coup d&apos;œil.</p>
          <ul className="mt-3 space-y-3">
            {q.options.map((o, i) => (
              <li key={o.id} className="flex items-start gap-3 rounded-box border border-base-300 bg-white p-3">
                <ImagePicker
                  value={o.photo ?? null}
                  onChange={(v) => setOption(o.id, { photo: v ?? undefined })}
                  label={`la photo de « ${o.label || "cette réponse"} »`}
                  size={64}
                  fit="cover"
                />
                <div className="grid min-w-0 flex-1 gap-2">
                  <input
                    value={o.label}
                    onChange={(e) => setOption(o.id, { label: e.target.value })}
                    placeholder="Libellé (ex. Gel X)"
                    aria-label="Libellé de la réponse"
                    className="input input-sm w-full bg-base-100 text-sm"
                  />
                  <input
                    value={o.hint ?? ""}
                    onChange={(e) => setOption(o.id, { hint: e.target.value })}
                    placeholder="Précision facultative (ex. Chrome, cat eye)"
                    aria-label="Précision de la réponse"
                    className="input input-sm w-full bg-base-100 text-sm"
                  />
                </div>
                <div className="flex shrink-0 flex-col">
                  <button type="button" disabled={i === 0} onClick={() => moveOption(i, -1)} aria-label="Monter la réponse" className="btn btn-ghost btn-xs btn-square disabled:!bg-transparent disabled:opacity-30">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" disabled={i === q.options.length - 1} onClick={() => moveOption(i, 1)} aria-label="Descendre la réponse" className="btn btn-ghost btn-xs btn-square disabled:!bg-transparent disabled:opacity-30">
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => set("options", q.options.filter((x) => x.id !== o.id))} aria-label="Retirer la réponse" className="btn btn-ghost btn-xs btn-square text-base-content/45 hover:text-error">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => set("options", [...q.options, { id: newPrefId("opt"), label: "" }])}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
          >
            <Plus className="size-4" />
            Ajouter une réponse
          </button>
        </div>

        {!isNew && (
          <Alert
            tone="info"
            title="Modifier une réponse existante"
            description="Les fiches gardent l'identifiant de la réponse : renommer « Gel X » change le libellé partout, y compris dans l'historique des clientes."
          />
        )}

        <div className="flex items-center gap-2 border-t border-base-300 pt-6">
          <button type="button" disabled={!valid} onClick={save} className={btnPrimary}>
            {isNew ? "Ajouter la question" : "Enregistrer"}
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Annuler
          </button>
          {!isNew &&
            (confirmDelete ? (
              <span className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-base-content/60">Les réponses déjà données disparaîtront des fiches.</span>
                <button type="button" onClick={onDelete} className="font-semibold text-error hover:underline">
                  Supprimer
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-base-content/60 hover:underline">
                  Annuler
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="ml-auto text-sm text-base-content/55 hover:text-error">
                Supprimer la question
              </button>
            ))}
        </div>
      </div>
    </DetailModal>
  );
}

export default function PreferencesConfigPanel() {
  const { questions, upsertQuestion, deleteQuestion, moveQuestion } = usePreferenceConfig();
  const [domain, setDomain] = useState<PreferenceDomain>("onglerie");
  // `undefined` = aucun panneau ; question avec id vide = création.
  const [editing, setEditing] = useState<PreferenceQuestion | undefined>(undefined);

  const inDomain = questions.filter((q) => q.domain === domain);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6 border-b border-base-300">
        {/* Un domaine = un onglet ; le compteur dit combien de questions y sont posées. */}
        <div role="tablist" aria-label="Domaine de préférence" className="-mb-px flex gap-6">
          {PREFERENCE_DOMAINS.map((d) => {
            const active = d === domain;
            const count = questions.filter((q) => q.domain === d).length;
            return (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDomain(d)}
                className={cn(
                  "flex items-center gap-2 border-b-2 pb-3 pt-1 text-[15px] transition-colors",
                  active
                    ? "border-primary font-semibold text-base-content"
                    : "border-transparent text-base-content/60 hover:text-base-content",
                )}
              >
                {PREFERENCE_DOMAIN_LABEL[d]}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-accent text-secondary" : "bg-base-200 text-base-content/55",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => setEditing(BLANK(domain))} className={cn(btnOutline, "mb-2.5 gap-1.5")}>
          <Plus aria-hidden className="size-4" />
          Ajouter une question
        </button>
      </div>

      {inDomain.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sparkles />}
            title={`Aucune question pour « ${PREFERENCE_DOMAIN_LABEL[domain]} »`}
            subtitle="Sans question, ce domaine n'a que sa note libre sur les fiches clientes."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {inDomain.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              first={i === 0}
              last={i === inDomain.length - 1}
              onEdit={() => setEditing(q)}
              onMove={(d) => moveQuestion(q.id, d)}
            />
          ))}
        </div>
      )}

      {editing && (
        <QuestionEditor
          key={editing.id || "new"}
          initial={editing}
          isNew={!editing.id}
          onClose={() => setEditing(undefined)}
          onSave={(q) => {
            upsertQuestion(q);
            setEditing(undefined);
          }}
          onDelete={() => {
            deleteQuestion(editing.id);
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
