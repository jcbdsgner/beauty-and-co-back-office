// Données fictives BeautyAndCo — front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du reste de la couche mock : importer directement ce fichier
// (`@/lib/mock/beautyandco`) et non le barrel `@/lib/mock`.

import { EMPTY_CLIENT_PREFERENCES, type ClientPreferences } from "./preferences";

// Forme d'un indicateur de carte (StatCards) — la partie chiffrée et l'unité
// sont séparées pour l'affichage.
export type Kpi = {
  key: string;
  label: string;
  value: string; // partie chiffrée seule, ex. « 422.000 »
  unit?: string; // unité affichée en petit à côté de la valeur, ex. « FCFA », « /5 »
  delta?: number; // écart en % vs période précédente ; absent = pas de comparaison
  deltaLabel?: string; // légende de l'écart, ex. « vs hier »
  direction: "up" | "down" | "flat"; // "flat" = pas d'évolution à signaler
  hint?: string; // repère bas de carte : la même valeur sur la période précédente
};

// Groupe les milliers par un point : 2450000 → « 2.450.000 ».
export const groupThousands = (n: number) => {
  const grouped = Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return n < 0 ? `-${grouped}` : grouped;
};

// Montant entier, milliers séparés par un point, jamais abrégé : « 2.450.000 FCFA ».
// Les montants ne sont jamais réduits à « 2,45 M » ou « 422 k » dans l'UI produit.
export const fcfa = (n: number, withUnit = true) =>
  `${groupThousands(n)}${withUnit ? " FCFA" : ""}`;

// Repère temporel figé pour la démo (sert à distinguer RDV passés / à venir).
export const today = {
  label: "mardi 3 septembre",
  currentTime: "13:20",
};

/* ------------------------------------------------------------------ */
/* Salons — le nombre est figé (pas de pagination / repli à prévoir)   */
/* ------------------------------------------------------------------ */

export const salons = [
  { id: "almadies", name: "Almadies", area: "Route de Ngor" },
  { id: "seaplaza", name: "Sea Plaza", area: "Corniche Ouest" },
] as const;

export type SalonId = (typeof salons)[number]["id"];
export type SalonScope = SalonId | "all";

export const salonName = (scope: SalonScope) =>
  scope === "all" ? "Tous les salons" : (salons.find((s) => s.id === scope)?.name ?? scope);

// Répartition indicative du volume entre salons — sert à ventiler les agrégats
// quand un seul salon est sélectionné (données fictives, pas de vraie compta).
const SHARE: Record<SalonId, number> = { almadies: 0.62, seaplaza: 0.38 };
const factor = (scope: SalonScope) => (scope === "all" ? 1 : SHARE[scope]);

/* ------------------------------------------------------------------ */
/* Périodes du tableau de bord                                         */
/* ------------------------------------------------------------------ */

export const periods = [
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "custom", label: "Personnalisé" },
] as const;

export type PeriodId = (typeof periods)[number]["id"];

export const periodLabel = (id: PeriodId) =>
  periods.find((p) => p.id === id)?.label ?? "Aujourd'hui";

// La période « personnalisée » réutilise les données du mois pour la démo.
const dataPeriod = (id: PeriodId): "today" | "week" | "month" =>
  id === "custom" ? "month" : id;

/* ------------------------------------------------------------------ */
/* RDV du jour par salon                                               */
/* ------------------------------------------------------------------ */

// Un rendez-vous n'a pas d'étape de confirmation : il est « à venir », puis
// éventuellement « annulé ». (cf. RdvStatus dans `rendezvous.ts`)
export type AppointmentStatus = "à venir" | "annulé";

export type SalonAppointment = {
  time: string;
  client: string;
  service: string;
  staff: string;
  status: AppointmentStatus;
};

export type SalonToday = {
  id: SalonId;
  name: string;
  area: string;
  count: number;
  appointments: SalonAppointment[];
};

const ALL_SALONS_TODAY: SalonToday[] = [
  {
    id: "almadies",
    name: "Almadies",
    area: "Route de Ngor",
    count: 6,
    appointments: [
      { time: "09:00", client: "Awa Sarr", service: "Coupe & Brushing", staff: "Sophie", status: "à venir" },
      { time: "10:30", client: "Fatou Camara", service: "Coloration", staff: "Mariama", status: "à venir" },
      { time: "12:00", client: "Coumba Thiam", service: "Manucure", staff: "Aïda", status: "à venir" },
      { time: "14:00", client: "Bineta Diagne", service: "Soin visage", staff: "Sophie", status: "à venir" },
      { time: "15:30", client: "Mariam Kane", service: "Balayage", staff: "Mariama", status: "à venir" },
      { time: "17:00", client: "Khady Guèye", service: "Coupe", staff: "Aïda", status: "à venir" },
    ],
  },
  {
    id: "seaplaza",
    name: "Sea Plaza",
    area: "Corniche Ouest",
    count: 3,
    appointments: [
      { time: "10:00", client: "Sokhna Ndiaye", service: "Manucure", staff: "Bineta", status: "à venir" },
      { time: "13:00", client: "Rama Diallo", service: "Soin visage", staff: "Coumba", status: "à venir" },
      { time: "16:00", client: "Bineta Cissé", service: "Coupe & Brushing", staff: "Bineta", status: "à venir" },
    ],
  },
];

export function salonsToday(scope: SalonScope): SalonToday[] {
  return scope === "all" ? ALL_SALONS_TODAY : ALL_SALONS_TODAY.filter((s) => s.id === scope);
}

/* ------------------------------------------------------------------ */
/* Configuration des salons — identité, postes de travail, horaires    */
/* ------------------------------------------------------------------ */
//
// Le domicile de tout ce qui décrit un salon en tant que lieu : coordonnées,
// capacité (postes de travail par type), heures d'ouverture hebdomadaires et
// fermetures exceptionnelles. L'écran « Salons » édite cet objet ; « Planning »
// et « Rendez-vous » le lisent pour savoir quand et combien de personnes on peut
// recevoir. Les anciens « Créneaux horaires » sont absorbés ici.

export type Weekday = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";

export const WEEKDAYS: Weekday[] = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  lun: "Lundi",
  mar: "Mardi",
  mer: "Mercredi",
  jeu: "Jeudi",
  ven: "Vendredi",
  sam: "Samedi",
  dim: "Dimanche",
};

// Capacité comptée PAR TYPE de poste : un poste coiffure ne sert pas à une
// manucure. Le total (`posteCapacity`) ne fait sens que pour un coup d'œil.
export type PosteType = "coiffure" | "esthetique" | "onglerie";

export const POSTE_TYPES: PosteType[] = ["coiffure", "esthetique", "onglerie"];

export const POSTE_TYPE_LABELS: Record<PosteType, string> = {
  coiffure: "Poste coiffure",
  esthetique: "Cabine soin",
  onglerie: "Poste onglerie",
};

// Horaire d'un jour : soit fermé, soit une plage avec coupure optionnelle.
// Heures au format "HH:MM".
export type DayOpening =
  | { closed: true }
  | { closed: false; open: string; close: string; breakStart?: string; breakEnd?: string };

export type SalonConfig = {
  id: SalonId;
  name: string;
  area: string;
  address: string;
  phone: string;
  active: boolean;
  postes: Partial<Record<PosteType, number>>;
  hours: Record<Weekday, DayOpening>;
};

// lun–sam 09:00–19:00 avec coupure 13:00–14:00 ; dimanche fermé.
const standardHours = (): Record<Weekday, DayOpening> => {
  const day: DayOpening = {
    closed: false,
    open: "09:00",
    close: "19:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  };
  return {
    lun: day,
    mar: day,
    mer: day,
    jeu: day,
    ven: day,
    sam: day,
    dim: { closed: true },
  };
};

export const salonConfigs: SalonConfig[] = [
  {
    id: "almadies",
    name: "Almadies",
    area: "Route de Ngor",
    address: "Route de Ngor, Almadies, Dakar",
    phone: "+221 33 820 11 22",
    active: true,
    postes: { coiffure: 4, esthetique: 2, onglerie: 2 },
    hours: standardHours(),
  },
  {
    id: "seaplaza",
    name: "Sea Plaza",
    area: "Corniche Ouest",
    address: "Sea Plaza, Corniche Ouest, Dakar",
    phone: "+221 33 869 33 44",
    active: true,
    postes: { coiffure: 3, esthetique: 1, onglerie: 2 },
    hours: standardHours(),
  },
];

export const salonConfig = (id: SalonId): SalonConfig =>
  salonConfigs.find((s) => s.id === id)!;

// Nombre total de postes, tous types confondus.
export const posteCapacity = (id: SalonId): number =>
  POSTE_TYPES.reduce((n, t) => n + (salonConfig(id).postes[t] ?? 0), 0);

// Fermeture exceptionnelle : congés, travaux, jour férié. Bornes ISO incluses.
export type SalonClosure = {
  id: string;
  scope: SalonScope; // "all" = tous les salons
  from: string; // ISO yyyy-mm-dd
  to: string; // ISO yyyy-mm-dd
  reason: string;
};

export const salonClosures: SalonClosure[] = [
  { id: "cl-noel", scope: "all", from: "2026-12-25", to: "2026-12-25", reason: "Noël" },
  {
    id: "cl-travaux",
    scope: "almadies",
    from: "2026-10-06",
    to: "2026-10-08",
    reason: "Travaux — réfection du bac à shampoing",
  },
];

const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

const isoWeekday = (iso: string): Weekday =>
  WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];

