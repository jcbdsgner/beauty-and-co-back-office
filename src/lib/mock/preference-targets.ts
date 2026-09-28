// Préférences clientes × catalogue (2026-09-28). `./preferences` décrit les
// questions sans connaître le catalogue (il est importé par `beautyandco.ts`,
// qu'importe aussi `./services` : le lier ici évite le cycle). Ce module répond
// aux questions qui demandent le catalogue :
// - après quelles prestations une question est-elle posée ?
// - dans quelle rubrique ses réponses se lisent-elles sur la fiche cliente ?
//
// Rubrique d'une question = la première catégorie cochée entière (ordre du
// catalogue), sinon la catégorie de sa première prestation cochée, sinon
// « Boissons » si elle vise le bar. Une question posée après plusieurs
// catégories se range donc sous une seule, calculée — rien à régler en plus.

import {
  BAR_RUBRIC,
  notationTally,
  takenOptions,
  type ClientPreferences,
  type PreferenceQuestion,
  type PreferenceTarget,
  type QuestionTally,
} from "./preferences";
import { prestationSeeds, serviceSeeds, type Prestation, type Service } from "./services";

export type Rubric = { key: string; label: string };

export const BAR_LABEL = "Boissons du bar";

/** Catégories du catalogue dans leur ordre, puis les boissons du bar. */
export const PREFERENCE_RUBRICS: Rubric[] = [
  ...serviceSeeds.map((s) => ({ key: s.id, label: s.name })),
  { key: BAR_RUBRIC, label: "Boissons" },
];

const RUBRIC_ORDER = new Map(PREFERENCE_RUBRICS.map((r, i) => [r.key, i]));
const PRESTATION_ORDER = new Map(prestationSeeds.map((p, i) => [p.id, i]));
const prestationById = new Map(prestationSeeds.map((p) => [p.id, p]));

export const rubricLabel = (key: string) =>
  PREFERENCE_RUBRICS.find((r) => r.key === key)?.label ?? "Autres";

export const catalogServices: Service[] = serviceSeeds;

export const prestationsOf = (serviceId: string): Prestation[] =>
  prestationSeeds.filter((p) => p.serviceId === serviceId);

export const serviceOfPrestation = (prestationId: string): string | null =>
  prestationById.get(prestationId)?.serviceId ?? null;

export function rubricOf(q: PreferenceQuestion): string | null {
  const whole = [...q.target.serviceIds].sort(
    (a, b) => (RUBRIC_ORDER.get(a) ?? 99) - (RUBRIC_ORDER.get(b) ?? 99),
  )[0];
  if (whole) return whole;
  const firstPrestation = [...q.target.prestationIds].sort(
    (a, b) => (PRESTATION_ORDER.get(a) ?? 999) - (PRESTATION_ORDER.get(b) ?? 999),
  )[0];
  const service = firstPrestation ? serviceOfPrestation(firstPrestation) : null;
  if (service) return service;
  return q.target.drinks ? BAR_RUBRIC : null;
}

/** La question est-elle posée après cette prestation ? */
export const askedAfterPrestation = (q: PreferenceQuestion, prestationId: string) => {
  const service = serviceOfPrestation(prestationId);
  return (
    q.target.prestationIds.includes(prestationId) ||
    (service !== null && q.target.serviceIds.includes(service))
  );
};

/** La question concerne-t-elle cette rubrique, entièrement ou en partie ? */
export const touchesRubric = (q: PreferenceQuestion, key: string) =>
  key === BAR_RUBRIC
    ? q.target.drinks
    : q.target.serviceIds.includes(key) ||
      q.target.prestationIds.some((id) => serviceOfPrestation(id) === key);

export type TargetPart = { key: string; label: string; detail?: string };

/** Lecture courte d'une cible : « Onglerie · toute la catégorie »,
 *  « Coiffure · 8 prestations sur 41 », « Boissons du bar ». */
export function targetParts(t: PreferenceTarget): TargetPart[] {
  const parts: TargetPart[] = [];
  for (const s of serviceSeeds) {
    const total = prestationsOf(s.id).length;
    if (t.serviceIds.includes(s.id)) {
      parts.push({ key: s.id, label: s.name, detail: "toute la catégorie" });
      continue;
    }
    const picked = t.prestationIds.filter((id) => serviceOfPrestation(id) === s.id);
    if (picked.length === 1) {
      parts.push({ key: s.id, label: s.name, detail: prestationById.get(picked[0])?.name });
    } else if (picked.length > 1) {
      parts.push({ key: s.id, label: s.name, detail: `${picked.length} prestations sur ${total}` });
    }
  }
  if (t.drinks) parts.push({ key: BAR_RUBRIC, label: BAR_LABEL });
  return parts;
}

/** Catégories après lesquelles aucune question active n'est posée. */
export function rubricsWithoutQuestion(questions: PreferenceQuestion[]): Rubric[] {
  const active = questions.filter((q) => q.active);
  return PREFERENCE_RUBRICS.filter((r) => !active.some((q) => touchesRubric(q, r.key)));
}

/* ------------------------------------------------ lecture d'une fiche */

export type RubricReading = { rubric: Rubric; tallies: QuestionTally[]; note?: string };

/** Réponses d'une cliente rangées par rubrique (ordre du catalogue), note
 *  libre comprise. Les rubriques sans réponse ni note sont omises. */
export function readingByRubric(prefs: ClientPreferences, questions: PreferenceQuestion[]): RubricReading[] {
  return PREFERENCE_RUBRICS.map((rubric) => ({
    rubric,
    tallies: notationTally(
      prefs,
      questions.filter((q) => rubricOf(q) === rubric.key),
    ),
    note: prefs.notes[rubric.key]?.trim() || undefined,
  })).filter((r) => r.tallies.length > 0 || r.note);
}

export type PreferenceLine = { label: string; notes: string[] };

/** Lecture texte des préférences (type de cheveux, réf. couleur, puis chaque
 *  rubrique : une ligne par question + la note libre) — même forme que
 *  `clientPreferenceLines` de point-de-vente. Vide si la fiche n'a rien. */
export function preferenceLines(prefs: ClientPreferences, questions: PreferenceQuestion[]): PreferenceLine[] {
  const lines: PreferenceLine[] = [];
  if (prefs.hairType) lines.push({ label: "Type de cheveux", notes: [prefs.hairType] });
  if (prefs.colorReference) lines.push({ label: "Réf. couleur", notes: [prefs.colorReference] });
  for (const r of readingByRubric(prefs, questions)) {
    lines.push({
      label: r.rubric.label,
      notes: [
        ...r.tallies.map(
          (t) => `${t.question.noteLabel} : ${takenOptions(t).map((o) => o.option.label).join(", ")}`,
        ),
        ...(r.note ? [r.note] : []),
      ],
    });
  }
  return lines;
}

export const hasPreferences = (prefs: ClientPreferences, questions: PreferenceQuestion[]) =>
  preferenceLines(prefs, questions).length > 0;
