// Données fictives BeautyAndCo — front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du reste de la couche mock : importer directement ce fichier
// (`@/lib/mock/beautyandco`) et non le barrel `@/lib/mock`.

export const fcfa = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)} FCFA`;

/* ------------------------------------------------------------------ */
/* RDV du jour par salon                                               */
/* ------------------------------------------------------------------ */

export type SalonAppointment = { time: string; client: string; service: string };

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
    name: "ALMADIES",
    subtitle: "aujourd'hui",
    count: 6,
    appointments: [
      { time: "09:00", client: "Awa Diop", service: "Coupe & Brushing" },
      { time: "10:30", client: "Fatou Ndiaye", service: "Coloration" },
      { time: "12:00", client: "Marième Sow", service: "Manucure" },
      { time: "14:00", client: "Aïcha Ba", service: "Soin visage" },
      { time: "15:30", client: "Ndèye Fall", service: "Balayage" },
      { time: "17:00", client: "Khady Guèye", service: "Coupe" },
    ],
  },
  {
    id: "sln_seaplaza",
    name: "SEA PLAZA",
    subtitle: "aujourd'hui",
    count: 3,
    appointments: [
      { time: "10:00", client: "Sokhna Mbaye", service: "Manucure" },
      { time: "13:00", client: "Rama Diallo", service: "Soin visage" },
      { time: "16:00", client: "Bineta Cissé", service: "Coupe & Brushing" },
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
  title: "Stock bas",
  message: `${lowStockItems.length} produits sous le seuil : ${lowStockItems
    .map((i) => `${i.name} (${i.onHand}/${i.min} min)`)
    .join(", ")}.`,
};

/* ------------------------------------------------------------------ */
/* Cartes KPI — « Tableau de bord »                                    */
/* ------------------------------------------------------------------ */

export type DashKpi = {
  key: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
};

export const dashboardKpis: DashKpi[] = [
  {
    key: "revenue",
    label: "Chiffre d'affaires du mois",
    value: fcfa(2_450_000),
    change: "+12% par rapport au mois dernier",
    trend: "up",
  },
  {
    key: "appointments",
    label: "Rendez-vous ce mois",
    value: "184",
    change: "23 de plus que le mois dernier",
    trend: "up",
  },
  {
    key: "new-clients",
    label: "Nouveaux clients ce mois",
    value: "40",
    change: "-60% par rapport au mois dernier",
    trend: "down",
  },
  {
    key: "satisfaction",
    label: "Taux de satisfaction",
    value: "4,6/5",
    change: "Basé sur 128 avis ce mois-ci",
    trend: "flat",
  },
];

export const periodOptions = [
  { value: "month", label: "Ce mois" },
  { value: "last-month", label: "Mois dernier" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

/* ------------------------------------------------------------------ */
/* Graphiques                                                          */
/* ------------------------------------------------------------------ */

export const revenueMonths = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

// Revenu mensuel en FCFA.
export const revenueByMonth = [
  1_850_000, 1_720_000, 2_040_000, 2_210_000, 1_980_000, 2_320_000,
  2_480_000, 1_900_000, 2_450_000, 2_260_000, 2_610_000, 2_090_000,
];

export type PopularService = { name: string; count: number };

export const popularServices: PopularService[] = [
  { name: "Coupe & Brushing", count: 320 },
  { name: "Coloration", count: 210 },
  { name: "Soin visage", count: 165 },
  { name: "Manucure", count: 140 },
  { name: "Balayage", count: 95 },
];
