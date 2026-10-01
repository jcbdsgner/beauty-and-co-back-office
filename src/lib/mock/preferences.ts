// Préférences clientes — configuration (questions + options) et lecture des
// réponses d'une cliente. 2026-09-27 : même modèle que point-de-vente
// (`lib/data/notation.ts` + `Cliente.preferenceNotes` / `notationRounds`, ADR
// 0035), mais c'est ICI qu'on DÉFINIT les questions et leurs options : la
// caisse les pose après l'encaissement (« Noter la cliente »), la fiche
// cliente les lit. Écran de configuration : Réglages › Préférences clientes.
//
// 2026-09-28 : plus de cinq « domaines » fixes. Chaque question dit APRÈS
// QUELLES PRESTATIONS elle est posée (`target` : catégories entières du
// catalogue, prestations précises, boissons du bar) ; la rubrique où ses
// réponses se lisent sur la fiche cliente en découle (voir
// `./preference-targets`, qui fait le lien avec le catalogue).
//
// Indépendant du barrel, n'importe rien des autres fixtures (pas de cycle avec
// `beautyandco.ts`, qui en importe les types pour ses seeds clientes) — les
// ids de catégories / prestations ci-dessous sont ceux de `./services`.

/** Rubrique « Boissons du bar » — les boissons ne sont pas une catégorie de
 *  prestations du catalogue. */
export const BAR_RUBRIC = "bar";

/** Où la question est posée : après une prestation d'une catégorie cochée
 *  entière, après une prestation cochée une à une, ou après une boisson. */
export type PreferenceTarget = {
  /** Catégories entières (`Service.id`) — y compris les prestations qui y
   *  seront ajoutées plus tard. */
  serviceIds: string[];
  /** Prestations précises (`Prestation.id`) hors catégories entières. */
  prestationIds: string[];
  /** Posée quand la cliente a pris une boisson du bar. */
  drinks: boolean;
};

export const EMPTY_TARGET: PreferenceTarget = { serviceIds: [], prestationIds: [], drinks: false };

export const targetIsEmpty = (t: PreferenceTarget) =>
  t.serviceIds.length === 0 && t.prestationIds.length === 0 && !t.drinks;

export type PreferenceOption = {
  id: string;
  label: string;
  hint?: string;
  /** Photo de la réponse — chemin `public/` ou dataURL importée. */
  photo?: string;
};

export type PreferenceQuestion = {
  id: string;
  /** Après quelles prestations la question est posée. */
  target: PreferenceTarget;
  /** « Quel type d'ongles a-t-elle fait ? » */
  title: string;
  /** Consigne sous la question (« Touchez tout ce qu'elle a fait et apprécié. »). */
  subtitle: string;
  /** Libellé court repris sur la fiche : « Type : Gel X, French ». */
  noteLabel: string;
  /** Plusieurs réponses possibles, ou une seule. */
  multiple: boolean;
  /** Posée à la caisse après l'encaissement (« Noter la cliente »), si la
   *  visite comprenait une prestation visée par `target`. */
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
  /** Texte libre par rubrique (id de catégorie, ou `BAR_RUBRIC`). */
  notes: Partial<Record<string, string>>;
  /** Chaque passage de « Noter la cliente », le plus récent d'abord. */
  rounds: NotationRound[];
  hairType?: string;
  colorReference?: string;
};

export const EMPTY_CLIENT_PREFERENCES: ClientPreferences = { notes: {}, rounds: [] };

/* ------------------------------------------------------------------ seeds */