// Fermetures qui couvrent `iso` et concernent le périmètre demandé.
export const closuresFor = (scope: SalonScope, iso: string): SalonClosure[] =>
  salonClosures.filter(
    (c) =>
      iso >= c.from &&
      iso <= c.to &&
      (scope === "all" || c.scope === "all" || c.scope === scope),
  );

// Salon fermé ce jour-là : soit l'horaire hebdomadaire est fermé, soit une
// fermeture exceptionnelle couvre la date.
export const isClosed = (id: SalonId, iso: string): boolean =>
  salonConfig(id).hours[isoWeekday(iso)].closed || closuresFor(id, iso).length > 0;

/* ------------------------------------------------------------------ */
/* Cartes KPI — pilotées par (salon, période)                          */
/* ------------------------------------------------------------------ */

type KpiSeed = {
  key: string;
  label: string;
  amount: number;
  unit: "fcfa" | "count" | "rating";
  delta?: number;
  direction: "up" | "down" | "flat";
  scalable: boolean; // false = ratio/note qui ne se ventile pas par salon (panier moyen, satisfaction)
  prev: number; // même indicateur sur la période précédente (échelle « tous salons »)
  prevNoun?: string; // nom de l'unité dans le repère du bas, ex. « rendez-vous »
};

// Les quatre mêmes familles d'indicateurs à chaque période — CA, rendez-vous,
// nouveaux clients, satisfaction — seuls les libellés et les repères changent.
// Le bas de chaque carte ne montre qu'une chose : l'évolution vs la période
// précédente (pastille = %, ligne du dessous = la valeur d'alors).
const KPI_SEEDS: Record<"today" | "week" | "month", KpiSeed[]> = {
  today: [
    { key: "ca", label: "Chiffre d'affaires du jour", amount: 422_000, unit: "fcfa", delta: 8, direction: "up", scalable: true, prev: 390_000 },
    { key: "rdv", label: "Rendez-vous du jour", amount: 9, unit: "count", delta: 13, direction: "up", scalable: true, prev: 8, prevNoun: "rendez-vous" },
    { key: "clients", label: "Nouveaux clients du jour", amount: 2, unit: "count", delta: 33, direction: "down", scalable: true, prev: 3, prevNoun: "nouveaux clients" },
    { key: "satisfaction", label: "Taux de satisfaction", amount: 4.7, unit: "rating", direction: "flat", scalable: false, prev: 4.6 },
  ],
  week: [
    { key: "ca", label: "Chiffre d'affaires de la semaine", amount: 568_000, unit: "fcfa", delta: 6, direction: "up", scalable: true, prev: 536_000 },
    { key: "rdv", label: "Rendez-vous cette semaine", amount: 43, unit: "count", delta: 9, direction: "up", scalable: true, prev: 39, prevNoun: "rendez-vous" },
    { key: "clients", label: "Nouveaux clients cette semaine", amount: 9, unit: "count", delta: 18, direction: "down", scalable: true, prev: 11, prevNoun: "nouveaux clients" },
    { key: "satisfaction", label: "Taux de satisfaction", amount: 4.6, unit: "rating", direction: "flat", scalable: false, prev: 4.7 },
  ],
  month: [
    { key: "ca", label: "Chiffre d'affaires du mois", amount: 2_450_000, unit: "fcfa", delta: 12, direction: "up", scalable: true, prev: 2_188_000 },
    { key: "rdv", label: "Rendez-vous ce mois", amount: 184, unit: "count", delta: 14, direction: "up", scalable: true, prev: 161, prevNoun: "rendez-vous" },
    { key: "clients", label: "Nouveaux clients ce mois", amount: 40, unit: "count", delta: 60, direction: "down", scalable: true, prev: 100, prevNoun: "nouveaux clients" },
    { key: "satisfaction", label: "Taux de satisfaction", amount: 4.6, unit: "rating", direction: "flat", scalable: false, prev: 4.6 },
  ],
};

const comparisonLabel = (period: "today" | "week" | "month") =>
  period === "today"
    ? "vs hier"
    : period === "week"
      ? "vs semaine dernière"
      : "vs mois dernier";

const previousPeriodLabel = (period: "today" | "week" | "month") =>
  period === "today"
    ? "hier"
    : period === "week"
      ? "la semaine dernière"
      : "le mois dernier";

// Renvoie la valeur et son unité séparées : l'unité s'affiche en petit à côté du nombre.
const formatKpi = (n: number, unit: KpiSeed["unit"]): { value: string; unit?: string } => {
  if (unit === "rating")
    return { value: n.toLocaleString("fr-FR", { minimumFractionDigits: 1 }), unit: "/5" };
  if (unit === "count") return { value: groupThousands(n) };
  // Montant entier, jamais abrégé — « FCFA » s'affiche à côté via `unit`.
  return { value: fcfa(Math.round(n / 1_000) * 1_000, false), unit: "FCFA" };
};

export function dashboardKpis(scope: SalonScope, period: PeriodId): Kpi[] {
  const dp = dataPeriod(period);
  const seeds = KPI_SEEDS[dp];
  const f = factor(scope);

  return seeds.map((s) => {
    const amount = s.scalable ? s.amount * f : s.amount;
    const { value, unit } = formatKpi(amount, s.unit);

    // Repère unique du bas de carte : le même indicateur sur la période précédente.
    const prev = formatKpi(s.scalable ? s.prev * f : s.prev, s.unit);
    const hint = [prev.value, prev.unit, s.prevNoun, previousPeriodLabel(dp)]
      .filter(Boolean)
      .join(" ");

    return {
      key: s.key,
      label: s.label,
      value,
      unit,
      delta: s.delta,
      deltaLabel: s.delta != null ? comparisonLabel(dp) : undefined,
      direction: s.direction,
      hint,
    } satisfies Kpi;
  });
}

/* ------------------------------------------------------------------ */
/* Graphique des revenus — pilotée par (salon, période)                */
/* ------------------------------------------------------------------ */

export const revenueMonths = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

const k = (arr: number[]) => arr.map((n) => n * 1_000);

type RevenueBucket = {
  categories: string[];
  subtitle: string;
  bySalon: Record<SalonId, number[]>;
};

const REVENUE: Record<"today" | "week" | "month", RevenueBucket> = {
  today: {
    categories: ["mer.", "jeu.", "ven.", "sam.", "dim.", "lun.", "mar."],
    subtitle: "Chiffre d'affaires quotidien — 7 derniers jours",
    bySalon: {
      almadies: k([52, 58, 49, 62, 66, 71, 60]),
      seaplaza: k([32, 35, 30, 38, 40, 43, 37]),
    },
  },
  week: {
    categories: ["S-3", "S-2", "S-1", "Cette sem."],
    subtitle: "Chiffre d'affaires hebdomadaire — 4 dernières semaines",
    bySalon: {
      almadies: k([372, 355, 391, 352]),
      seaplaza: k([228, 218, 240, 216]),
    },
  },
  month: {
    categories: revenueMonths,
    subtitle: "Chiffre d'affaires mensuel par salon — 12 derniers mois",
    bySalon: {
      almadies: k([1150, 1060, 1240, 1330, 1190, 1390, 1480, 1140, 1470, 1360, 1560, 1250]),
      seaplaza: k([700, 660, 800, 880, 790, 930, 1000, 760, 980, 900, 1050, 840]),
    },
  },
};

// Rendez-vous honorés — même maille (salon, période) que le chiffre d'affaires,
// pour permettre la bascule Revenus / Rendez-vous sur le même graphe.
const APPOINTMENTS: Record<"today" | "week" | "month", RevenueBucket> = {
  today: {
    categories: ["mer.", "jeu.", "ven.", "sam.", "dim.", "lun.", "mar."],
    subtitle: "Rendez-vous honorés par jour — 7 derniers jours",
    bySalon: {
      almadies: [14, 16, 13, 18, 19, 21, 17],
      seaplaza: [9, 10, 8, 11, 12, 13, 10],
    },
  },
  week: {
    categories: ["S-3", "S-2", "S-1", "Cette sem."],
    subtitle: "Rendez-vous honorés par semaine — 4 dernières semaines",
    bySalon: {
      almadies: [92, 88, 97, 87],
      seaplaza: [57, 54, 60, 54],
    },
  },
  month: {
    categories: revenueMonths,
    subtitle: "Rendez-vous honorés par salon — 12 derniers mois",
    bySalon: {
      almadies: [290, 265, 310, 335, 300, 350, 375, 285, 370, 340, 395, 315],
      seaplaza: [175, 165, 200, 220, 195, 230, 250, 190, 245, 225, 260, 210],
    },
  },
};

export type TrendMetric = "revenue" | "appointments";

export function trendChart(
  scope: SalonScope,
  period: PeriodId,
  metric: TrendMetric,
) {
  const bucket = (metric === "revenue" ? REVENUE : APPOINTMENTS)[dataPeriod(period)];
  const ids: SalonId[] = scope === "all" ? salons.map((s) => s.id) : [scope];
  return {
    subtitle:
      scope === "all"
        ? bucket.subtitle
        : bucket.subtitle.replace(" par salon", ""),
    categories: bucket.categories,
    series: ids.map((id) => ({
      name: salons.find((s) => s.id === id)!.name,
      data: bucket.bySalon[id],
    })),
    stacked: scope === "all",
  };
}

