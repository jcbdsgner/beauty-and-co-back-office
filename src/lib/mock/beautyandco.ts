// Données fictives BeautyAndCo — front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du reste de la couche mock : importer directement ce fichier
// (`@/lib/mock/beautyandco`) et non le barrel `@/lib/mock`.

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
      { time: "09:00", client: "Awa Diop", service: "Coupe & Brushing", staff: "Sophie", status: "à venir" },
      { time: "10:30", client: "Fatou Ndiaye", service: "Coloration", staff: "Mariama", status: "à venir" },
      { time: "12:00", client: "Marième Sow", service: "Manucure", staff: "Aïda", status: "à venir" },
      { time: "14:00", client: "Aïcha Ba", service: "Soin visage", staff: "Sophie", status: "à venir" },
      { time: "15:30", client: "Ndèye Fall", service: "Balayage", staff: "Mariama", status: "à venir" },
      { time: "17:00", client: "Khady Guèye", service: "Coupe", staff: "Aïda", status: "à venir" },
    ],
  },
  {
    id: "seaplaza",
    name: "Sea Plaza",
    area: "Corniche Ouest",
    count: 3,
    appointments: [
      { time: "10:00", client: "Sokhna Mbaye", service: "Manucure", staff: "Bineta", status: "à venir" },
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
  { name: "Coupe & Brushing", count: 320 },
  { name: "Coloration", count: 210 },
  { name: "Soin visage", count: 165 },
  { name: "Manucure", count: 140 },
  { name: "Balayage", count: 95 },
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
  { id: "r01", date: "2026-06-08", rating: 5, client: "Awa Diop", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies", comment: "Toujours au top, merci Sophie." },
  { id: "r02", date: "2026-06-14", rating: 4, client: "Rama Diallo", service: "Manucure", staff: "Coumba", salon: "seaplaza" },
  { id: "r03", date: "2026-06-19", rating: 5, client: "Adama Sarr", service: "Coloration", staff: "Mariama", salon: "almadies", comment: "Couleur exactement comme je voulais." },
  { id: "r04", date: "2026-06-25", rating: 3, client: "Penda Ndoye", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Correct, mais j'ai attendu 20 minutes." },
  { id: "r05", date: "2026-07-02", rating: 5, client: "Astou Faye", service: "Balayage", staff: "Mariama", salon: "almadies" },
  { id: "r06", date: "2026-07-06", rating: 2, client: "Nafi Camara", service: "Coupe", staff: "Aïda", salon: "almadies", comment: "Coupe pas égale, j'ai dû la faire reprendre ailleurs." },
  { id: "r07", date: "2026-07-11", rating: 4, client: "Dieynaba Kane", service: "Manucure", staff: "Coumba", salon: "seaplaza", comment: "Très bien, ambiance agréable." },
  { id: "r08", date: "2026-07-15", rating: 5, client: "Rokhaya Seck", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies" },
  { id: "r09", date: "2026-07-19", rating: 5, client: "Yacine Thiam", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Peau nickel, je reviendrai." },
  { id: "r10", date: "2026-07-24", rating: 4, client: "Oumou Baldé", service: "Coloration", staff: "Mariama", salon: "almadies" },
  { id: "r11", date: "2026-07-28", rating: 3, client: "Fatoumata Barry", service: "Coupe", staff: "Aïda", salon: "almadies" },
  { id: "r12", date: "2026-08-01", rating: 5, client: "Seynabou Wade", service: "Manucure", staff: "Coumba", salon: "seaplaza", comment: "Rapide et soigné." },
  { id: "r13", date: "2026-08-05", rating: 5, client: "Maimouna Sy", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies", comment: "Sophie connaît mes cheveux par cœur." },
  { id: "r14", date: "2026-08-08", rating: 4, client: "Awa Diop", service: "Soin visage", staff: "Bineta", salon: "seaplaza" },
  { id: "r15", date: "2026-08-12", rating: 1, client: "Mame Diarra", service: "Coloration", staff: "Aïda", salon: "almadies", comment: "Résultat orange, très déçue. Personne ne m'a rappelée." },
  { id: "r16", date: "2026-08-15", rating: 5, client: "Khady Guèye", service: "Balayage", staff: "Mariama", salon: "almadies", comment: "Magnifique, bravo." },
  { id: "r17", date: "2026-08-18", rating: 4, client: "Sokhna Mbaye", service: "Manucure", staff: "Coumba", salon: "seaplaza" },
  { id: "r18", date: "2026-08-20", rating: 5, client: "Aïcha Ba", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies" },
  { id: "r19", date: "2026-08-22", rating: 2, client: "Ndèye Fall", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Le produit a piqué, pas assez à l'écoute." },
  { id: "r20", date: "2026-08-24", rating: 4, client: "Marième Sow", service: "Coupe", staff: "Aïda", salon: "almadies", comment: "Mieux que la dernière fois." },
  { id: "r21", date: "2026-08-26", rating: 5, client: "Fatou Ndiaye", service: "Coloration", staff: "Mariama", salon: "almadies", comment: "Toujours parfaite." },
  { id: "r22", date: "2026-08-27", rating: 5, client: "Adama Sarr", service: "Manucure", staff: "Coumba", salon: "seaplaza" },
  { id: "r23", date: "2026-08-29", rating: 3, client: "Astou Faye", service: "Coupe & Brushing", staff: "Sophie", salon: "almadies", comment: "Le brushing n'a pas tenu la journée." },
  { id: "r24", date: "2026-08-30", rating: 5, client: "Dieynaba Kane", service: "Soin visage", staff: "Bineta", salon: "seaplaza", comment: "Très professionnelle, je recommande." },
  { id: "r25", date: "2026-09-01", rating: 4, client: "Rokhaya Seck", service: "Balayage", staff: "Mariama", salon: "almadies" },
  { id: "r26", date: "2026-09-02", rating: 5, client: "Yacine Thiam", service: "Manucure", staff: "Coumba", salon: "seaplaza", comment: "Rien à redire." },
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
    { key: "c1", label: "Awa Diop", weight: 0.14, satisfaction: 5 },
    { key: "c2", label: "Fatou Ndiaye", weight: 0.12, satisfaction: 4 },
    { key: "c3", label: "Marième Sow", weight: 0.11, satisfaction: 5 },
    { key: "c4", label: "Aïcha Ba", weight: 0.1, satisfaction: 4 },
    { key: "c5", label: "Ndèye Fall", weight: 0.09, satisfaction: 5 },
    { key: "c6", label: "Khady Guèye", weight: 0.08, satisfaction: 4 },
    { key: "c7", label: "Sokhna Mbaye", weight: 0.07, satisfaction: 5 },
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
// Alimente l'écran « Clients » : un tableau triable (nom, email, téléphone,
// dernière visite, total dépensé, rendez-vous, points) + une fiche de détail
// par cliente. Tout est dérivé de la liste de visites de chaque cliente ;
// `lastVisit`, `totalSpent` et le nombre de rendez-vous ne comptent que les
// visites honorées. `segment` sert au filtre « Actives / À relancer ».

export type ClientVisitStatus = "honoré" | "à venir" | "annulé";

export type ClientVisit = {
  date: string; // ISO yyyy-mm-dd
  service: string;
  staff: string;
  amount: number; // FCFA facturés (0 si annulé ou à venir)
  status: ClientVisitStatus;
};

export type ClientGender = "femme" | "homme";

export const genderLabel = (g: ClientGender) => (g === "homme" ? "Homme" : "Femme");
// Nom commun accordé au genre — « la cliente » / « le client » dans les libellés.
export const clientNoun = (g: ClientGender) => (g === "homme" ? "client" : "cliente");

// Préférences de la cliente, rangées par thème pour l'accueil en salon.
export type ClientPreferences = {
  general: string[];
  onglerie: string[];
  coiffure: string[];
  boissons: string[];
};

export const PREFERENCE_GROUPS: { key: keyof ClientPreferences; label: string }[] = [
  { key: "general", label: "Général" },
  { key: "onglerie", label: "Onglerie" },
  { key: "coiffure", label: "Coiffure" },
  { key: "boissons", label: "Boissons" },
];

// Genre, adresse et préférences vivent dans une table à part : la saisie des
// visites reste lisible, et ces champs n'entrent pas dans les dérivés du tableau.
type ClientProfile = {
  gender: ClientGender;
  address: string;
  preferences: ClientPreferences;
};

const EMPTY_PREFERENCES: ClientPreferences = {
  general: [], onglerie: [], coiffure: [], boissons: [],
};

const CLIENT_PROFILES: Record<string, Partial<ClientProfile>> = {
  c01: {
    address: "Almadies",
    preferences: {
      general: ["Allergie au latex", "Préfère les rendez-vous en matinée"],
      onglerie: [],
      coiffure: ["Coloration sans ammoniaque", "Ne pas raccourcir la longueur"],
      boissons: ["Thé à la menthe"],
    },
  },
  c02: {
    address: "Ngor",
    preferences: {
      general: ["Vient toujours accompagnée de sa fille"],
      onglerie: [],
      coiffure: ["Sensible aux tiraillements — brushing tiède"],
      boissons: ["Café sans sucre"],
    },
  },
  c03: {
    address: "Ouakam",
    preferences: {
      general: [], onglerie: ["Ongles courts", "Base fortifiante"],
      coiffure: [], boissons: ["Eau plate"],
    },
  },
  c04: {
    address: "Point E",
    preferences: {
      general: ["N'aime pas attendre — prévenir en cas de retard"],
      onglerie: [], coiffure: [], boissons: ["Jus de bissap"],
    },
  },
  c05: {
    address: "Mermoz",
    preferences: {
      general: [], onglerie: ["Vernis semi-permanent", "Teintes nude"],
      coiffure: ["Balayage caramel"], boissons: ["Thé vert"],
    },
  },
  c07: {
    address: "Sacré-Cœur",
    preferences: {
      general: ["Cliente pressée — enchaîner les prestations"],
      onglerie: ["Pose gel", "Nail art discret"],
      coiffure: [], boissons: ["Café au lait"],
    },
  },
  c08: {
    address: "Fann Résidence",
    preferences: {
      general: ["À relancer après 6 mois d'absence"],
      onglerie: [], coiffure: ["Cheveux fragilisés — éviter la chaleur"],
      boissons: [],
    },
  },
  c11: {
    address: "Yoff",
    preferences: {
      general: ["Cliente fidèle — anniversaire le 14 février"],
      onglerie: ["Manucure russe", "Rouge profond"],
      coiffure: [], boissons: ["Thé à la menthe sans sucre"],
    },
  },
  c13: {
    address: "Plateau",
    preferences: {
      general: [], onglerie: [],
      coiffure: ["Coupe au carré", "Frange à garder longue"],
      boissons: ["Eau gazeuse"],
    },
  },
  c14: {
    address: "Les Almadies",
    preferences: {
      general: ["Peau réactive — patch test avant tout nouveau soin"],
      onglerie: [], coiffure: [], boissons: ["Café noir"],
    },
  },
};

const profileOf = (id: string): ClientProfile => {
  const p = CLIENT_PROFILES[id] ?? {};
  return {
    gender: p.gender ?? "femme",
    address: p.address ?? "Dakar",
    preferences: p.preferences ?? EMPTY_PREFERENCES,
  };
};

type ClientSeed = {
  id: string;
  name: string;
  email: string;
  phone: string;
  salon: SalonId;
  since: string; // ISO — cliente depuis
  points: number;
  visits: ClientVisit[];
};

// Raccourci de saisie — le statut par défaut est « honoré ».
const v = (
  date: string,
  service: string,
  staff: string,
  amount: number,
  status: ClientVisitStatus = "honoré",
): ClientVisit => ({ date, service, staff, amount, status });

const CLIENT_SEEDS: ClientSeed[] = [
  {
    id: "c01", name: "Awa Diop", email: "awa.diop@gmail.com", phone: "+221 77 512 46 08",
    salon: "almadies", since: "2023-02-11", points: 480,
    visits: [
      v("2026-09-12", "Coloration", "Mariama", 0, "à venir"),
      v("2026-08-30", "Coupe & Brushing", "Sophie", 15_000),
      v("2026-08-08", "Soin visage", "Sophie", 25_000),
      v("2026-07-15", "Coloration", "Mariama", 35_000),
      v("2026-06-20", "Balayage", "Mariama", 45_000),
      v("2026-06-01", "Coupe & Brushing", "Sophie", 15_000),
    ],
  },
  {
    id: "c02", name: "Fatou Ndiaye", email: "fatou.ndiaye@yahoo.fr", phone: "+221 78 204 11 39",
    salon: "almadies", since: "2024-01-20", points: 260,
    visits: [
      v("2026-09-09", "Coloration", "Mariama", 0, "à venir"),
      v("2026-08-26", "Coloration", "Mariama", 35_000),
      v("2026-07-24", "Coloration", "Mariama", 35_000),
      v("2026-06-15", "Coupe", "Aïda", 10_000),
    ],
  },
  {
    id: "c03", name: "Marième Sow", email: "marieme.sow@gmail.com", phone: "+221 76 640 27 15",
    salon: "almadies", since: "2024-06-05", points: 150,
    visits: [
      v("2026-08-20", "Coupe", "Aïda", 10_000),
      v("2026-07-05", "Manucure", "Aïda", 12_000),
      v("2026-05-30", "Coupe & Brushing", "Sophie", 15_000),
    ],
  },
  {
    id: "c04", name: "Aïcha Ba", email: "aicha.ba@orange.sn", phone: "+221 77 331 58 92",
    salon: "almadies", since: "2023-11-30", points: 90,
    visits: [
      v("2026-07-10", "Soin visage", "Sophie", 25_000),
      v("2026-04-18", "Manucure", "Aïda", 12_000),
    ],
  },
  {
    id: "c05", name: "Ndèye Fall", email: "ndeye.fall@gmail.com", phone: "+221 70 118 74 60",
    salon: "almadies", since: "2024-03-18", points: 175,
    visits: [
      v("2026-08-22", "Balayage", "Mariama", 45_000),
      v("2026-07-01", "Coupe & Brushing", "Sophie", 15_000),
      v("2026-05-12", "Coloration", "Mariama", 35_000),
    ],
  },
  {
    id: "c06", name: "Khady Guèye", email: "khady.gueye@yahoo.fr", phone: "+221 77 902 33 47",
    salon: "almadies", since: "2023-09-01", points: 60,
    visits: [
      v("2026-07-02", "Balayage", "Mariama", 45_000),
      v("2026-03-10", "Coupe", "Aïda", 10_000),
    ],
  },
  {
    id: "c07", name: "Adama Sarr", email: "adama.sarr@gmail.com", phone: "+221 78 655 20 84",
    salon: "almadies", since: "2022-10-14", points: 210,
    visits: [
      v("2026-09-06", "Manucure", "Aïda", 0, "à venir"),
      v("2026-08-27", "Manucure", "Aïda", 12_000),
      v("2026-08-01", "Coloration", "Mariama", 35_000),
      v("2026-06-19", "Coloration", "Mariama", 35_000),
    ],
  },
  {
    id: "c08", name: "Astou Faye", email: "astou.faye@gmail.com", phone: "+221 76 447 61 03",
    salon: "almadies", since: "2021-05-22", points: 120,
    visits: [
      v("2026-02-14", "Balayage", "Mariama", 45_000),
      v("2025-11-30", "Coloration", "Mariama", 35_000),
      v("2025-09-15", "Coupe & Brushing", "Sophie", 15_000),
    ],
  },
  {
    id: "c09", name: "Nafi Camara", email: "nafi.camara@orange.sn", phone: "+221 77 208 95 71",
    salon: "almadies", since: "2024-08-01", points: 30,
    visits: [
      v("2026-06-10", "Coloration", "Aïda", 0, "annulé"),
      v("2026-05-02", "Coloration", "Aïda", 35_000),
      v("2026-01-20", "Coupe", "Aïda", 10_000),
    ],
  },
  {
    id: "c10", name: "Maïmouna Sy", email: "maimouna.sy@gmail.com", phone: "+221 75 690 42 28",
    salon: "almadies", since: "2024-02-10", points: 140,
    visits: [
      v("2026-08-05", "Coupe & Brushing", "Sophie", 15_000),
      v("2026-06-28", "Coupe & Brushing", "Sophie", 15_000),
      v("2026-05-15", "Soin visage", "Sophie", 25_000),
    ],
  },
  {
    id: "c11", name: "Sokhna Mbaye", email: "sokhna.mbaye@gmail.com", phone: "+221 77 814 06 53",
    salon: "seaplaza", since: "2022-07-19", points: 300,
    visits: [
      v("2026-09-08", "Manucure", "Coumba", 0, "à venir"),
      v("2026-08-18", "Manucure", "Coumba", 12_000),
      v("2026-08-01", "Manucure", "Coumba", 12_000),
      v("2026-07-10", "Pédicure", "Coumba", 15_000),
      v("2026-06-15", "Soin visage", "Bineta", 25_000),
    ],
  },
  {
    id: "c12", name: "Rama Diallo", email: "rama.diallo@yahoo.fr", phone: "+221 78 233 79 10",
    salon: "seaplaza", since: "2023-04-02", points: 80,
    visits: [
      v("2026-07-06", "Manucure", "Coumba", 12_000),
      v("2026-06-14", "Manucure", "Coumba", 12_000),
      v("2026-04-02", "Soin visage", "Bineta", 25_000),
    ],
  },
  {
    id: "c13", name: "Bineta Cissé", email: "bineta.cisse@gmail.com", phone: "+221 76 501 88 24",
    salon: "seaplaza", since: "2023-01-15", points: 190,
    visits: [
      v("2026-08-24", "Coupe & Brushing", "Bineta", 15_000),
      v("2026-07-20", "Coloration", "Bineta", 35_000),
      v("2026-06-05", "Coupe & Brushing", "Bineta", 15_000),
    ],
  },
  {
    id: "c14", name: "Yacine Thiam", email: "yacine.thiam@orange.sn", phone: "+221 77 126 63 90",
    salon: "seaplaza", since: "2024-04-11", points: 160,
    visits: [
      v("2026-08-30", "Soin visage", "Bineta", 25_000),
      v("2026-07-19", "Soin visage", "Bineta", 25_000),
      v("2026-06-01", "Manucure", "Coumba", 12_000),
    ],
  },
  {
    id: "c15", name: "Dieynaba Kane", email: "dieynaba.kane@gmail.com", phone: "+221 70 744 51 17",
    salon: "seaplaza", since: "2024-05-30", points: 100,
    visits: [
      v("2026-07-11", "Manucure", "Coumba", 12_000),
      v("2026-05-30", "Soin visage", "Bineta", 25_000),
    ],
  },
  {
    id: "c16", name: "Penda Ndoye", email: "penda.ndoye@yahoo.fr", phone: "+221 77 380 09 66",
    salon: "seaplaza", since: "2023-10-15", points: 45,
    visits: [
      v("2025-12-20", "Soin visage", "Bineta", 25_000),
      v("2025-10-15", "Manucure", "Coumba", 12_000),
    ],
  },
  {
    id: "c17", name: "Oumou Baldé", email: "oumou.balde@gmail.com", phone: "+221 78 690 15 42",
    salon: "seaplaza", since: "2023-05-20", points: 130,
    visits: [
      v("2026-08-12", "Coloration", "Bineta", 35_000),
      v("2026-07-01", "Coupe", "Coumba", 10_000),
      v("2026-05-20", "Coloration", "Bineta", 35_000),
    ],
  },
  {
    id: "c18", name: "Rokhaya Seck", email: "rokhaya.seck@gmail.com", phone: "+221 76 255 47 81",
    salon: "seaplaza", since: "2024-06-01", points: 110,
    visits: [
      v("2026-07-15", "Coupe & Brushing", "Bineta", 15_000),
      v("2026-06-01", "Balayage", "Bineta", 45_000),
    ],
  },
];

const daysSinceIso = (iso: string) =>
  Math.round((new Date(TODAY_ISO).getTime() - new Date(iso).getTime()) / DAY_MS);

// Régulière (≤ 45 j) / occasionnelle / à relancer (> 100 j ou jamais venue).
export type ClientSegment = "active" | "occasionnelle" | "a-relancer";

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: ClientGender;
  address: string;
  salon: SalonId;
  salonLabel: string;
  since: string;
  lastVisit: string | null;
  daysSinceLastVisit: number | null;
  totalSpent: number;
  appointments: number; // rendez-vous honorés
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
  const segment: ClientSegment =
    days === null || days > 100 ? "a-relancer" : days <= 45 ? "active" : "occasionnelle";

  const profile = profileOf(c.id);

  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    gender: profile.gender,
    address: profile.address,
    salon: c.salon,
    salonLabel: salonName(c.salon),
    since: c.since,
    lastVisit,
    daysSinceLastVisit: days,
    totalSpent: honoured.reduce((s, x) => s + x.amount, 0),
    appointments: honoured.length,
    upcoming: upcoming.length,
    loyaltyPoints: c.points,
    segment,
  };
}

export function clients(scope: SalonScope): ClientRow[] {
  return CLIENT_SEEDS.filter((c) => scope === "all" || c.salon === scope).map(toClientRow);
}

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
    preferences: profileOf(id).preferences,
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
