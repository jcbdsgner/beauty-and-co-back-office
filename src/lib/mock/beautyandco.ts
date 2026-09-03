// Données fictives BeautyAndCo — front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du reste de la couche mock : importer directement ce fichier
// (`@/lib/mock/beautyandco`) et non le barrel `@/lib/mock`.

import type { Kpi } from "./types";

export const fcfa = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)} FCFA`;

// Version compacte pour les cartes : « 2,45 M » plutôt que « 2 450 000 FCFA ».
export const fcfaCompact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M FCFA`
    : n >= 1_000
      ? `${Math.round(n / 1_000)} k FCFA`
      : `${n} FCFA`;

// Repère temporel figé pour la démo (sert à distinguer RDV passés / à venir).
export const today = {
  label: "mardi 3 septembre",
  currentTime: "13:20",
};

/* ------------------------------------------------------------------ */
/* RDV du jour par salon                                               */
/* ------------------------------------------------------------------ */

export type AppointmentStatus = "confirmé" | "en attente" | "annulé";

export type SalonAppointment = {
  time: string;
  client: string;
  service: string;
  staff: string;
  status: AppointmentStatus;
};

export type SalonToday = {
  id: string;
  name: string;
  subtitle: string;
  count: number;
  appointments: SalonAppointment[];
};