/* ------------------------------------------------------------------ */
/* Prestations populaires — pilotée par (salon, période)               */
/* ------------------------------------------------------------------ */

export type PopularService = { name: string; count: number };

const POPULAR_30D: PopularService[] = [
  // Noms réels du catalogue (`services.ts`) — remplace l'ancien « Coloration »,
  // prestation que Beauty & Co ne propose pas.
  { name: "Shampoing brushing", count: 320 },
  { name: "Tresses cheveux", count: 210 },
  { name: "Vernis permanent mains", count: 165 },
  { name: "Soin complet", count: 140 },
  { name: "Manucure russe", count: 95 },
];

// Fenêtre glissante de 30 jours, indépendante de la période choisie plus haut :
// c'est un repère « qu'est-ce qui se vend » sur le catalogue, pas une métrique de période.
// Suit en revanche le filtre salon.
export function popularServices(scope: SalonScope) {
  const items = POPULAR_30D.map((s) => ({
    name: s.name,
    count: Math.max(1, Math.round(s.count * factor(scope))),
  }));
  const total = items.reduce((sum, s) => sum + s.count, 0);
  return {
    total,
    caption: "réservations · 30 derniers jours",
    items: items.map((s) => ({ ...s, share: Math.round((s.count / total) * 100) })),
  };
}

/* ------------------------------------------------------------------ */
/* Satisfaction client — avis collectés après chaque visite            */
/* ------------------------------------------------------------------ */

// Repère ISO figé, cohérent avec `today` (« mardi 3 septembre »).
const TODAY_ISO = "2026-09-03";
const DAY_MS = 86_400_000;

