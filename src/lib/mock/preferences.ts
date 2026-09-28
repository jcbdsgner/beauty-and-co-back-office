// Préférences clientes — configuration (questions + options) et lecture des
// réponses d'une cliente. 2026-09-27 : même modèle que point-de-vente
// (`lib/data/notation.ts` + `Cliente.preferenceNotes` / `notationRounds`, ADR
// 0035), mais c'est ICI qu'on DÉFINIT les questions et leurs options : la
// caisse les pose après l'encaissement (« Noter la cliente »), la fiche
// cliente les lit. Écran de configuration : Réglages › Préférences clientes.
//
// Indépendant du barrel, n'importe rien des autres fixtures (pas de cycle avec
// `beautyandco.ts`, qui en importe les types pour ses seeds clientes).

/** Les cinq domaines de préférence d'une fiche cliente — fixes, comme côté
 *  point-de-vente (`PreferenceDomain`). */
export type PreferenceDomain = "onglerie" | "coiffure" | "spa" | "epilation" | "boisson";

export const PREFERENCE_DOMAINS: PreferenceDomain[] = ["onglerie", "coiffure", "spa", "epilation", "boisson"];

export const PREFERENCE_DOMAIN_LABEL: Record<PreferenceDomain, string> = {
  onglerie: "Mani-pédi-onglerie",
  coiffure: "Coiffure",
  spa: "Spa",
  epilation: "Épilation",
  boisson: "Boisson",
};

export type PreferenceOption = {
  id: string;
  label: string;
  hint?: string;
  /** Photo de la réponse — chemin `public/` ou dataURL importée. */
  photo?: string;
};

export type PreferenceQuestion = {
  id: string;
  domain: PreferenceDomain;
  /** « Quel type d'ongles a-t-elle fait ? » */
  title: string;
  /** Consigne sous la question (« Touchez tout ce qu'elle a fait et apprécié. »). */
  subtitle: string;
  /** Libellé court repris sur la fiche : « Type : Gel X, French ». */
  noteLabel: string;
  /** Plusieurs réponses possibles, ou une seule. */
  multiple: boolean;
  /** Posée à la caisse après l'encaissement (« Noter la cliente »). Côté
   *  point-de-vente, seules les questions onglerie le sont aujourd'hui. */
  askedAtCounter: boolean;
  /** Une question inactive n'est plus posée ; ses anciennes réponses restent
   *  lisibles sur les fiches. */
  active: boolean;
  options: PreferenceOption[];
};

/** Un passage de « Noter la cliente » : quand, et ce qui a été répondu
 *  (id de question → ids d'options). */
export type NotationRound = { at: string; choices: Record<string, string[]> };

/** Préférences d'une cliente, forme de point-de-vente. */
export type ClientPreferences = {
  /** Texte libre par domaine. */
  notes: Partial<Record<PreferenceDomain, string>>;
  /** Chaque passage de « Noter la cliente », le plus récent d'abord. */
  rounds: NotationRound[];
  hairType?: string;
  colorReference?: string;
};

export const EMPTY_CLIENT_PREFERENCES: ClientPreferences = { notes: {}, rounds: [] };

/* ------------------------------------------------------------------ seeds */

// Questions reprises telles quelles de point-de-vente (`NOTATION_QUESTIONS`),
// photos copiées dans `public/images/notation/` (Polygel et les longueurs y
// empruntent une des cinq photos réelles, comme là-bas). `multiple` explicite
// ici (point-de-vente ne le dit que dans la consigne).
export const preferenceQuestionSeeds: PreferenceQuestion[] = [
  {
    id: "ongles-type",
    domain: "onglerie",
    title: "Quel type d'ongles a-t-elle fait ?",
    subtitle: "Touchez tout ce qu'elle a fait et apprécié.",
    noteLabel: "Type",
    multiple: true,
    askedAtCounter: true,
    active: true,
    options: [
      { id: "vernis-permanent", label: "Vernis permanent", photo: "/images/notation/vernis-permanent.jpg" },
      { id: "capsules", label: "Capsules", photo: "/images/notation/capsules.jpg" },
      { id: "gel-x", label: "Gel X", photo: "/images/notation/gel-x.jpg" },
      { id: "polygel", label: "Polygel", photo: "/images/notation/decoration.jpg" },
      { id: "french", label: "French", photo: "/images/notation/french.jpg" },
      { id: "decoration", label: "Décoration", hint: "Chrome, cat eye, baby boomer", photo: "/images/notation/decoration.jpg" },
    ],
  },
  {
    id: "ongles-longueur",
    domain: "onglerie",
    title: "Quelle longueur d'ongles ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Longueur",
    multiple: true,
    askedAtCounter: true,
    active: true,
    options: [
      { id: "courts", label: "Courts", photo: "/images/notation/vernis-permanent.jpg" },
      { id: "moyens", label: "Moyens", photo: "/images/notation/french.jpg" },
      { id: "longs", label: "Longs", photo: "/images/notation/gel-x.jpg" },
      { id: "tres-longs", label: "Très longs", photo: "/images/notation/capsules.jpg" },
    ],
  },
  {
    id: "coiffure-style",
    domain: "coiffure",
    title: "Quelle coiffure a-t-elle faite ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Style",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "tresses-collees", label: "Tresses collées" },
      { id: "box-braids", label: "Box braids" },
      { id: "vanilles", label: "Vanilles" },
      { id: "tissage", label: "Tissage" },
      { id: "brushing", label: "Brushing" },
      { id: "coupe", label: "Coupe" },
    ],
  },
  {
    id: "coiffure-soin",
    domain: "coiffure",
    title: "Quel soin ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Soin",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "shampoing", label: "Shampoing seul" },
      { id: "masque", label: "Masque hydratant" },
      { id: "bain-huile", label: "Bain d'huile" },
      { id: "keratine", label: "Kératine" },
    ],
  },
  {
    id: "spa-massage",
    domain: "spa",
    title: "Quel massage ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Massage",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "relaxant", label: "Relaxant" },
      { id: "tonique", label: "Tonique" },
      { id: "pierres-chaudes", label: "Pierres chaudes" },
      { id: "deep-tissue", label: "Deep tissue" },
    ],
  },
  {
    id: "spa-pression",
    domain: "spa",
    title: "Quelle pression ?",
    subtitle: "Une seule réponse.",
    noteLabel: "Pression",
    multiple: false,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "legere", label: "Légère" },
      { id: "moyenne", label: "Moyenne" },
      { id: "forte", label: "Forte" },
    ],
  },
  {
    id: "epilation-methode",
    domain: "epilation",
    title: "Quelle méthode ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Méthode",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "cire-chaude", label: "Cire chaude" },
      { id: "cire-froide", label: "Cire froide" },
      { id: "sucre", label: "Sucre" },
      { id: "fil", label: "Fil" },
    ],
  },
  {
    id: "epilation-zone",
    domain: "epilation",
    title: "Quelles zones ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Zones",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "sourcils", label: "Sourcils" },
      { id: "visage", label: "Visage" },
      { id: "aisselles", label: "Aisselles" },
      { id: "bras", label: "Bras" },
      { id: "jambes", label: "Jambes" },
      { id: "maillot", label: "Maillot" },
    ],
  },
  {
    id: "boisson-choix",
    domain: "boisson",
    title: "Qu'a-t-elle bu ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Choix",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "the-menthe", label: "Thé à la menthe" },
      { id: "cafe", label: "Café Touba" },
      { id: "bissap", label: "Bissap" },
      { id: "bouye", label: "Jus de bouye" },
      { id: "gingembre", label: "Gingembre" },
      { id: "eau", label: "Eau" },
    ],
  },
  {
    id: "boisson-sucre",
    domain: "boisson",
    title: "Sucrée comment ?",
    subtitle: "Une seule réponse.",
    noteLabel: "Sucre",
    multiple: false,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "sans-sucre", label: "Sans sucre" },
      { id: "peu-sucre", label: "Peu sucré" },
      { id: "sucre", label: "Sucré" },
    ],
  },
];