export const salonsToday: SalonToday[] = [
  {
    id: "sln_almadies",
    name: "Almadies",
    subtitle: "Route de Ngor",
    count: 6,
    appointments: [
      { time: "09:00", client: "Awa Diop", service: "Coupe & Brushing", staff: "Sophie", status: "confirmé" },
      { time: "10:30", client: "Fatou Ndiaye", service: "Coloration", staff: "Mariama", status: "confirmé" },
      { time: "12:00", client: "Marième Sow", service: "Manucure", staff: "Aïda", status: "confirmé" },
      { time: "14:00", client: "Aïcha Ba", service: "Soin visage", staff: "Sophie", status: "confirmé" },
      { time: "15:30", client: "Ndèye Fall", service: "Balayage", staff: "Mariama", status: "en attente" },
      { time: "17:00", client: "Khady Guèye", service: "Coupe", staff: "Aïda", status: "confirmé" },
    ],
  },
  {
    id: "sln_seaplaza",
    name: "Sea Plaza",
    subtitle: "Corniche Ouest",
    count: 3,
    appointments: [
      { time: "10:00", client: "Sokhna Mbaye", service: "Manucure", staff: "Bineta", status: "confirmé" },
      { time: "13:00", client: "Rama Diallo", service: "Soin visage", staff: "Coumba", status: "confirmé" },
      { time: "16:00", client: "Bineta Cissé", service: "Coupe & Brushing", staff: "Bineta", status: "en attente" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Alerte stock                                                        */
/* ------------------------------------------------------------------ */

export type LowStockItem = { name: string; onHand: number; min: number };

export const lowStockItems: LowStockItem[] = [
  { name: "Teinture Majirel 6.0", onHand: 4, min: 10 },
  { name: "Huile d'argan 100 ml", onHand: 2, min: 8 },
  { name: "Shampoing pro 1 L", onHand: 6, min: 15 },
];

export const stockAlert = {
  count: lowStockItems.length,
  title: `${lowStockItems.length} produits sous le seuil de réappro`,
  message: `Le plus critique : ${lowStockItems[0].name}, ${lowStockItems[0].onHand} en stock pour un minimum de ${lowStockItems[0].min}.`,
  href: "/inventaire/recettes",
};

/* ------------------------------------------------------------------ */
/* Bloc « Aujourd'hui » — coup d'œil argent + activité du jour         */
/* ------------------------------------------------------------------ */

// Encaissé aujourd'hui, par salon (FCFA).
export const todayCashBySalon = [
  { salon: "Almadies", amount: 268_000 },
  { salon: "Sea Plaza", amount: 154_000 },
];

const todayCashTotal = todayCashBySalon.reduce((s, r) => s + r.amount, 0);

export const todayKpis: Kpi[] = [
  {
    key: "ca-jour",
    label: "Chiffre d'affaires du jour",
    value: fcfa(todayCashTotal),
    delta: 8,
    direction: "up",
    hint: todayCashBySalon.map((r) => `${r.salon} ${fcfaCompact(r.amount)}`).join(" · "),
  },
  {
    key: "encaisse-jour",
    label: "Encaissé",
    value: fcfa(377_000),
    direction: "flat",
    hint: `${fcfa(45_000)} encore à encaisser sur les RDV du jour`,
  },
  {
    key: "rdv-jour",
    label: "Rendez-vous aujourd'hui",
    value: "9",
    direction: "flat",
    hint: "4 à venir · 1 en attente de confirmation",
  },
  {
    key: "panier-jour",
    label: "Panier moyen du jour",
    value: fcfa(47_000),
    delta: 5,
    direction: "up",
    hint: "sur 8 RDV encaissés",
  },
];

/* ------------------------------------------------------------------ */
/* Cartes KPI — « Ce mois-ci » (pilotées par le sélecteur de période)  */
/* ------------------------------------------------------------------ */

export const periodOptions = [
  { value: "month", label: "Ce mois" },
  { value: "last-month", label: "Mois dernier" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

export const dashboardKpisByPeriod: Record<string, Kpi[]> = {
  month: [
    { key: "revenue", label: "Chiffre d'affaires", value: fcfa(2_450_000), delta: 12, direction: "up", hint: "vs mois dernier" },
    { key: "appointments", label: "Rendez-vous", value: "184", delta: 14, direction: "up", hint: "23 de plus que le mois dernier" },
    { key: "new-clients", label: "Nouveaux clients", value: "40", delta: 60, direction: "down", hint: "mois dernier exceptionnel (promo ouverture)" },
    { key: "satisfaction", label: "Satisfaction", value: "4,6/5", direction: "flat", hint: "sur 128 avis ce mois-ci" },
  ],
  "last-month": [
    { key: "revenue", label: "Chiffre d'affaires", value: fcfa(2_190_000), delta: 3, direction: "down", hint: "vs mois précédent" },
    { key: "appointments", label: "Rendez-vous", value: "161", delta: 5, direction: "up", hint: "8 de plus" },
    { key: "new-clients", label: "Nouveaux clients", value: "100", delta: 120, direction: "up", hint: "promo ouverture Sea Plaza" },
    { key: "satisfaction", label: "Satisfaction", value: "4,5/5", direction: "flat", hint: "sur 143 avis" },
  ],
  quarter: [
    { key: "revenue", label: "Chiffre d'affaires", value: fcfa(6_830_000), delta: 9, direction: "up", hint: "vs trimestre précédent" },
    { key: "appointments", label: "Rendez-vous", value: "506", delta: 7, direction: "up", hint: "33 de plus" },
    { key: "new-clients", label: "Nouveaux clients", value: "168", delta: 4, direction: "up", hint: "56 par mois en moyenne" },
    { key: "satisfaction", label: "Satisfaction", value: "4,6/5", direction: "flat", hint: "sur 402 avis" },
  ],
  year: [
    { key: "revenue", label: "Chiffre d'affaires", value: fcfa(24_960_000), delta: 22, direction: "up", hint: "vs année précédente" },
    { key: "appointments", label: "Rendez-vous", value: "1 940", delta: 18, direction: "up", hint: "sur 12 mois" },
    { key: "new-clients", label: "Nouveaux clients", value: "612", delta: 15, direction: "up", hint: "51 par mois en moyenne" },
    { key: "satisfaction", label: "Satisfaction", value: "4,5/5", direction: "flat", hint: "sur 1 630 avis" },
  ],
};

// Valeur par défaut (mois en cours) — conservée pour la vitrine design-system.
export const dashboardKpis = dashboardKpisByPeriod.month;

/* ------------------------------------------------------------------ */
/* Graphiques                                                          */
/* ------------------------------------------------------------------ */

export const revenueMonths = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

// Revenu mensuel en FCFA, par salon (12 derniers mois).
export const revenueBySalon = [
  {
    name: "Almadies",
    data: [
      1_150_000, 1_060_000, 1_240_000, 1_330_000, 1_190_000, 1_390_000,
      1_480_000, 1_140_000, 1_470_000, 1_360_000, 1_560_000, 1_250_000,
    ],
  },
  {
    name: "Sea Plaza",
    data: [
      700_000, 660_000, 800_000, 880_000, 790_000, 930_000,
      1_000_000, 760_000, 980_000, 900_000, 1_050_000, 840_000,
    ],
  },
];

// Total tous salons confondus (dérivé).
export const revenueByMonth = revenueMonths.map((_, i) =>
  revenueBySalon.reduce((sum, s) => sum + s.data[i], 0),
);

export type PopularService = { name: string; count: number };

export const popularServices: PopularService[] = [
  { name: "Coupe & Brushing", count: 320 },
  { name: "Coloration", count: 210 },
  { name: "Soin visage", count: 165 },
  { name: "Manucure", count: 140 },
  { name: "Balayage", count: 95 },
];