// jj/mm/aaaa — l'UI produit n'affiche jamais les dates au format ISO.
export const frShortDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const FR_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// « 12 août 2026 » — pour les dates repères (membre depuis…), pas les tableaux.
export const frLongDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${FR_MONTHS[Number(m) - 1]} ${y}`;
};

export type SatisfactionWindow = "30" | "90";

export type Review = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  rating: 1 | 2 | 3 | 4 | 5;
  client: string;
  service: string;
  staff: string;
  salon: SalonId;
  comment?: string;
};

// Avis fictifs des 3 derniers mois. Volontairement modeste en volume (collecte
// automatique post-visite : quelques avis par semaine et par salon).
const REVIEWS: Review[] = [
  { id: "r01", date: "2026-06-08", rating: 5, client: "Awa Sarr", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies", comment: "Toujours au top, merci Sophie." },
  { id: "r02", date: "2026-06-14", rating: 4, client: "Rama Diallo", service: "Manucure", staff: "Coumba", salon: "seaplaza" },
  { id: "r03", date: "2026-06-19", rating: 5, client: "Adama Sarr", service: "Coloration", staff: "Mariama", salon: "almadies", comment: "Couleur exactement comme je voulais." },
  { id: "r04", date: "2026-06-25", rating: 3, client: "Penda Ndoye", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Correct, mais j'ai attendu 20 minutes." },
  { id: "r05", date: "2026-07-02", rating: 5, client: "Ndèye Diop", service: "Balayage", staff: "Mariama", salon: "almadies" },
  { id: "r06", date: "2026-07-06", rating: 2, client: "Nafi Camara", service: "Coupe", staff: "Aïda", salon: "almadies", comment: "Coupe pas égale, j'ai dû la faire reprendre ailleurs." },
  { id: "r07", date: "2026-07-11", rating: 4, client: "Dieynaba Kane", service: "Manucure", staff: "Coumba", salon: "seaplaza", comment: "Très bien, ambiance agréable." },
  { id: "r08", date: "2026-07-15", rating: 5, client: "Rokhaya Seck", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies" },
  { id: "r09", date: "2026-07-19", rating: 5, client: "Yacine Wade", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Peau nickel, je reviendrai." },
  { id: "r10", date: "2026-07-24", rating: 4, client: "Oumou Baldé", service: "Coloration", staff: "Mariama", salon: "almadies" },
  { id: "r11", date: "2026-07-28", rating: 3, client: "Fatoumata Barry", service: "Coupe", staff: "Aïda", salon: "almadies" },
  { id: "r12", date: "2026-08-01", rating: 5, client: "Seynabou Wade", service: "Manucure", staff: "Coumba", salon: "seaplaza", comment: "Rapide et soigné." },
  { id: "r13", date: "2026-08-05", rating: 5, client: "Maimouna Sy", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies", comment: "Sophie connaît mes cheveux par cœur." },
  { id: "r14", date: "2026-08-08", rating: 4, client: "Awa Sarr", service: "Soin visage", staff: "Bineta", salon: "seaplaza" },
  { id: "r15", date: "2026-08-12", rating: 1, client: "Mame Diarra", service: "Coloration", staff: "Aïda", salon: "almadies", comment: "Résultat orange, très déçue. Personne ne m'a rappelée." },
  { id: "r16", date: "2026-08-15", rating: 5, client: "Khady Guèye", service: "Balayage", staff: "Mariama", salon: "almadies", comment: "Magnifique, bravo." },
  { id: "r17", date: "2026-08-18", rating: 4, client: "Sokhna Ndiaye", service: "Manucure", staff: "Coumba", salon: "seaplaza" },
  { id: "r18", date: "2026-08-20", rating: 5, client: "Bineta Diagne", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies" },
  { id: "r19", date: "2026-08-22", rating: 2, client: "Mariam Kane", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Le produit a piqué, pas assez à l'écoute." },
  { id: "r20", date: "2026-08-24", rating: 4, client: "Coumba Thiam", service: "Coupe", staff: "Aïda", salon: "almadies", comment: "Mieux que la dernière fois." },
  { id: "r21", date: "2026-08-26", rating: 5, client: "Fatou Camara", service: "Coloration", staff: "Mariama", salon: "almadies", comment: "Toujours parfaite." },
  { id: "r22", date: "2026-08-27", rating: 5, client: "Adama Sarr", service: "Manucure", staff: "Coumba", salon: "seaplaza" },
  { id: "r23", date: "2026-08-29", rating: 3, client: "Ndèye Diop", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies", comment: "Le brushing n'a pas tenu la journée." },
  { id: "r24", date: "2026-08-30", rating: 5, client: "Dieynaba Kane", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Très professionnelle, je recommande." },
  { id: "r25", date: "2026-09-01", rating: 4, client: "Rokhaya Seck", service: "Balayage", staff: "Mariama", salon: "almadies" },
  { id: "r26", date: "2026-09-02", rating: 5, client: "Yacine Wade", service: "Manucure", staff: "Coumba", salon: "seaplaza", comment: "Rien à redire." },
];

const mean = (list: Review[]) =>
  list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : null;

const round1 = (n: number) => Math.round(n * 10) / 10;

// Fiabilité de la moyenne selon le nombre d'avis — en dessous d'une poignée
// d'avis, la moyenne ne veut rien dire et l'écran doit le dire.
export type SatisfactionReliability = "none" | "insufficient" | "limited" | "ok";

export function satisfaction(scope: SalonScope, windowDays: SatisfactionWindow) {
  const days = Number(windowDays);
  const end = new Date(TODAY_ISO).getTime();
  const start = end - days * DAY_MS;
  const prevStart = start - days * DAY_MS;

  const ts = (r: Review) => new Date(r.date).getTime();
  const inScope = REVIEWS.filter((r) => scope === "all" || r.salon === scope);
  const current = inScope
    .filter((r) => ts(r) >= start && ts(r) <= end)
    .sort((a, b) => b.date.localeCompare(a.date));
  const previous = inScope.filter((r) => ts(r) >= prevStart && ts(r) < start);

  const avg = mean(current);
  const prevAvg = previous.length >= 3 ? mean(previous) : null;
  const trend =
    avg != null && prevAvg != null ? round1(avg - prevAvg) : null;

  const distribution = ([5, 4, 3, 2, 1] as const).map((stars) => ({
    stars,
    count: current.filter((r) => r.rating === stars).length,
  }));

  const unhappy = current.filter((r) => r.rating <= 2);

  const byStaff = [...new Set(current.map((r) => r.staff))]
    .map((name) => {
      const list = current.filter((r) => r.staff === name);
      return {
        name,
        salon: salonName(list[0].salon),
        avg: mean(list) as number,
        count: list.length,
        lowSample: list.length < 4,
      };
    })
    .sort((a, b) =>
      a.lowSample !== b.lowSample
        ? Number(a.lowSample) - Number(b.lowSample)
        : b.avg - a.avg,
    );

  const reliability: SatisfactionReliability =
    current.length === 0
      ? "none"
      : current.length < 5
        ? "insufficient"
        : current.length < 15
          ? "limited"
          : "ok";

  return {
    windowLabel: `${days} derniers jours`,
    count: current.length,
    avg,
    trend,
    trendLabel: "vs période précédente",
    reliability,
    distribution,
    unhappy,
    byStaff,
    comments: current.filter((r) => r.comment),
  };
}

// Satisfaction d'une seule collaboratrice — pour le bloc « Activité » de sa fiche
// dans l'écran Équipe. Mêmes avis que `satisfaction()`, filtrés sur son prénom
// (le rapprochement équipe se fait par prénom dans tout le projet, cf. Planning).
// Fenêtre par défaut à 90 jours : sur une seule personne, 30 jours donnent
// rarement assez d'avis pour dire quoi que ce soit.
export function staffSatisfaction(
  firstName: string,
  windowDays: SatisfactionWindow = "90",
) {
  const days = Number(windowDays);
  const end = new Date(TODAY_ISO).getTime();
  const start = end - days * DAY_MS;
  const prevStart = start - days * DAY_MS;
  const ts = (r: Review) => new Date(r.date).getTime();

  const mine = REVIEWS.filter((r) => r.staff === firstName);
  const current = mine
    .filter((r) => ts(r) >= start && ts(r) <= end)
    .sort((a, b) => b.date.localeCompare(a.date));
  const previous = mine.filter((r) => ts(r) >= prevStart && ts(r) < start);

  const avg = mean(current);
  const prevAvg = previous.length >= 3 ? mean(previous) : null;

  return {
    windowLabel: `${days} derniers jours`,
    count: current.length,
    avg,
    trend: avg != null && prevAvg != null ? round1(avg - prevAvg) : null,
    // En dessous de 4 avis, la moyenne ne veut rien dire : la fiche l'affiche
    // en clair au lieu d'un chiffre trompeur.
    lowSample: current.length > 0 && current.length < 4,
    comments: current.filter((r) => r.comment),
  };
}

/* ------------------------------------------------------------------ */
/* Rapport paramétrable — l'utilisatrice choisit indicateurs + axe     */
/* ------------------------------------------------------------------ */
//
// La page « Rapports » n'est pas un tableau figé : on coche les indicateurs
// voulus (CA, acomptes, absences…), on choisit un axe de regroupement
// (salon / praticien / prestation / client / période), et `buildReport` renvoie
// le tableau correspondant — total en pied, prêt à imprimer ou exporter.
//
// Tout est dérivé des mêmes totaux de période que le tableau de bord
// (`KPI_SEEDS`), ventilés par des vecteurs de poids fixes ; le reste d'arrondi
// tombe sur la dernière ligne, donc les colonnes additives se réconcilient.

export type ReportMetricId =
  | "revenue"
  | "deposits"
  | "visits"
  | "avgTicket"
  | "cancellations"
  | "noShows"
  | "satisfaction"
  | "loyaltyPoints";

export type ReportGroupId = "salon" | "practitioner" | "service" | "client" | "period";

export type ReportMetric = {
  id: ReportMetricId;
  label: string;
  kind: "amount" | "count" | "rating";
  aggregate: "sum" | "ratio" | "avg"; // calcul de la ligne « Total »
  groups: ReportGroupId[]; // axes sur lesquels l'indicateur a un sens
};

// Ordre canonique d'affichage des colonnes.
export const REPORT_METRICS: ReportMetric[] = [
  { id: "revenue", label: "Chiffre d'affaires", kind: "amount", aggregate: "sum", groups: ["salon", "practitioner", "service", "client", "period"] },
  { id: "deposits", label: "Acomptes encaissés", kind: "amount", aggregate: "sum", groups: ["salon", "client", "period"] },
  { id: "visits", label: "Visites terminées", kind: "count", aggregate: "sum", groups: ["salon", "practitioner", "service", "client", "period"] },
  { id: "avgTicket", label: "Panier moyen", kind: "amount", aggregate: "ratio", groups: ["salon", "practitioner", "service", "client", "period"] },
  { id: "cancellations", label: "Annulations", kind: "count", aggregate: "sum", groups: ["salon", "practitioner", "service", "client", "period"] },
  { id: "noShows", label: "Absences", kind: "count", aggregate: "sum", groups: ["salon", "practitioner", "service", "client", "period"] },
  { id: "satisfaction", label: "Satisfaction", kind: "rating", aggregate: "avg", groups: ["salon", "practitioner", "service", "client", "period"] },
  { id: "loyaltyPoints", label: "Points fidélité", kind: "count", aggregate: "sum", groups: ["salon", "client", "period"] },
];

export const REPORT_GROUPS: { id: ReportGroupId; label: string; header: string }[] = [
  { id: "salon", label: "Salon", header: "Salon" },
  { id: "practitioner", label: "Praticien", header: "Praticien" },
  { id: "service", label: "Prestation", header: "Prestation" },
  { id: "client", label: "Client", header: "Cliente" },
  { id: "period", label: "Période", header: "Période" },
];

export type ReportCell = { raw: number | null; display: string };

export type ReportRow = {
  key: string;
  label: string;
  cells: Partial<Record<ReportMetricId, ReportCell>>;
};

export type GeneratedReport = {
  title: string;
  groupHeader: string;
  periodLabel: string;
  scopeLabel: string;
  metrics: ReportMetric[]; // colonnes retenues, dans l'ordre canonique
  droppedMetrics: ReportMetric[]; // cochées mais sans objet sur cet axe
  rows: ReportRow[];
  totals: Partial<Record<ReportMetricId, ReportCell>>;
  hasRows: boolean;
};

// Répartit un entier selon des poids, le reste d'arrondi va sur la dernière part.
const splitTotal = (total: number, weights: number[]): number[] => {
  if (weights.length === 0) return [];
  const raw = weights.map((w) => Math.round(total * w));
  raw[raw.length - 1] += total - raw.reduce((a, b) => a + b, 0);
  return raw;
};

const safeAvg = (revenue: number, visits: number) =>
  visits > 0 ? Math.round(revenue / visits) : 0;

// Totaux de période, avant filtre salon. CA / visites / satisfaction viennent
// des `KPI_SEEDS` (cohérence avec le tableau de bord) ; le reste est propre au rapport.
const REPORT_EXTRA: Record<
  "today" | "week" | "month",
  { deposits: number; cancellations: number; noShows: number; loyaltyPoints: number }
> = {
  today: { deposits: 80_000, cancellations: 0, noShows: 0, loyaltyPoints: 40 },
  week: { deposits: 190_000, cancellations: 1, noShows: 1, loyaltyPoints: 120 },
  month: { deposits: 520_000, cancellations: 3, noShows: 2, loyaltyPoints: 200 },
};

type RowSeed = { key: string; label: string; weight: number; satisfaction: number };

// Lignes par axe (hors « période », dérivé des séries temporelles existantes).
// `weight` = part des indicateurs additifs ; `satisfaction` = note propre (0 = n/a).
const GROUP_ROWS: Record<Exclude<ReportGroupId, "period">, RowSeed[]> = {
  salon: [
    { key: "almadies", label: "Almadies", weight: SHARE.almadies, satisfaction: 4.7 },
    { key: "seaplaza", label: "Sea Plaza", weight: SHARE.seaplaza, satisfaction: 4.5 },
  ],
  practitioner: [
    { key: "sophie", label: "Sophie Ndione", weight: 0.24, satisfaction: 4.8 },
    { key: "mariama", label: "Mariama Bâ", weight: 0.22, satisfaction: 4.7 },
    { key: "aida", label: "Aïda Sarr", weight: 0.18, satisfaction: 4.4 },
    { key: "bineta", label: "Bineta Cissé", weight: 0.16, satisfaction: 4.6 },
    { key: "coumba", label: "Coumba Faye", weight: 0.15, satisfaction: 4.9 },
    { key: "unassigned", label: "Non assigné", weight: 0.05, satisfaction: 0 },
  ],
  service: [
    { key: "coupe", label: "Coupe & Brushing", weight: 0.28, satisfaction: 4.7 },
    { key: "coloration", label: "Coloration", weight: 0.3, satisfaction: 4.5 },
    { key: "soin", label: "Soin visage", weight: 0.15, satisfaction: 4.8 },
    { key: "manucure", label: "Manucure", weight: 0.1, satisfaction: 4.6 },
    { key: "balayage", label: "Balayage", weight: 0.17, satisfaction: 4.4 },
  ],
  client: [
    { key: "c1", label: "Awa Sarr", weight: 0.14, satisfaction: 5 },
    { key: "c2", label: "Fatou Camara", weight: 0.12, satisfaction: 4 },
    { key: "c3", label: "Coumba Thiam", weight: 0.11, satisfaction: 5 },
    { key: "c4", label: "Bineta Diagne", weight: 0.1, satisfaction: 4 },
    { key: "c5", label: "Mariam Kane", weight: 0.09, satisfaction: 5 },
    { key: "c6", label: "Khady Guèye", weight: 0.08, satisfaction: 4 },
    { key: "c7", label: "Sokhna Ndiaye", weight: 0.07, satisfaction: 5 },
    { key: "c8", label: "Rama Diallo", weight: 0.06, satisfaction: 4 },
    { key: "other", label: "Autres clientes", weight: 0.23, satisfaction: 4.6 },
  ],
};

const formatCell = (raw: number | null, kind: ReportMetric["kind"]): ReportCell => {
  if (raw === null) return { raw: null, display: "—" };
  if (kind === "amount") return { raw, display: fcfa(raw) };
  if (kind === "rating")
    return { raw, display: `${raw.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}/5` };
  return { raw, display: groupThousands(raw) };
};

// Lignes de l'axe « période » : une ligne par pas de temps de la série existante.
function periodRows(
  scope: SalonScope,
  dp: "today" | "week" | "month",
  periodSatisfaction: number,
): { key: string; label: string; revenue: number; visits: number; weight: number; satisfaction: number }[] {
  const ids: SalonId[] = scope === "all" ? salons.map((s) => s.id) : [scope as SalonId];
  const rev = REVENUE[dp];
  const app = APPOINTMENTS[dp];
  const perBucketRevenue = rev.categories.map((_, i) =>
    ids.reduce((sum, id) => sum + rev.bySalon[id][i], 0),
  );
  const perBucketVisits = app.categories.map((_, i) =>
    ids.reduce((sum, id) => sum + app.bySalon[id][i], 0),
  );
  const totalRevenue = perBucketRevenue.reduce((a, b) => a + b, 0);
  return rev.categories.map((label, i) => ({
    key: `p${i}`,
    label,
    revenue: perBucketRevenue[i],
    visits: perBucketVisits[i],
    weight: totalRevenue > 0 ? perBucketRevenue[i] / totalRevenue : 0,
    // Légère variation déterministe autour de la moyenne de période.
    satisfaction: Math.min(5, Math.max(3, periodSatisfaction + [-0.1, 0, 0.1, 0][i % 4])),
  }));
}

export function buildReport(opts: {
  scope: SalonScope;
  period: PeriodId;
  group: ReportGroupId;
  metrics: ReportMetricId[];
}): GeneratedReport {
  const { scope, period, group } = opts;
  const dp = dataPeriod(period);
  const f = factor(scope);
  const caSeed = KPI_SEEDS[dp].find((s) => s.key === "ca")!;
  const rdvSeed = KPI_SEEDS[dp].find((s) => s.key === "rdv")!;
  const satSeed = KPI_SEEDS[dp].find((s) => s.key === "satisfaction")!;
  const extra = REPORT_EXTRA[dp];

  // Totaux de période (après filtre salon) pour les indicateurs additifs.
  const totalRevenue = Math.round(caSeed.amount * f);
  const totalVisits = Math.round(rdvSeed.amount * f);
  const totalDeposits = Math.round(extra.deposits * f);
  const totalCancellations = Math.round(extra.cancellations * f);
  const totalNoShows = Math.round(extra.noShows * f);
  const totalLoyalty = Math.round(extra.loyaltyPoints * f);

  // Colonnes : ordre canonique, en séparant celles qui ont un sens sur cet axe.
  const selected = new Set(opts.metrics);
  const metrics = REPORT_METRICS.filter((m) => selected.has(m.id) && m.groups.includes(group));
  const droppedMetrics = REPORT_METRICS.filter(
    (m) => selected.has(m.id) && !m.groups.includes(group),
  );

  // Construction des lignes : on résout d'abord les valeurs brutes par indicateur.
  type Raw = {
    key: string;
    label: string;
    revenue: number;
    visits: number;
    deposits: number;
    cancellations: number;
    noShows: number;
    loyaltyPoints: number;
    satisfaction: number | null;
  };

  let raws: Raw[];

  if (group === "period") {
    const pr = periodRows(scope, dp, satSeed.amount);
    const weights = pr.map((r) => r.weight);
    const dep = splitTotal(totalDeposits, weights);
    const can = splitTotal(totalCancellations, weights);
    const nos = splitTotal(totalNoShows, weights);
    const loy = splitTotal(totalLoyalty, weights);
    raws = pr.map((r, i) => ({
      key: r.key,
      label: r.label,
      revenue: r.revenue,
      visits: r.visits,
      deposits: dep[i],
      cancellations: can[i],
      noShows: nos[i],
      loyaltyPoints: loy[i],
      satisfaction: r.satisfaction,
    }));
  } else {
    const seeds = GROUP_ROWS[group];
    const weights = seeds.map((s) => s.weight);
    const rev = splitTotal(totalRevenue, weights);
    const vis = splitTotal(totalVisits, weights);
    const dep = splitTotal(totalDeposits, weights);
    const can = splitTotal(totalCancellations, weights);
    const nos = splitTotal(totalNoShows, weights);
    const loy = splitTotal(totalLoyalty, weights);
    raws = seeds.map((s, i) => ({
      key: s.key,
      label: s.label,
      revenue: rev[i],
      visits: vis[i],
      deposits: dep[i],
      cancellations: can[i],
      noShows: nos[i],
      loyaltyPoints: loy[i],
      satisfaction: s.satisfaction > 0 ? s.satisfaction : null,
    }));
    // Le plus gros contributeur en tête ; « Non assigné » / « Autres » en dernier.
    raws.sort((a, b) => {
      const aTail = a.key === "unassigned" || a.key === "other";
      const bTail = b.key === "unassigned" || b.key === "other";
      if (aTail !== bTail) return aTail ? 1 : -1;
      return b.revenue - a.revenue;
    });
  }

  const rawValue = (r: Raw, id: ReportMetricId): number | null => {
    switch (id) {
      case "revenue":
        return r.revenue;
      case "deposits":
        return r.deposits;
      case "visits":
        return r.visits;
      case "avgTicket":
        return safeAvg(r.revenue, r.visits);
      case "cancellations":
        return r.cancellations;
      case "noShows":
        return r.noShows;
      case "loyaltyPoints":
        return r.loyaltyPoints;
      case "satisfaction":
        return r.satisfaction;
    }
  };

  const rows: ReportRow[] = raws.map((r) => ({
    key: r.key,
    label: r.label,
    cells: Object.fromEntries(
      metrics.map((m) => [m.id, formatCell(rawValue(r, m.id), m.kind)]),
    ),
  }));

  // Ligne « Total » : somme, ratio (panier moyen) ou moyenne (satisfaction).
  const totalRaw = (m: ReportMetric): number | null => {
    if (m.aggregate === "ratio") return safeAvg(totalRevenue, totalVisits);
    if (m.aggregate === "avg") {
      const vals = raws.map((r) => r.satisfaction).filter((v): v is number => v !== null);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    }
    return raws.reduce((sum, r) => sum + (rawValue(r, m.id) ?? 0), 0);
  };
  const totals = Object.fromEntries(
    metrics.map((m) => [m.id, formatCell(totalRaw(m), m.kind)]),
  );

  const periodLbl = period === "custom" ? "Période personnalisée" : periodLabel(period);
  const groupDef = REPORT_GROUPS.find((g) => g.id === group)!;
  const metricPart =
    metrics.length === 0
      ? "Aucun indicateur"
      : metrics.length <= 3
        ? metrics.map((m) => m.label).join(", ")
        : `${metrics.length} indicateurs`;

  return {
    title: `${metricPart} — par ${groupDef.label.toLowerCase()} — ${periodLbl} · ${salonName(scope)}`,
    groupHeader: groupDef.header,
    periodLabel: periodLbl,
    scopeLabel: salonName(scope),
    metrics,
    droppedMetrics,
    rows: metrics.length === 0 ? [] : rows,
    totals,
    hasRows: metrics.length > 0 && rows.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Clientèle — fiches clientes, historique de visites, fidélité        */
/* ------------------------------------------------------------------ */
//
// Alimente l'écran « Clients » (répertoire) et la fiche cliente. Point-de-vente
// fait autorité (2026-09-27) : les dix clientes que la caisse connaît
// (`point-de-vente/lib/data/clientele.ts`, `cl-1` … `cl-10`) portent ici la
// même identité — nom, n° client, téléphone / WhatsApp, e-mail, adresse, pays
// de résidence, anniversaire, ethnicité, palier, points, préférences, notes
// signées, praticienne préférée, total dépensé et nombre de visites. Le
// rattachement `cl-N` → `cNN` est celui de `PDV_CLIENT` dans `./rendezvous`
// (cl-7 → c11, cl-9 → c14). Les autres fiches n'existent que côté back-office.
//
// Les rendez-vous à venir ne vivent pas ici : ils se lisent dans
// `./rendezvous` (jointure faite par `ClientsContext`, pour éviter un cycle
// d'import). Seul l'historique ancien (avant les réservations reprises de
// point-de-vente) est saisi ci-dessous, en prestations réelles du catalogue.

export type ClientVisitStatus = "honoré" | "à venir" | "annulé";

export type ClientVisit = {
  date: string; // ISO yyyy-mm-dd
  time?: string; // « HH:MM », pour un rendez-vous de `./rendezvous`
  service: string;
  staff: string;
  amount: number; // FCFA facturés (0 si annulé ou à venir)
  status: ClientVisitStatus;
  rdvId?: string; // renseigné quand la visite est un rendez-vous de `./rendezvous`
};

export type ClientGender = "femme" | "homme";

export const genderLabel = (g: ClientGender) => (g === "homme" ? "Homme" : "Femme");
// Nom commun accordé au genre — « la cliente » / « le client » dans les libellés.
export const clientNoun = (g: ClientGender) => (g === "homme" ? "client" : "cliente");

// Palier de fidélité — champ de la fiche, comme `Cliente.tier` de
// point-de-vente (jamais recalculé depuis les points là-bas non plus).
export type ClientTier = "silver" | "gold" | "platinum" | "vip" | null;
export const TIER_LABEL: Record<Exclude<ClientTier, null>, string> = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  vip: "VIP",
};

export type ClientEthnicity = "asiatique" | "africain" | "americain" | "europeen";
export const ETHNICITY_LABEL: Record<ClientEthnicity, string> = {
  asiatique: "Asiatique",
  africain: "Africain",
  americain: "Américain",
  europeen: "Européen",
};
export const ETHNICITY_OPTIONS = (Object.keys(ETHNICITY_LABEL) as ClientEthnicity[]).map((value) => ({
  value,
  label: ETHNICITY_LABEL[value],
}));

const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// « N° 1042 » — le numéro cliente tel qu'il s'affiche partout (point-de-vente).
export const clientNumberLabel = (n: number) => `N° ${n}`;

// « MM-JJ » → « 27 septembre » (jamais l'année, comme point-de-vente).
export function formatBirthday(birthday: string): string {
  const [m, d] = birthday.split("-").map(Number);
  if (!m || !d) return birthday;
  return `${d === 1 ? "1er" : d} ${MONTH_NAMES[m - 1]}`;
}

// Préférences de la cliente : modèle de point-de-vente (2026-09-27) — texte libre
// par domaine + passages de « Noter la cliente » (réponses aux questions
// configurées dans Réglages › Préférences clientes), voir `./preferences`.
export type { ClientPreferences } from "./preferences";

// Note interne signée (journal de la fiche) — `authorId` = membre de l'équipe
// (`./staff`), `origin` dit si elle a été prise sur la fiche ou juste après un
// encaissement (même modèle que `ClientNote` de point-de-vente).
export type ClientNoteSeed = {
  text: string;
  at: string; // ISO datetime
  authorId: string;
  origin: "fiche" | "encaissement";
};

// Les dates de passage et de note de point-de-vente sont écrites par rapport à
// son « aujourd'hui » (25 sept.) ; le monde de démo d'ici est figé au 3 sept.
// On les recale du même écart, pour qu'aucune ne tombe dans le futur.
const PDV_SHIFT_DAYS = 22;
const pdv = (iso: string) => {
  const d = new Date(iso.length > 10 ? iso : `${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - PDV_SHIFT_DAYS);
  return iso.length > 10 ? d.toISOString() : d.toISOString().slice(0, 10);
};