/* ---------------------------------------------------------------- lecture */

export type OptionTally = {
  option: PreferenceOption;
  /** Passages où elle a été choisie. */
  count: number;
  /** Choisie au dernier passage ayant répondu à la question. */
  latest: boolean;
};

export type QuestionTally = {
  question: PreferenceQuestion;
  rounds: number;
  lastAt?: string;
  options: OptionTally[];
};

/** Comment la cliente a répondu à chaque question d'un domaine, tous passages
 *  confondus (même calcul que `notationTally` de point-de-vente). Les
 *  questions jamais posées sont omises. */
export function notationTally(
  prefs: ClientPreferences,
  domain: PreferenceDomain,
  questions: PreferenceQuestion[],
): QuestionTally[] {
  return questions
    .filter((q) => q.domain === domain)
    .map((question) => {
      const answered = prefs.rounds.filter((r) => (r.choices[question.id]?.length ?? 0) > 0);
      const last = answered[0]?.choices[question.id] ?? [];
      return {
        question,
        rounds: answered.length,
        lastAt: answered[0]?.at,
        options: question.options.map((option) => ({
          option,
          count: answered.filter((r) => r.choices[question.id].includes(option.id)).length,
          latest: last.includes(option.id),
        })),
      };
    })
    .filter((t) => t.rounds > 0);
}

/** Réponses prises, celles de la dernière fois d'abord, puis les plus fréquentes. */
export function takenOptions(tally: QuestionTally): OptionTally[] {
  return tally.options
    .filter((o) => o.count > 0)
    .sort((a, b) => Number(b.latest) - Number(a.latest) || b.count - a.count);
}

/** Dernières réponses connues, question par question — préremplit l'édition. */
export function latestChoices(
  prefs: ClientPreferences,
  questions: PreferenceQuestion[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const q of questions) {
    const r = prefs.rounds.find((x) => (x.choices[q.id]?.length ?? 0) > 0);
    if (r) out[q.id] = r.choices[q.id];
  }
  return out;
}

export type PreferenceLine = { label: string; notes: string[] };

/** Lecture texte des préférences (type de cheveux, réf. couleur, puis chaque
 *  domaine : une ligne par question + la note libre) — même forme que
 *  `clientPreferenceLines` de point-de-vente. Vide si la fiche n'a rien. */
export function preferenceLines(prefs: ClientPreferences, questions: PreferenceQuestion[]): PreferenceLine[] {
  const lines: PreferenceLine[] = [];
  if (prefs.hairType) lines.push({ label: "Type de cheveux", notes: [prefs.hairType] });
  if (prefs.colorReference) lines.push({ label: "Réf. couleur", notes: [prefs.colorReference] });
  for (const domain of PREFERENCE_DOMAINS) {
    const notes = [
      ...notationTally(prefs, domain, questions).map(
        (t) => `${t.question.noteLabel} : ${takenOptions(t).map((o) => o.option.label).join(", ")}`,
      ),
      prefs.notes[domain],
    ].filter((n): n is string => Boolean(n));
    if (notes.length > 0) lines.push({ label: PREFERENCE_DOMAIN_LABEL[domain], notes });
  }
  return lines;
}

export const hasPreferences = (prefs: ClientPreferences, questions: PreferenceQuestion[]) =>
  preferenceLines(prefs, questions).length > 0;

let seq = 0;
export const newPrefId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;
