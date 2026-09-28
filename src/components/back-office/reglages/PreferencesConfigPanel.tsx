"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";
import { Select } from "@/components/ui/atoms/select";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Alert } from "@/components/ui/molecules/alert";
import { usePreferenceConfig } from "@/context/PreferencesContext";
import {
  BAR_RUBRIC,
  EMPTY_TARGET,
  newPrefId,
  targetIsEmpty,
  type PreferenceOption,
  type PreferenceQuestion,
  type PreferenceTarget,
} from "@/lib/mock/preferences";
import {
  BAR_LABEL,
  PREFERENCE_RUBRICS,
  catalogServices,
  prestationsOf,
  rubricLabel,
  rubricOf,
  rubricsWithoutQuestion,
  targetParts,
  touchesRubric,
} from "@/lib/mock/preference-targets";
import { cn } from "@/lib/utils";
import ImagePicker from "../shared/ImagePicker";
import { SettingRow, TextInput, Toggle } from "../fidelite/ui";
import { EditorPanel, EmptyRow, SettingsGroup, btnBrand, btnOutline } from "./kit";

// Réglages › Préférences clientes — refonte 2026-09-28. Une question n'est
// plus rangée dans un « domaine » fixe : on coche APRÈS QUELLES PRESTATIONS
// elle est posée (catégories entières, prestations précises, boissons du bar).
// La caisse la pose après l'encaissement d'une visite qui en comprenait une ;
// la fiche cliente range ses réponses sous la catégorie qu'elle vise.
//
// 1. Où en est la propriétaire ? Posée, en mise en place, rarement : régler ce
//    qu'on demande après tel soin, ajouter une réponse ou une photo, combler une
//    catégorie après laquelle rien n'est demandé.
// 2. Ce qui doit sauter aux yeux : pour chaque catégorie, les questions posées
//    après — et, pour chacune, « Posée après … » en toutes lettres.
// 3. Cas dégradés : catégorie sans question → listée en bas, avec un ajout
//    direct ; filtre sans résultat → état vide + ajout ; question sans cible,
//    sans libellé ou à moins de deux réponses → enregistrement bloqué, le
//    manque est écrit ; suppression → confirmée (désactiver garde l'historique).

const ALL = "all";

const blankQuestion = (target: PreferenceTarget): PreferenceQuestion => ({
  id: "",
  target,
  title: "",
  subtitle: "",
  noteLabel: "",
  multiple: true,
  askedAtCounter: true,
  active: true,
  options: [],
});

const targetForRubric = (key: string): PreferenceTarget =>
  key === BAR_RUBRIC
    ? { ...EMPTY_TARGET, drinks: true }
    : { ...EMPTY_TARGET, serviceIds: [key] };

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/* ------------------------------------------------------------ liste */

function TargetLine({ target, asked, highlight }: { target: PreferenceTarget; asked: boolean; highlight?: string }) {
  const parts = targetParts(target);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-sm">
      {/* Pas posée à la caisse : la cible ne dit plus « quand », seulement « pour quoi ». */}
      <span className="text-base-content/55">{asked ? "Posée après" : "Concerne"}</span>
      {parts.map((p) => (
        <span
          key={p.key}
          className={cn(
            "inline-flex items-baseline gap-1.5 rounded-field border px-2 py-0.5",
            p.key === highlight ? "border-transparent bg-accent text-secondary" : "border-base-300 text-base-content/80",
          )}
        >
          <span className="font-medium">{p.label}</span>
          {p.detail && <span className={p.key === highlight ? "text-secondary/80" : "text-base-content/55"}>{p.detail}</span>}
        </span>
      ))}
    </p>
  );
}

function OptionPills({ options }: { options: PreferenceOption[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Réponses proposées">
      {options.map((o) => (
        <li
          key={o.id}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-field bg-base-200 pr-3 text-[13px] text-base-content/80",
            o.photo ? "pl-1" : "pl-3",
          )}
        >
          {o.photo && (
            // eslint-disable-next-line @next/next/no-img-element -- photo locale ou dataURL de session
            <img src={o.photo} alt="" className="size-8 rounded-[6px] object-cover" />
          )}
          {o.label}
        </li>
      ))}
    </ul>
  );
}