type ClientSeed = {
  id: string;
  number: number; // n° client, séquentiel, jamais réattribué
  name: string;
  gender?: ClientGender;
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  profession?: string;
  residenceCountry: string;
  birthday: string; // « MM-JJ »
  ethnicity: ClientEthnicity;
  salon: SalonId; // salon habituel (filtre salon du répertoire)
  since: string; // ISO — cliente depuis
  tier: ClientTier;
  points: number;
  preferredStaffId?: string; // membre de `./staff`
  // Cumul tenu par la caisse (point-de-vente) : fait foi sur le compte de
  // visites / le total dépensé, l'historique ci-dessous n'en montre que le récent.
  totals?: { spent: number; visits: number };
  preferences?: ClientPreferences;
  notes?: ClientNoteSeed[];
  visits: ClientVisit[];
};

// Anciennes visites, en prestations réelles du catalogue (`./services`) —
// repris à la main pour ne pas créer de cycle d'import avec le catalogue.
const SVC = {
  brushing: ["Shampoing Brushing (Shampoing Inclus et Obligatoire)", 23_000],
  soinComplet: ["Soin Complet", 46_000],
  glow: ["Glow Me Facial", 49_000],
  hydra: ["Hydrafacial Deep Clean", 55_000],
  silk: ["Silk Press", 79_000],
  manucure: ["Manucure + Permanent", 32_000],
  jelly: ["Jelly Pédicure", 29_000],
  coupe: ["Coupe Transformation", 36_000],
  tresses: ["Tresses Cheveux +", 19_000],
  relax: ["Relax Me Time", 60_000],
  dos: ["Soin du Dos", 65_000],
  pierres: ["Hot Stone - Pierres Chaudes", 59_000],
  aisselles: ["Épilation Aisselles", 7_000],
  jambes: ["Épilation Jambes Complètes", 14_000],
} as const satisfies Record<string, readonly [string, number]>;