// Questions reprises de point-de-vente (`NOTATION_QUESTIONS`) ; leurs cibles
// (`target`) ont été posées ici, 2026-09-28 — ex. le soin capillaire n'est
// demandé qu'après un rituel soin ou un head spa, pas après une coupe.
// Photos copiées dans `public/images/notation/` (Polygel et les longueurs y
// empruntent une des cinq photos réelles, comme là-bas). 2026-09-28 : toute
// réponse porte une photo ; pour la démo, les questions hors onglerie
// reprennent en boucle ces mêmes cinq photos. `multiple` explicite
// ici (point-de-vente ne le dit que dans la consigne).
export const preferenceQuestionSeeds: PreferenceQuestion[] = [
  {
    id: "ongles-type",
    target: { serviceIds: ["s-onglerie"], prestationIds: ["manucure-pedicure-manucure-permanent", "manucure-pedicure-pedicure-permanent", "manucure-pedicure-gel-sur-ongle-naturel-gainage", "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage", "manucure-pedicure-perfect-pedicure-russe-permanent", "manucure-pedicure-supplement-decoration-chrome-cat-eye-baby-boomer"], drinks: false },
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
    target: { serviceIds: ["s-onglerie"], prestationIds: [], drinks: false },
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
    // Coiffure entière + la partie Hair de Mini & Co (pas les soins Spa enfants).
    target: {
      serviceIds: ["s-coiffure"],
      prestationIds: [
        "mini-co-mini-hair-treat-mini-co",
        "mini-co-mini-hair-treat-braids-mini-co",
        "mini-co-supplement-coiffure-enfant",
        "mini-co-definition-boucles-enfant",
        "mini-co-defaire-tresses-enfant",
        "mini-co-coupe-pointes-enfants-mini-co",
        "mini-co-supplement-brushing-enfant",
        "mini-co-supplements-tresses-enfants-mini-and-co",
      ],
      drinks: false,
    },
    title: "Quelle coiffure a-t-elle faite ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Style",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "tresses-collees", label: "Tresses collées" , photo: "/images/notation/vernis-permanent.jpg" },
      { id: "box-braids", label: "Box braids" , photo: "/images/notation/capsules.jpg" },
      { id: "vanilles", label: "Vanilles" , photo: "/images/notation/gel-x.jpg" },
      { id: "tissage", label: "Tissage" , photo: "/images/notation/french.jpg" },
      { id: "brushing", label: "Brushing" , photo: "/images/notation/decoration.jpg" },
      { id: "coupe", label: "Coupe" , photo: "/images/notation/vernis-permanent.jpg" },
    ],
  },
  {
    id: "coiffure-soin",
    target: { serviceIds: [], prestationIds: ["coiffure-soin-croisiere", "coiffure-soin-complet", "coiffure-soin-detox", "coiffure-soin-botox-reparateur-non-lissant", "coiffure-soin-vip", "coiffure-soin-reparateur-olapex-new-in", "coiffure-soin-croisiere-head-spa", "coiffure-head-spa-ultimate-deep-relaxation"], drinks: false },
    title: "Quel soin ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Soin",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "shampoing", label: "Shampoing seul" , photo: "/images/notation/capsules.jpg" },
      { id: "masque", label: "Masque hydratant" , photo: "/images/notation/gel-x.jpg" },
      { id: "bain-huile", label: "Bain d'huile" , photo: "/images/notation/french.jpg" },
      { id: "keratine", label: "Kératine" , photo: "/images/notation/decoration.jpg" },
    ],
  },
  {
    id: "spa-massage",
    target: { serviceIds: ["s-spa"], prestationIds: [], drinks: false },
    title: "Quel massage ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Massage",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "relaxant", label: "Relaxant" , photo: "/images/notation/vernis-permanent.jpg" },
      { id: "tonique", label: "Tonique" , photo: "/images/notation/capsules.jpg" },
      { id: "pierres-chaudes", label: "Pierres chaudes" , photo: "/images/notation/gel-x.jpg" },
      { id: "deep-tissue", label: "Deep tissue" , photo: "/images/notation/french.jpg" },
    ],
  },
  {
    id: "spa-pression",
    target: { serviceIds: ["s-spa"], prestationIds: ["coiffure-head-spa-ultimate-deep-relaxation", "coiffure-supplement-hand-feet-massage-massage-pieds-mains"], drinks: false },
    title: "Quelle pression ?",
    subtitle: "Une seule réponse.",
    noteLabel: "Pression",
    multiple: false,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "legere", label: "Légère" , photo: "/images/notation/decoration.jpg" },
      { id: "moyenne", label: "Moyenne" , photo: "/images/notation/vernis-permanent.jpg" },
      { id: "forte", label: "Forte" , photo: "/images/notation/capsules.jpg" },
    ],
  },
  {
    id: "epilation-methode",
    target: { serviceIds: ["s-epilation"], prestationIds: [], drinks: false },
    title: "Quelle méthode ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Méthode",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "cire-chaude", label: "Cire chaude" , photo: "/images/notation/gel-x.jpg" },
      { id: "cire-froide", label: "Cire froide" , photo: "/images/notation/french.jpg" },
      { id: "sucre", label: "Sucre" , photo: "/images/notation/decoration.jpg" },
      { id: "fil", label: "Fil" , photo: "/images/notation/vernis-permanent.jpg" },
    ],
  },
  {
    id: "epilation-zone",
    target: { serviceIds: ["s-epilation"], prestationIds: [], drinks: false },
    title: "Quelles zones ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Zones",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "sourcils", label: "Sourcils" , photo: "/images/notation/capsules.jpg" },
      { id: "visage", label: "Visage" , photo: "/images/notation/gel-x.jpg" },
      { id: "aisselles", label: "Aisselles" , photo: "/images/notation/french.jpg" },
      { id: "bras", label: "Bras" , photo: "/images/notation/decoration.jpg" },
      { id: "jambes", label: "Jambes" , photo: "/images/notation/vernis-permanent.jpg" },
      { id: "maillot", label: "Maillot" , photo: "/images/notation/capsules.jpg" },
    ],
  },
  {
    id: "boisson-choix",
    target: { serviceIds: [], prestationIds: [], drinks: true },
    title: "Qu'a-t-elle bu ?",
    subtitle: "Plusieurs réponses possibles.",
    noteLabel: "Choix",
    multiple: true,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "the-menthe", label: "Thé à la menthe" , photo: "/images/notation/gel-x.jpg" },
      { id: "cafe", label: "Café Touba" , photo: "/images/notation/french.jpg" },
      { id: "bissap", label: "Bissap" , photo: "/images/notation/decoration.jpg" },
      { id: "bouye", label: "Jus de bouye" , photo: "/images/notation/vernis-permanent.jpg" },
      { id: "gingembre", label: "Gingembre" , photo: "/images/notation/capsules.jpg" },
      { id: "eau", label: "Eau" , photo: "/images/notation/gel-x.jpg" },
    ],
  },
  {
    id: "boisson-sucre",
    target: { serviceIds: [], prestationIds: [], drinks: true },
    title: "Sucrée comment ?",
    subtitle: "Une seule réponse.",
    noteLabel: "Sucre",
    multiple: false,
    askedAtCounter: false,
    active: true,
    options: [
      { id: "sans-sucre", label: "Sans sucre" , photo: "/images/notation/french.jpg" },
      { id: "peu-sucre", label: "Peu sucré" , photo: "/images/notation/decoration.jpg" },
      { id: "sucre", label: "Sucré" , photo: "/images/notation/vernis-permanent.jpg" },
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

/** Comment la cliente a répondu à chacune des questions données, tous passages
 *  confondus (même calcul que `notationTally` de point-de-vente). Les
 *  questions jamais posées sont omises. Le regroupement par rubrique se fait
 *  dans `./preference-targets`. */
export function notationTally(prefs: ClientPreferences, questions: PreferenceQuestion[]): QuestionTally[] {
  return questions
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

let seq = 0;
export const newPrefId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;