function QuestionRow({
  q,
  highlight,
  move,
  onEdit,
}: {
  q: PreferenceQuestion;
  highlight?: string;
  /** Absent en vue filtrée : l'ordre se règle dans la rubrique, vue complète. */
  move?: { first: boolean; last: boolean; onMove: (d: -1 | 1) => void };
  onEdit: () => void;
}) {
  return (
    <div className="group flex gap-6 px-6 py-5 transition-colors hover:bg-base-200/40">
      <div className={cn("min-w-0 flex-1 space-y-2.5", !q.active && "opacity-60")}>
        <div>
          <p className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="text-left text-[15px] font-semibold text-base-content underline-offset-4 hover:underline"
            >
              {q.title}
            </button>
            {!q.active && (
              <Badge variant="warning" className="badge-sm">
                Inactive
              </Badge>
            )}
          </p>
          <p className="mt-0.5 text-sm text-base-content/60">
            {[
              q.askedAtCounter ? "Posée à la caisse" : "Pas posée à la caisse",
              q.multiple ? "plusieurs réponses" : "une seule réponse",
              `« ${q.noteLabel} » sur la fiche`,
            ].join(" · ")}
          </p>
        </div>
        <TargetLine target={q.target} asked={q.askedAtCounter} highlight={highlight} />
        <OptionPills options={q.options} />
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {move && (
          <>
            <button
              type="button"
              disabled={move.first}
              onClick={() => move.onMove(-1)}
              aria-label={`Monter « ${q.title} »`}
              className="btn btn-ghost btn-sm btn-square text-base-content/55 disabled:!bg-transparent disabled:opacity-25"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              disabled={move.last}
              onClick={() => move.onMove(1)}
              aria-label={`Descendre « ${q.title} »`}
              className="btn btn-ghost btn-sm btn-square text-base-content/55 disabled:!bg-transparent disabled:opacity-25"
            >
              <ArrowDown className="size-4" aria-hidden />
            </button>
          </>
        )}
        <button type="button" onClick={onEdit} className={cn(btnOutline, "ml-1")}>
          Modifier
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------ choix des prestations */

type TriState = "none" | "some" | "all";

function TriCheckbox({
  state,
  onToggle,
  label,
}: {
  state: TriState;
  onToggle: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={state === "all"}
      ref={(el) => {
        if (el) el.indeterminate = state === "some";
      }}
      onChange={onToggle}
      className="checkbox checkbox-primary checkbox-sm shrink-0"
    />
  );
}

function TargetPicker({
  value,
  onChange,
}: {
  value: PreferenceTarget;
  onChange: (t: PreferenceTarget) => void;
}) {
  const [query, setQuery] = useState("");
  // Catégories dépliées : d'emblée celles où des prestations sont cochées une à une.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(catalogServices.filter((s) => value.prestationIds.some((id) => prestationsOf(s.id).some((p) => p.id === id))).map((s) => s.id)),
  );
  const q = fold(query.trim());

  const toggleOpen = (id: string) =>
    setOpen((o) => {
      const next = new Set(o);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stateOf = (serviceId: string): TriState => {
    if (value.serviceIds.includes(serviceId)) return "all";
    const ids = new Set(prestationsOf(serviceId).map((p) => p.id));
    return value.prestationIds.some((id) => ids.has(id)) ? "some" : "none";
  };

  const withoutService = (serviceId: string): PreferenceTarget => {
    const ids = new Set(prestationsOf(serviceId).map((p) => p.id));
    return {
      ...value,
      serviceIds: value.serviceIds.filter((x) => x !== serviceId),
      prestationIds: value.prestationIds.filter((x) => !ids.has(x)),
    };
  };

  // Case de catégorie : vide ou partielle → toute la catégorie ; pleine → rien.
  const toggleService = (serviceId: string) => {
    const base = withoutService(serviceId);
    onChange(stateOf(serviceId) === "all" ? base : { ...base, serviceIds: [...base.serviceIds, serviceId] });
  };

  // Case de prestation. Décocher une prestation d'une catégorie entière la
  // redéfinit en « toutes sauf celle-ci » ; tout cocher une à une revient à
  // la catégorie entière.
  const togglePrestation = (serviceId: string, prestationId: string) => {
    const all = prestationsOf(serviceId).map((p) => p.id);
    const base = withoutService(serviceId);
    let picked: string[];
    if (value.serviceIds.includes(serviceId)) picked = all.filter((id) => id !== prestationId);
    else {
      const cur = value.prestationIds.filter((id) => all.includes(id));
      picked = cur.includes(prestationId) ? cur.filter((id) => id !== prestationId) : [...cur, prestationId];
    }
    if (picked.length === all.length) onChange({ ...base, serviceIds: [...base.serviceIds, serviceId] });
    else onChange({ ...base, prestationIds: [...base.prestationIds, ...picked] });
  };

  const parts = targetParts(value);
  const barVisible = !q || fold(BAR_LABEL).includes(q);
  let shown = 0;

  return (
    <div className="space-y-3">
      <p className={cn("text-sm", parts.length ? "text-base-content/70" : "text-warning-700")}>
        {parts.length
          ? `Sélection : ${parts.map((p) => (p.detail ? `${p.label} (${p.detail})` : p.label)).join(", ")}.`
          : "Cochez au moins une catégorie, une prestation ou les boissons du bar."}
      </p>
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher une prestation"
        aria-label="Chercher une prestation"
        className="input-sm"
      />
      <ul className="divide-y divide-base-300 overflow-hidden rounded-box border border-base-300">
        {catalogServices.map((s) => {
          const prestations = prestationsOf(s.id);
          const nameMatch = q !== "" && fold(s.name).includes(q);
          const matching = q && !nameMatch ? prestations.filter((p) => fold(p.name).includes(q)) : prestations;
          if (q && matching.length === 0) return null;
          shown++;
          const state = stateOf(s.id);
          const pickedCount =
            state === "all" ? prestations.length : value.prestationIds.filter((id) => prestations.some((p) => p.id === id)).length;
          const expanded = open.has(s.id) || (q !== "" && !nameMatch);
          const groups = [
            ...s.subcategories.map((sub) => ({
              id: sub.id,
              name: sub.name,
              items: matching.filter((p) => p.subcategoryId === sub.id),
            })),
            {
              id: "autres",
              name: s.subcategories.length ? "Autres" : "",
              items: matching.filter((p) => !s.subcategories.some((sub) => sub.id === p.subcategoryId)),
            },
          ].filter((g) => g.items.length > 0);
          return (
            <li key={s.id}>
              <div className={cn("flex items-center gap-3 px-4 py-2.5", state !== "none" && "bg-accent/40")}>
                <TriCheckbox state={state} onToggle={() => toggleService(s.id)} label={`Toute la catégorie ${s.name}`} />
                <button
                  type="button"
                  onClick={() => toggleOpen(s.id)}
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="truncate text-[15px] font-medium text-base-content">{s.name}</span>
                  <span className="ml-auto shrink-0 text-sm tabular-nums text-base-content/55">
                    {state === "all"
                      ? "toute la catégorie"
                      : state === "some"
                        ? `${pickedCount} sur ${prestations.length}`
                        : `${prestations.length} prestation${prestations.length > 1 ? "s" : ""}`}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className={cn("size-4 shrink-0 text-base-content/45 transition-transform", expanded && "rotate-90")}
                  />
                </button>
              </div>
              {expanded && (
                <div className="border-t border-base-300 bg-base-100 py-1.5 pl-11 pr-4">
                  {groups.map((g) => (
                    <div key={g.id} className="py-1">
                      {g.name && <p className="pb-0.5 pt-1.5 text-xs font-medium text-base-content/50">{g.name}</p>}
                      {g.items.map((p) => {
                        const checked = state === "all" || value.prestationIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-field py-1.5 hover:bg-base-200/60">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePrestation(s.id, p.id)}
                              className="checkbox checkbox-primary checkbox-xs shrink-0"
                            />
                            <span className="text-sm text-base-content/85">{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {barVisible && (
          <li className={cn("flex items-center gap-3 px-4 py-2.5", value.drinks && "bg-accent/40")}>
            <TriCheckbox
              state={value.drinks ? "all" : "none"}
              onToggle={() => onChange({ ...value, drinks: !value.drinks })}
              label={BAR_LABEL}
            />
            <span className="text-[15px] font-medium text-base-content">{BAR_LABEL}</span>
            <span className="ml-auto text-sm text-base-content/55">quand elle a pris une boisson</span>
          </li>
        )}
        {q && shown === 0 && !barVisible && (
          <li className="px-4 py-6 text-center text-sm text-base-content/55">Aucune prestation ne correspond à « {query.trim()} ».</li>
        )}
      </ul>
      <p className="text-xs text-base-content/55">
        Une catégorie cochée entière inclut aussi les prestations qui y seront ajoutées plus tard.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ éditeur */

function EditorSection({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-base-300 pt-6 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-[15px] font-semibold text-base-content">{title}</h3>
        {help && <p className="mt-0.5 text-sm text-base-content/60">{help}</p>}
      </div>
      {children}
    </section>
  );
}

function QuestionEditor({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: PreferenceQuestion;
  onClose: () => void;
  onSave: (q: PreferenceQuestion) => void;
  onDelete: () => void;
}) {
  const isNew = !initial.id;
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
  const withoutPhoto = filledOptions.filter((o) => !o.photo).length;
  const missing = [
    q.title.trim() ? null : "la question",
    q.noteLabel.trim() ? null : "le libellé sur la fiche",
    targetIsEmpty(q.target) ? "au moins une prestation" : null,
    filledOptions.length >= 2 ? null : `${2 - filledOptions.length} réponse${filledOptions.length === 1 ? "" : "s"}`,
    withoutPhoto ? `la photo de ${withoutPhoto} réponse${withoutPhoto > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  const rubric = rubricOf(q);

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
    <EditorPanel
      open
      title={isNew ? "Nouvelle question" : "Modifier la question"}
      onClose={onClose}
      onSubmit={save}
      submitLabel={isNew ? "Ajouter la question" : "Enregistrer"}
      canSubmit={missing.length === 0}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <EditorSection title="La question">
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
            hint={
              q.noteLabel && rubric
                ? `La fiche affichera « ${q.noteLabel} : … » sous ${rubricLabel(rubric)}.`
                : "Un mot court : « Type », « Longueur »…"
            }
          />
        </EditorSection>

        <EditorSection
          title="Prestations concernées"
          help={
            q.askedAtCounter
              ? "La caisse pose la question après une visite qui comprenait une de ces prestations."
              : "Pas posée à la caisse pour l'instant : ces prestations disent seulement à quoi la question se rapporte."
          }
        >
          <TargetPicker value={q.target} onChange={(t) => set("target", t)} />
        </EditorSection>

        <EditorSection title="Fonctionnement">
          <div className="space-y-4 rounded-box border border-base-300 p-4">
            <SettingRow
              title="Posée à la caisse"
              description="La réceptionniste la pose après l'encaissement (« Noter la cliente »). Sinon, elle se remplit depuis la fiche cliente."
              control={<Toggle checked={q.askedAtCounter} onChange={(v) => set("askedAtCounter", v)} aria-label="Posée à la caisse" />}
            />
            <SettingRow
              title="Plusieurs réponses possibles"
              description="Sinon, une seule réponse par passage."
              control={<Toggle checked={q.multiple} onChange={(v) => set("multiple", v)} aria-label="Plusieurs réponses possibles" />}
            />
            <SettingRow
              title="Active"
              description="Inactive : plus posée, mais les réponses déjà données restent sur les fiches."
              control={<Toggle checked={q.active} onChange={(v) => set("active", v)} aria-label="Question active" />}
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Réponses proposées"
          help="Au moins deux, chacune avec sa photo : la réceptionniste reconnaît la réponse d'un coup d'œil. Cliquez sur une vignette pour la changer."
        >
          <ul className="space-y-3">
            {q.options.map((o, i) => (
              <li
                key={o.id}
                className={cn(
                  "flex items-start gap-3 rounded-box border bg-base-100 p-3",
                  o.label.trim() && !o.photo ? "border-warning-300" : "border-base-300",
                )}
              >
                <ImagePicker
                  value={o.photo ?? null}
                  onChange={(v) => setOption(o.id, { photo: v ?? undefined })}
                  label={`la photo de « ${o.label || "cette réponse"} »`}
                  size={76}
                  fit="cover"
                  compact
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
                    <ArrowUp className="size-3.5" aria-hidden />
                  </button>
                  <button type="button" disabled={i === q.options.length - 1} onClick={() => moveOption(i, 1)} aria-label="Descendre la réponse" className="btn btn-ghost btn-xs btn-square disabled:!bg-transparent disabled:opacity-30">
                    <ArrowDown className="size-3.5" aria-hidden />
                  </button>
                  <button type="button" onClick={() => set("options", q.options.filter((x) => x.id !== o.id))} aria-label="Retirer la réponse" className="btn btn-ghost btn-xs btn-square text-base-content/45 hover:text-error">
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => set("options", [...q.options, { id: newPrefId("opt"), label: "" }])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
          >
            <Plus className="size-4" aria-hidden />
            Ajouter une réponse
          </button>
          {!isNew && (
            <Alert
              tone="info"
              title="Renommer une réponse"
              description="Les fiches gardent l'identifiant de la réponse : renommer « Gel X » change le libellé partout, y compris dans l'historique des clientes."
            />
          )}
        </EditorSection>

        {missing.length > 0 && (
          <p role="status" className="text-sm text-warning-700">
            Pour enregistrer, il manque : {missing.join(", ")}.
          </p>
        )}

        {!isNew && (
          <div className="border-t border-base-300 pt-5 text-sm">
            {confirmDelete ? (
              <span className="flex flex-wrap items-center gap-3">
                <span className="text-base-content/60">Les réponses déjà données disparaîtront des fiches.</span>
                <button type="button" onClick={onDelete} className="font-semibold text-error-600 hover:underline">
                  Supprimer
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-base-content/60 hover:underline">
                  Annuler
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-base-content/55 hover:text-error-600">
                Supprimer la question
              </button>
            )}
          </div>
        )}
      </div>
    </EditorPanel>
  );
}

/* ------------------------------------------------------------ écran */

export default function PreferencesConfigPanel() {
  const { questions, upsertQuestion, deleteQuestion, moveQuestion } = usePreferenceConfig();
  const [filter, setFilter] = useState<string>(ALL);
  // `undefined` = aucun panneau ; question avec id vide = création.
  const [editing, setEditing] = useState<PreferenceQuestion | undefined>(undefined);

  const addFor = (rubric?: string) => setEditing(blankQuestion(rubric ? targetForRubric(rubric) : EMPTY_TARGET));

  const filterOptions = [
    { value: ALL, label: `Toutes les catégories (${questions.length})` },
    ...PREFERENCE_RUBRICS.map((r) => {
      const n = questions.filter((q) => touchesRubric(q, r.key)).length;
      return { value: r.key, label: `${r.label} (${n})` };
    }),
  ];

  const groups = PREFERENCE_RUBRICS.map((rubric) => ({
    rubric,
    items: questions.filter((q) => rubricOf(q) === rubric.key),
  })).filter((g) => g.items.length > 0);
  const uncovered = rubricsWithoutQuestion(questions);
  const filtered = filter === ALL ? [] : questions.filter((q) => touchesRubric(q, filter));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <label className="flex items-center gap-3">
          <span className="text-sm font-medium text-base-content/70">Questions posées après</span>
          <Select
            value={filter}
            onChange={setFilter}
            options={filterOptions}
            size="compact"
            className="w-72"
            aria-label="Filtrer par catégorie"
          />
        </label>
        <button type="button" onClick={() => addFor(filter === ALL ? undefined : filter)} className={cn(btnBrand, "gap-1.5")}>
          <Plus aria-hidden className="size-4" />
          Ajouter une question
        </button>
      </div>

      {filter === ALL ? (
        <>
          {groups.map(({ rubric, items }) => (
            <SettingsGroup
              key={rubric.key}
              title={rubric.label}
              action={
                <button type="button" onClick={() => addFor(rubric.key)} className={cn(btnOutline, "gap-1.5")}>
                  <Plus aria-hidden className="size-4" />
                  Question
                </button>
              }
            >
              {items.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  onEdit={() => setEditing(q)}
                  move={{ first: i === 0, last: i === items.length - 1, onMove: (d) => moveQuestion(q.id, d) }}
                />
              ))}
            </SettingsGroup>
          ))}

          {uncovered.length > 0 && (
            <SettingsGroup
              title="Rien n'est demandé après"
              description="Aucune question active ne vise ces catégories : la caisse n'y demande aucune préférence."
            >
              {uncovered.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-4 px-6 py-3">
                  <span className="text-[15px] text-base-content/80">{r.label}</span>
                  <button type="button" onClick={() => addFor(r.key)} className={cn(btnOutline, "gap-1.5")}>
                    <Plus aria-hidden className="size-4" />
                    Ajouter une question
                  </button>
                </div>
              ))}
            </SettingsGroup>
          )}
        </>
      ) : (
        <SettingsGroup
          title={`Après ${rubricLabel(filter)}`}
          description="Les questions qui visent toute la catégorie ou certaines de ses prestations."
        >
          {filtered.length === 0 ? (
            <EmptyRow>Aucune question n&apos;est posée après {rubricLabel(filter)}.</EmptyRow>
          ) : (
            filtered.map((q) => <QuestionRow key={q.id} q={q} highlight={filter} onEdit={() => setEditing(q)} />)
          )}
        </SettingsGroup>
      )}

      {editing && (
        <QuestionEditor
          key={editing.id || "new"}
          initial={editing}
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