// Raccourci de saisie — le statut par défaut est « honoré ».
const v = (
  date: string,
  service: keyof typeof SVC,
  staff: string,
  status: ClientVisitStatus = "honoré",
): ClientVisit => ({
  date,
  service: SVC[service][0],
  staff,
  amount: status === "honoré" ? SVC[service][1] : 0,
  status,
});

const CLIENT_SEEDS: ClientSeed[] = [
  /* ---- Les dix clientes de point-de-vente ---- */
  {
    id: "c01", number: 1006, name: "Awa Sarr", email: "awa.sarr@example.com",
    phone: "+221 78 445 56 61", whatsapp: "+221 78 445 56 61",
    address: "Sacré-Cœur 3, Villa 412, Dakar", residenceCountry: "Sénégal", birthday: "03-14", ethnicity: "africain",
    salon: "almadies", since: "2026-02-01", tier: null, points: 320, preferredStaffId: "m-bineta",
    totals: { spent: 245_000, visits: 9 },
    preferences: {
      hairType: "Naturel 4C",
      colorReference: "Châtain profond #3",
      notes: {
        coiffure: "Préfère les tresses collées, pas de rajouts trop lourds.",
        boisson: "Thé à la menthe, sans sucre.",
      },
      rounds: [
        { at: pdv("2026-09-19"), choices: { "ongles-type": ["gel-x"], "ongles-longueur": ["moyens"], "coiffure-style": ["tresses-collees"], "coiffure-soin": ["masque"], "boisson-choix": ["the-menthe"], "boisson-sucre": ["sans-sucre"] } },
        { at: pdv("2026-08-30"), choices: { "ongles-type": ["gel-x", "french"], "ongles-longueur": ["longs"], "boisson-choix": ["the-menthe"], "boisson-sucre": ["sans-sucre"] } },
        { at: pdv("2026-08-02"), choices: { "ongles-type": ["capsules", "french"], "ongles-longueur": ["longs"], "coiffure-style": ["tresses-collees"], "coiffure-soin": ["bain-huile"], "boisson-choix": ["bissap"], "boisson-sucre": ["peu-sucre"] } },
        { at: pdv("2026-06-21"), choices: { "ongles-type": ["vernis-permanent"], "ongles-longueur": ["courts"], "coiffure-style": ["box-braids"], "coiffure-soin": ["masque"], "boisson-choix": ["the-menthe"], "boisson-sucre": ["sans-sucre"] } },
        { at: pdv("2026-05-09"), choices: { "ongles-type": ["gel-x", "decoration"], "ongles-longueur": ["longs"], "coiffure-style": ["tresses-collees"], "coiffure-soin": ["masque"], "boisson-choix": ["the-menthe"] } },
      ],
    },
    notes: [
      { at: pdv("2026-09-19T16:40:00.000Z"), authorId: "m-awa", origin: "encaissement", text: "A demandé à être prévenue dès qu'un créneau se libère le samedi matin." },
      { at: pdv("2026-08-02T11:15:00.000Z"), authorId: "m-bineta", origin: "fiche", text: "Cuir chevelu sensible — éviter les produits mentholés au shampooing." },
    ],
    visits: [
      v("2026-08-28", "tresses", "Bineta Cissé"),
      v("2026-08-08", "manucure", "Coumba Faye"),
      v("2026-07-11", "tresses", "Bineta Cissé"),
      v("2026-05-30", "glow", "Sophie Ndione"),
    ],
  },
  {
    id: "c02", number: 1009, name: "Fatou Camara", email: "fatou.camara@example.com",
    phone: "+221 77 112 23 34",
    address: "Cité Keur Gorgui, Rue 12, Dakar", residenceCountry: "Sénégal", birthday: "10-12", ethnicity: "africain",
    salon: "almadies", since: "2026-05-10", tier: null, points: 140,
    totals: { spent: 98_000, visits: 4 },
    preferences: {
      notes: {},
      rounds: [
        { at: pdv("2026-09-10"), choices: { "ongles-type": ["vernis-permanent", "decoration"], "ongles-longueur": ["courts"], "boisson-choix": ["cafe"] } },
        { at: pdv("2026-07-18"), choices: { "ongles-type": ["vernis-permanent"], "ongles-longueur": ["courts"], "spa-massage": ["relaxant"], "spa-pression": ["legere"] } },
        { at: pdv("2026-06-02"), choices: { "ongles-type": ["french"], "ongles-longueur": ["moyens"], "boisson-choix": ["cafe", "eau"] } },
      ],
    },
    notes: [
      { at: pdv("2026-09-10T15:05:00.000Z"), authorId: "m-rokhaya", origin: "encaissement", text: "Vient souvent avec sa fille, prévoir un fauteuil en plus." },
    ],
    visits: [
      v("2026-08-19", "manucure", "Aïda Sarr"),
      v("2026-06-26", "relax", "Sophie Ndione"),
      v("2026-05-11", "manucure", "Aïda Sarr"),
    ],
  },
  {
    id: "c03", number: 1010, name: "Coumba Thiam", email: "coumba.thiam@example.com",
    phone: "+221 76 554 43 32",
    address: "Parcelles Assainies U15, Dakar", residenceCountry: "Sénégal", birthday: "09-26", ethnicity: "africain",
    salon: "almadies", since: "2026-06-20", tier: null, points: 60,
    totals: { spent: 42_000, visits: 2 },
    visits: [
      v("2026-08-06", "tresses", "Mariama Bâ"),
      v("2026-06-20", "brushing", "Mariama Bâ"),
    ],
  },
  {
    id: "c04", number: 1005, name: "Bineta Diagne", email: "bineta.diagne@example.com",
    phone: "+221 70 998 87 76",
    address: "Mermoz, Rue MZ-24, Dakar", residenceCountry: "Sénégal", birthday: "07-02", ethnicity: "africain",
    salon: "almadies", since: "2026-01-15", tier: null, points: 210,
    totals: { spent: 156_000, visits: 6 },
    visits: [
      v("2026-08-03", "jelly", "Aïda Sarr"),
      v("2026-06-12", "glow", "Sophie Ndione"),
      v("2026-04-18", "manucure", "Aïda Sarr"),
    ],
  },
  {
    id: "c05", number: 1007, name: "Mariam Kane", email: "mariam.kane@example.com",
    phone: "+221 78 123 45 67",
    address: "Cocody Angré, Rue des Jardins, Abidjan", residenceCountry: "Côte d'Ivoire", birthday: "12-05", ethnicity: "africain",
    salon: "seaplaza", since: "2026-03-05", tier: null, points: 90,
    totals: { spent: 61_000, visits: 3 },
    visits: [
      v("2026-07-02", "brushing", "Mariama Bâ"),
      v("2026-03-05", "tresses", "Bineta Cissé"),
    ],
  },
  {
    id: "c06", number: 1002, name: "Awa Niang", email: "awa.niang@example.com",
    phone: "+221 77 654 32 10",
    address: "Almadies, Route des Almadies, Dakar", residenceCountry: "Sénégal", birthday: "01-23", ethnicity: "africain",
    salon: "almadies", since: "2025-09-01", tier: "vip", points: 1420, preferredStaffId: "m-mariama",
    totals: { spent: 890_000, visits: 22 },
    preferences: {
      hairType: "Défrisé",
      colorReference: "Auburn #30",
      notes: {
        onglerie: "Vernis semi-permanent nude, ongles courts et carrés.",
        spa: "Sensible au parfum d'eucalyptus — préférer la lavande.",
      },
      rounds: [
        { at: pdv("2026-09-14"), choices: { "spa-massage": ["pierres-chaudes"], "spa-pression": ["forte"], "ongles-type": ["french"], "ongles-longueur": ["moyens"] } },
        { at: pdv("2026-08-10"), choices: { "spa-massage": ["deep-tissue"], "spa-pression": ["forte"] } },
        { at: pdv("2026-07-06"), choices: { "spa-massage": ["deep-tissue", "relaxant"], "spa-pression": ["moyenne"], "ongles-type": ["french"], "ongles-longueur": ["courts"] } },
      ],
    },
    notes: [
      { at: pdv("2026-07-22T10:30:00.000Z"), authorId: "m-awa", origin: "fiche", text: "Préfère régler par Wave. Arrive en général 10 min en avance." },
    ],
    visits: [
      v("2026-08-23", "pierres", "Sophie Ndione"),
      v("2026-07-19", "relax", "Sophie Ndione"),
      v("2026-06-14", "silk", "Mariama Bâ"),
      v("2026-05-02", "dos", "Sophie Ndione"),
    ],
  },
  {
    id: "c08", number: 1004, name: "Ndèye Diop", email: "ndeye.diop@example.com",
    phone: "+221 78 123 99 00",
    address: "12 Rue de Belleville, 75020 Paris", residenceCountry: "France", birthday: "11-30", ethnicity: "africain",
    salon: "almadies", since: "2025-12-01", tier: "silver", points: 300,
    totals: { spent: 180_000, visits: 7 },
    visits: [
      v("2026-04-02", "silk", "Mariama Bâ"),
      v("2026-02-14", "soinComplet", "Mariama Bâ"),
      v("2025-12-20", "brushing", "Sophie Ndione"),
    ],
  },
  {
    id: "c10", number: 1008, name: "Aminata Fall", email: "aminata.fall@example.com",
    phone: "+221 77 662 31 45", whatsapp: "+221 77 662 31 45",
    address: "Liberté 6, Rue LB-19, Dakar", residenceCountry: "Sénégal", birthday: "09-27", ethnicity: "africain",
    salon: "almadies", since: "2026-04-12", tier: null, points: 140,
    totals: { spent: 96_000, visits: 4 },
    preferences: {
      notes: { boisson: "Jus de bissap pour les enfants, jamais de café." },
      rounds: [
        { at: pdv("2026-09-05"), choices: { "boisson-choix": ["cafe"], "boisson-sucre": ["sucre"], "coiffure-style": ["brushing"], "coiffure-soin": ["keratine"] } },
        { at: pdv("2026-08-08"), choices: { "boisson-choix": ["cafe"], "boisson-sucre": ["sucre"], "coiffure-style": ["coupe", "brushing"], "coiffure-soin": ["shampoing"] } },
      ],
    },
    visits: [
      v("2026-08-14", "brushing", "Mariama Bâ"),
      v("2026-07-17", "coupe", "Mariama Bâ"),
    ],
  },
  {
    id: "c11", number: 1003, name: "Sokhna Ndiaye", email: "sokhna.ndiaye@example.com",
    phone: "+221 70 321 65 49",
    address: "Point E, Rue 4 x E, Dakar", residenceCountry: "Sénégal", birthday: "05-18", ethnicity: "africain",
    salon: "seaplaza", since: "2025-11-12", tier: "gold", points: 680,
    totals: { spent: 410_000, visits: 14 },
    visits: [
      v("2026-08-18", "manucure", "Coumba Faye"),
      v("2026-08-01", "manucure", "Coumba Faye"),
      v("2026-07-10", "jelly", "Coumba Faye"),
      v("2026-06-15", "glow", "Bineta Cissé"),
    ],
  },
  {
    id: "c14", number: 1001, name: "Yacine Wade", email: "yacine.wade@example.com",
    phone: "+221 77 555 12 34", whatsapp: "+221 77 555 12 34",
    address: "Ouakam, Cité Assemblée, Dakar", residenceCountry: "Sénégal", birthday: "10-03", ethnicity: "africain",
    salon: "seaplaza", since: "2025-08-19", tier: "platinum", points: 950,
    totals: { spent: 620_000, visits: 18 },
    preferences: {
      hairType: "Locks",
      colorReference: "Noir naturel #1",
      notes: {
        epilation: "Cire tiède uniquement, peau réactive.",
        boisson: "Café noir, un carré de chocolat.",
      },
      rounds: [
        { at: pdv("2026-09-20"), choices: { "epilation-methode": ["cire-chaude"], "epilation-zone": ["sourcils", "aisselles"], "boisson-choix": ["gingembre"], "boisson-sucre": ["peu-sucre"] } },
        { at: pdv("2026-08-22"), choices: { "epilation-methode": ["fil"], "epilation-zone": ["sourcils"], "boisson-choix": ["gingembre"] } },
        { at: pdv("2026-07-25"), choices: { "epilation-methode": ["cire-chaude"], "epilation-zone": ["sourcils", "jambes"], "boisson-choix": ["bouye"], "boisson-sucre": ["sucre"] } },
      ],
    },
    visits: [
      v("2026-08-29", "aisselles", "Bineta Cissé"),
      v("2026-07-31", "hydra", "Bineta Cissé"),
      v("2026-07-03", "jambes", "Bineta Cissé"),
    ],
  },

  /* ---- Fiches propres au back-office ---- */
  {
    id: "c07", number: 1011, name: "Adama Sarr", email: "adama.sarr@gmail.com",
    phone: "+221 78 655 20 84",
    address: "Sacré-Cœur, Dakar", residenceCountry: "Sénégal", birthday: "06-09", ethnicity: "africain",
    salon: "almadies", since: "2022-10-14", tier: null, points: 210,
    preferences: {
      notes: { onglerie: "Nail art discret." },
      rounds: [
        { at: "2026-08-12", choices: { "ongles-type": ["capsules", "decoration"], "ongles-longueur": ["longs"], "boisson-choix": ["cafe"] } },
        { at: "2026-07-10", choices: { "ongles-type": ["capsules"], "ongles-longueur": ["longs"] } },
        { at: "2026-06-12", choices: { "ongles-type": ["polygel"], "ongles-longueur": ["tres-longs"] } },
      ],
    },
    notes: [
      { at: "2026-07-10T14:05:00.000Z", authorId: "m-awa", origin: "fiche", text: "Cliente pressée — enchaîner les prestations." },
    ],
    visits: [
      v("2026-08-27", "manucure", "Aïda Sarr"),
      v("2026-08-01", "soinComplet", "Mariama Bâ"),
      v("2026-06-19", "soinComplet", "Mariama Bâ"),
    ],
  },
  {
    id: "c09", number: 1012, name: "Nafi Camara", email: "nafi.camara@orange.sn",
    phone: "+221 77 208 95 71",
    address: "Dakar", residenceCountry: "Sénégal", birthday: "02-17", ethnicity: "africain",
    salon: "almadies", since: "2024-08-01", tier: null, points: 30,
    visits: [
      v("2026-06-10", "soinComplet", "Aïda Sarr", "annulé"),
      v("2026-05-02", "soinComplet", "Aïda Sarr"),
      v("2026-01-20", "coupe", "Aïda Sarr"),
    ],
  },
  {
    id: "c12", number: 1013, name: "Rama Diallo", email: "rama.diallo@yahoo.fr",
    phone: "+221 78 233 79 10",
    address: "Dakar", residenceCountry: "Sénégal", birthday: "08-21", ethnicity: "africain",
    salon: "seaplaza", since: "2023-04-02", tier: null, points: 80,
    visits: [
      v("2026-07-06", "manucure", "Coumba Faye"),
      v("2026-06-14", "manucure", "Coumba Faye"),
      v("2026-04-02", "glow", "Bineta Cissé"),
    ],
  },
  {
    id: "c13", number: 1014, name: "Bineta Cissé", email: "bineta.cisse@gmail.com",
    phone: "+221 76 501 88 24",
    address: "Plateau, Dakar", residenceCountry: "Sénégal", birthday: "04-11", ethnicity: "africain",
    salon: "seaplaza", since: "2023-01-15", tier: null, points: 190,
    preferences: {
      notes: { coiffure: "Coupe au carré, frange à garder longue." },
      rounds: [{ at: "2026-08-15", choices: { "coiffure-style": ["coupe", "brushing"], "boisson-choix": ["eau"] } }],
    },
    visits: [
      v("2026-08-24", "brushing", "Bineta Cissé"),
      v("2026-07-20", "soinComplet", "Bineta Cissé"),
      v("2026-06-05", "brushing", "Bineta Cissé"),
    ],
  },
  {
    id: "c15", number: 1015, name: "Dieynaba Kane", email: "dieynaba.kane@gmail.com",
    phone: "+221 70 744 51 17",
    address: "Dakar", residenceCountry: "Sénégal", birthday: "12-29", ethnicity: "africain",
    salon: "seaplaza", since: "2024-05-30", tier: null, points: 100,
    visits: [
      v("2026-07-11", "manucure", "Coumba Faye"),
      v("2026-05-30", "glow", "Bineta Cissé"),
    ],
  },
  {
    id: "c16", number: 1016, name: "Penda Ndoye", email: "penda.ndoye@yahoo.fr",
    phone: "+221 77 380 09 66",
    address: "Dakar", residenceCountry: "Sénégal", birthday: "03-02", ethnicity: "africain",
    salon: "seaplaza", since: "2023-10-15", tier: null, points: 45,
    visits: [
      v("2025-12-20", "glow", "Bineta Cissé"),
      v("2025-10-15", "manucure", "Coumba Faye"),
    ],
  },
  {
    id: "c17", number: 1017, name: "Oumou Baldé", email: "oumou.balde@gmail.com",
    phone: "+221 78 690 15 42",
    address: "Dakar", residenceCountry: "Sénégal", birthday: "07-15", ethnicity: "africain",
    salon: "seaplaza", since: "2023-05-20", tier: null, points: 130,
    visits: [
      v("2026-08-12", "soinComplet", "Bineta Cissé"),
      v("2026-07-01", "coupe", "Coumba Faye"),
      v("2026-05-20", "soinComplet", "Bineta Cissé"),
    ],
  },
  {
    id: "c18", number: 1018, name: "Rokhaya Seck", email: "rokhaya.seck@gmail.com",
    phone: "+221 76 255 47 81",
    address: "Dakar", residenceCountry: "Sénégal", birthday: "10-30", ethnicity: "africain",
    salon: "seaplaza", since: "2024-06-01", tier: null, points: 110,
    visits: [
      v("2026-07-15", "brushing", "Bineta Cissé"),
      v("2026-06-01", "silk", "Bineta Cissé"),
    ],
  },
];

// Notes internes seed, reprises par `ClientsContext` (état de session).
export const CLIENT_NOTE_SEEDS: Record<string, ClientNoteSeed[]> = Object.fromEntries(
  CLIENT_SEEDS.filter((c) => c.notes?.length).map((c) => [c.id, c.notes!]),
);

const daysSinceIso = (iso: string) =>
  Math.round((new Date(TODAY_ISO).getTime() - new Date(iso).getTime()) / DAY_MS);

// Régulière (≤ 45 j) / occasionnelle / à relancer (> 100 j ou jamais venue).
export type ClientSegment = "active" | "occasionnelle" | "a-relancer";

export const segmentOf = (days: number | null): ClientSegment =>
  days === null || days > 100 ? "a-relancer" : days <= 45 ? "active" : "occasionnelle";

export const daysSince = daysSinceIso;

export type ClientRow = {
  id: string;
  number: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  gender: ClientGender;
  address: string;
  profession: string | null;
  residenceCountry: string;
  birthday: string; // « MM-JJ »
  ethnicity: ClientEthnicity;
  salon: SalonId;
  salonLabel: string;
  since: string;
  tier: ClientTier;
  preferredStaffId: string | null;
  lastVisit: string | null;
  daysSinceLastVisit: number | null;
  totalSpent: number;
  appointments: number; // visites honorées
  upcoming: number; // rendez-vous à venir
  loyaltyPoints: number;
  segment: ClientSegment;
};

function toClientRow(c: ClientSeed): ClientRow {
  const honoured = c.visits.filter((x) => x.status === "honoré");
  const upcoming = c.visits.filter((x) => x.status === "à venir");
  const lastVisit =
    honoured.length === 0
      ? null
      : honoured.reduce((m, x) => (x.date > m ? x.date : m), honoured[0].date);
  const days = lastVisit ? daysSinceIso(lastVisit) : null;

  return {
    id: c.id,
    number: c.number,
    name: c.name,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp ?? null,
    gender: c.gender ?? "femme",
    address: c.address,
    profession: c.profession ?? null,
    residenceCountry: c.residenceCountry,
    birthday: c.birthday,
    ethnicity: c.ethnicity,
    salon: c.salon,
    salonLabel: salonName(c.salon),
    since: c.since,
    tier: c.tier,
    preferredStaffId: c.preferredStaffId ?? null,
    lastVisit,
    daysSinceLastVisit: days,
    totalSpent: c.totals?.spent ?? honoured.reduce((s, x) => s + x.amount, 0),
    appointments: c.totals?.visits ?? honoured.length,
    upcoming: upcoming.length,
    loyaltyPoints: c.points,
    segment: segmentOf(days),
  };
}

export function clients(scope: SalonScope): ClientRow[] {
  return CLIENT_SEEDS.filter((c) => scope === "all" || c.salon === scope).map(toClientRow);
}

// Cliente créée il y a ≤ 30 jours — filtre « Nouvelles » du répertoire,
// aligné sur point-de-vente (`FILTERS`, `repertoire-view.tsx`).
export const isNewClient = (row: ClientRow): boolean => daysSinceIso(row.since) <= 30;

// « Historique » : au moins 5 visites (même seuil que point-de-vente).
export const HISTORIQUE_MIN_VISITS = 5;

// Identifiant d'une cliente créée en session (même convention que
// `newStaffId`/`newRequestId`/`newAbsenceId` dans les autres modules mock).
export const newClientId = () => `c-${Date.now().toString(36)}`;
// Prochain n° client libre (création en session).
export const nextClientNumber = (taken: number[]) =>
  Math.max(...CLIENT_SEEDS.map((c) => c.number), ...taken) + 1;

// Répartition des rendez-vous par statut, pour la fiche cliente.
export type ClientVisitStats = {
  total: number;
  honoured: number;
  upcoming: number;
  cancelled: number;
};

export type ClientDetail = {
  row: ClientRow;
  preferences: ClientPreferences;
  stats: ClientVisitStats;
  upcoming: ClientVisit[]; // du plus proche au plus lointain
  history: ClientVisit[]; // honorées + annulées, du plus récent au plus ancien
};

export function clientDetail(id: string): ClientDetail | null {
  const seed = CLIENT_SEEDS.find((c) => c.id === id);
  if (!seed) return null;
  const count = (s: ClientVisitStatus) => seed.visits.filter((x) => x.status === s).length;
  return {
    row: toClientRow(seed),
    preferences: seed.preferences ?? EMPTY_CLIENT_PREFERENCES,
    stats: {
      total: seed.visits.length,
      honoured: count("honoré"),
      upcoming: count("à venir"),
      cancelled: count("annulé"),
    },
    upcoming: seed.visits
      .filter((x) => x.status === "à venir")
      .sort((a, b) => a.date.localeCompare(b.date)),
    history: seed.visits
      .filter((x) => x.status !== "à venir")
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
}

// Pays de résidence — même liste courte que point-de-vente (`lib/data/pays.ts`),
// Sénégal par défaut. La fiche stocke le libellé tel quel.
export const PAYS_DEFAUT = "Sénégal";
export const PAYS_OPTIONS = [
  "Sénégal", "Bénin", "Burkina Faso", "Cameroun", "Canada", "Cap-Vert", "Côte d'Ivoire",
  "Émirats arabes unis", "Espagne", "États-Unis", "France", "Gabon", "Gambie", "Ghana",
  "Guinée", "Guinée-Bissau", "Italie", "Mali", "Maroc", "Mauritanie", "Niger", "Nigéria",
  "Portugal", "Royaume-Uni", "Suisse", "Togo", "Tunisie", "Autre",
].map((p) => ({ value: p, label: p }));

// Jour + mois → « MM-JJ ».
export const toBirthday = (day: number, month: number) =>
  `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
export { MONTH_NAMES };

// Une cliente correspond-elle à la saisie ? Même règle que point-de-vente
// (`clientMatchesQuery`) : nom, e-mail, n° client (« 1042 », « N° 1042 »,
// « #1042 »), téléphone ou WhatsApp (chiffres comparés sans espaces ni
// ponctuation). Accents ignorés en plus, pour la saisie au clavier.
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function clientMatchesQuery(c: Pick<ClientRow, "name" | "email" | "number" | "phone" | "whatsapp">, query: string) {
  const q = fold(query.trim());
  if (!q) return true;
  if (fold(c.name).includes(q)) return true;
  if (c.email && fold(c.email).includes(q)) return true;
  const asNumber = q.match(/^(?:n°|no|#)?\s*(\d+)$/);
  if (asNumber && Number(asNumber[1]) === c.number) return true;
  const qDigits = q.replace(/\D/g, "");
  if (qDigits.length >= 2 && /^[\d\s+().-]+$/.test(q)) {
    return [c.phone, c.whatsapp].some((n) => n?.replace(/\D/g, "").includes(qDigits));
  }
  return false;
}
