// Données fictives « Rendez-vous » — front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du barrel `@/lib/mock` : importer directement ce fichier
// (`@/lib/mock/rendezvous`). Réutilise les helpers de format de `beautyandco`.

import {
  fcfa,
  groupThousands,
  salonName,
  type PosteType,
  type SalonId,
  type SalonScope,
} from "./beautyandco";
import { productPrice } from "./services";

export { fcfa, groupThousands };
export type { PosteType };

/* ------------------------------------------------------------------ */
/* Poste de travail mobilisé par une prestation (dérivé de sa catégorie) */
/* ------------------------------------------------------------------ */

const POSTE_BY_CATEGORY: Record<string, PosteType> = {
  Coiffure: "coiffure",
  "Manucure & pédicure": "onglerie",
  Onglerie: "onglerie",
  "Soin du visage": "esthetique",
  Spa: "esthetique",
  Épilation: "esthetique",
};

export const posteTypeForCategory = (category: string): PosteType =>
  POSTE_BY_CATEGORY[category] ?? "esthetique";

/* ------------------------------------------------------------------ */
/* Repère temporel figé (cohérent avec beautyandco : mardi 3 sept.)    */
/* ------------------------------------------------------------------ */

const NOW_ISO = "2026-09-03T13:20:00";

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const WEEKDAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// « 29 août 2026 »
export const frLongDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS_FR[m - 1]} ${y}`;
};

// « mardi 29 août 2026 »
export const frFullDate = (iso: string) => {
  const dt = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return `${WEEKDAYS_FR[dt.getDay()]} ${frLongDate(iso)}`;
};

// « 29 août 2026 à 15:00 »
export const frDateTime = (iso: string) => {
  const time = iso.slice(11, 16);
  return `${frLongDate(iso)}${time ? ` à ${time}` : ""}`;
};

/* ------------------------------------------------------------------ */
/* Statuts                                                             */
/* ------------------------------------------------------------------ */

// Un rendez-vous n'a pas d'étape de confirmation : dès qu'une cliente réserve,
// il est « à venir ». Ensuite il est honoré (« terminé »), la cliente ne s'est
// pas présentée (« absence »), ou il a été « annulé ».
export type RdvStatus = "à venir" | "terminé" | "annulé" | "absence";

type StatusMeta = {
  label: string;
  tone: "info" | "success" | "warning" | "error" | "light";
  // true = le rendez-vous appartient au passé / est clos (actions réduites).
  closed: boolean;
};

export const RDV_STATUS_META: Record<RdvStatus, StatusMeta> = {
  "à venir": { label: "À venir", tone: "info", closed: false },
  terminé: { label: "Terminé", tone: "light", closed: true },
  annulé: { label: "Annulé", tone: "error", closed: true },
  absence: { label: "Absence", tone: "warning", closed: true },
};

/* ------------------------------------------------------------------ */
/* Avantages mobilisables (abonnement / pack prépayé / carte cadeau)   */
/* ------------------------------------------------------------------ */
//
// On ne calcule rien contre le montant du rendez-vous : la fiche montre
// seulement ce dont dispose la cliente (services couverts, séances restantes,
// solde de la carte). L'encaissement réel se fait ailleurs.

// Abonnement / pack : simple référence vers l'instance (`@/lib/mock/abonnements`)
// — la fiche RDV résout le libellé, le statut et les prestations restantes à
// l'affichage, à partir du vrai modèle. Carte cadeau : hors spec, conservée telle
// quelle.
export type RdvAdvantage =
  | { kind: "abonnement"; abonnementId: string }
  | { kind: "pack"; packPurchaseId: string }
  | {
      kind: "carte-cadeau";
      code: string;
      balance: number; // FCFA disponibles sur la carte
    };

export const advantageLabel: Record<RdvAdvantage["kind"], string> = {
  abonnement: "Abonnement",
  pack: "Pack prépayé",
  "carte-cadeau": "Carte cadeau",
};

/* ------------------------------------------------------------------ */
/* Modèle de la fiche                                                  */
/* ------------------------------------------------------------------ */

export type RdvPrestation = {
  id: string;
  prestationId: string; // id du catalogue (`@/lib/mock/services`) — menus d'affectation
  category: string; // catégorie du catalogue (« Coiffure », « Soin du visage »…)
  name: string; // prestation facturable
  durationMin: number;
  price: number; // FCFA
  posteType: PosteType; // poste de travail mobilisé (dérivé de la catégorie)
  staff: string | null; // collaboratrice affectée à cette prestation (null = à affecter)
  requestedStaff?: string | null; // praticienne demandée par la cliente sur le site
  secondStaff?: string | null; // 2ᵉ praticienne — prestation « à deux » (temps de chaise divisé)
  start: string; // "HH:MM" — horaire propre à cette prestation (explicite, ne se déduit plus par chaînage)
  beneficiaryName: string; // qui reçoit la prestation — le payeur (`RdvDetail.client.name`) par défaut, ou une autre personne
  beneficiaryClientId?: string | null; // renseigné si le bénéficiaire est une autre cliente du fichier
};

// Boisson/produit pré-commandé pour la visite — jamais une prestation, jamais
// modifié après création (même principe que les extras de point-de-vente).
export type RdvExtra = {
  id: string;
  kind: "produit" | "boisson";
  productId: string; // réf. `@/lib/mock/services` `products`
  qty: number;
};

export type RdvQuestion = {
  id: string;
  question: string;
  answer: string | null; // null = sans réponse
};

export type RdvEvent = {
  at: string; // ISO datetime
  label: string;
  detail?: string;
};

export type RdvClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  loyaltyPoints: number;
};

export type RdvDetail = {
  id: string;
  ref: string; // référence courte affichée (« #7cc59015 »)
  status: RdvStatus;
  date: string; // ISO datetime du rendez-vous
  salon: SalonId;
  salonLabel: string;
  client: RdvClient;
  staffGlobal: string | null; // « Assigner tout le monde à » — null si mixte / non assigné
  prestations: RdvPrestation[];
  extras?: RdvExtra[]; // boissons/produits pré-commandés, saisis à la création
  questions: RdvQuestion[];
  advantages: RdvAdvantage[];
  events: RdvEvent[]; // du plus récent au plus ancien
  cancelReason?: string; // motif libre saisi à l'annulation
};

/* ------------------------------------------------------------------ */
/* Équipe par salon (pour les menus d'affectation)                     */
/* ------------------------------------------------------------------ */

export const staffBySalon: Record<SalonId, string[]> = {
  almadies: ["Sophie Ndione", "Mariama Bâ", "Aïda Sarr"],
  seaplaza: ["Bineta Cissé", "Coumba Faye"],
};

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

// Raccourci de saisie d'une prestation : le `posteType` est dérivé de la
// catégorie. `start`/`beneficiaryName` sont laissés vides ici et complétés par
// `normalize()` ci-dessous (chaînage séquentiel depuis `RdvDetail.date`, comme
// avant l'introduction d'un horaire explicite par prestation ; bénéficiaire =
// le client du rendez-vous) — seuls les nouveaux RDV de démo (bénéficiaires
// multiples, « à deux », extras) renseignent ces champs à la main via `extra`.
const pr = (
  id: string,
  prestationId: string,
  category: string,
  name: string,
  durationMin: number,
  price: number,
  staff: string | null,
  requestedStaff?: string | null,
  extra?: {
    secondStaff?: string | null;
    start?: string;
    beneficiaryName?: string;
    beneficiaryClientId?: string | null;
  },
): RdvPrestation => ({
  id,
  prestationId,
  category,
  name,
  durationMin,
  price,
  posteType: posteTypeForCategory(category),
  staff,
  requestedStaff,
  secondStaff: extra?.secondStaff,
  start: extra?.start ?? "",
  beneficiaryName: extra?.beneficiaryName ?? "",
  beneficiaryClientId: extra?.beneficiaryClientId,
});

const RAW_SEEDS: RdvDetail[] = [
  /* ---- Journée en cours : jeudi 3 septembre 2026 ---- */
  {
    id: "rdv-3001",
    ref: "#7c1a09f2",
    status: "à venir",
    date: "2026-09-03T09:30:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c01",
      name: "Awa Diop",
      email: "awa.diop@gmail.com",
      phone: "+221 77 512 46 08",
      whatsapp: null,
      loyaltyPoints: 480,
    },
    staffGlobal: "Sophie Ndione",
    prestations: [
      pr("p1", "coiffure-shampoing-sechage", "Coiffure", "Shampoing séchage", 60, 17_000, "Sophie Ndione"),
    ],
    questions: [{ id: "q1", question: "Êtes-vous voilée ?", answer: "Non" }],
    advantages: [],
    events: [
      { at: "2026-09-01T08:40:00", label: "Rappel J-2 envoyé", detail: "Par SMS" },
      { at: "2026-08-31T17:12:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },
  {
    id: "rdv-3002",
    ref: "#a4d7b6c1",
    status: "à venir",
    date: "2026-09-03T10:00:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c03",
      name: "Marième Sow",
      email: "marieme.sow@gmail.com",
      phone: "+221 76 640 27 15",
      whatsapp: "+221 76 640 27 15",
      loyaltyPoints: 150,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "coiffure-soin-complet", "Coiffure", "Soin complet", 130, 46_000, "Mariama Bâ"),
      pr("p2", "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire", "Coiffure", "Shampoing brushing", 60, 23_000, null),
    ],
    questions: [
      { id: "q1", question: "Une allergie connue à un soin capillaire ?", answer: "Non" },
      { id: "q2", question: "Dernier soin capillaire il y a combien de temps ?", answer: "Environ 2 mois" },
    ],
    advantages: [{ kind: "pack", packPurchaseId: "pp-c03-express" }],
    events: [
      { at: "2026-08-28T14:02:00", label: "Rendez-vous créé", detail: "Pris au comptoir" },
    ],
  },
  {
    id: "rdv-2409",
    ref: "#7cc59015",
    status: "à venir",
    date: "2026-09-03T15:00:00",
    salon: "seaplaza",
    salonLabel: salonName("seaplaza"),
    client: {
      id: "c11",
      name: "Sokhna Mbaye",
      email: "sokhna.mbaye@gmail.com",
      phone: "+221 77 814 06 53",
      whatsapp: "+221 77 814 06 53",
      loyaltyPoints: 300,
    },
    staffGlobal: null,
    prestations: [
      pr(
        "p1",
        "onglerie-vernis-permanent-mains",
        "Onglerie",
        "Vernis permanent mains",
        30,
        17_000,
        null,
        "Coumba Faye",
      ),
    ],
    questions: [
      { id: "q1", question: "Un vernis permanent ou un gel à retirer ?", answer: "Oui" },
    ],
    advantages: [{ kind: "abonnement", abonnementId: "ab-c11-mains" }],
    events: [
      { at: "2026-08-29T21:11:00", label: "Rappel J-2 envoyé", detail: "Par email" },
      { at: "2026-08-12T10:02:00", label: "Rendez-vous créé", detail: "Réservation en ligne · praticienne demandée : Coumba Faye" },
    ],
  },
  {
    id: "rdv-3003",
    ref: "#b9e2f3a7",
    status: "à venir",
    date: "2026-09-03T11:30:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c05",
      name: "Ndèye Fall",
      email: "ndeye.fall@gmail.com",
      phone: "+221 70 118 74 60",
      whatsapp: "+221 70 118 74 60",
      loyaltyPoints: 175,
    },
    staffGlobal: "Aïda Sarr",
    prestations: [
      pr("p1", "manucure-pedicure-manucure-russe-sans-vernis-sans-gel", "Manucure & pédicure", "Manucure russe", 30, 13_000, "Aïda Sarr"),
    ],
    questions: [{ id: "q1", question: "Êtes-vous diabétique ?", answer: "Non" }],
    advantages: [],
    events: [
      { at: "2026-09-02T12:30:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },
  {
    id: "rdv-3004",
    ref: "#c1f4a2b8",
    status: "à venir",
    date: "2026-09-03T14:30:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c06",
      name: "Khady Guèye",
      email: "khady.gueye@yahoo.fr",
      phone: "+221 77 902 33 47",
      whatsapp: null,
      loyaltyPoints: 60,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "coiffure-tresses-cheveux", "Coiffure", "Tresses cheveux", 60, 19_000, null),
    ],
    questions: [{ id: "q1", question: "Avez-vous des tresses à retirer ?", answer: "Oui" }],
    advantages: [],
    events: [
      { at: "2026-09-03T08:05:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },
  {
    id: "rdv-3005",
    ref: "#d7a0c9e3",
    status: "à venir",
    date: "2026-09-03T16:00:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c04",
      name: "Aïcha Ba",
      email: "aicha.ba@orange.sn",
      phone: "+221 77 331 58 92",
      whatsapp: "+221 77 331 58 92",
      loyaltyPoints: 90,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire", "Coiffure", "Shampoing brushing", 60, 23_000, null),
    ],
    questions: [],
    advantages: [{ kind: "carte-cadeau", code: "BC-2026-1180", balance: 15_000 }],
    events: [
      { at: "2026-09-02T19:40:00", label: "Rappel J-1 envoyé", detail: "Par email" },
      { at: "2026-08-30T11:15:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },

  /* ---- Jours suivants ---- */
  {
    id: "rdv-2410",
    ref: "#a1b2c3d4",
    status: "à venir",
    date: "2026-09-04T10:30:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c02",
      name: "Fatou Ndiaye",
      email: "fatou.ndiaye@yahoo.fr",
      phone: "+221 78 204 11 39",
      whatsapp: "+221 78 204 11 39",
      loyaltyPoints: 260,
    },
    staffGlobal: "Mariama Bâ",
    prestations: [
      pr("p1", "coiffure-soin-complet", "Coiffure", "Soin complet", 130, 46_000, "Mariama Bâ"),
      pr("p2", "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire", "Coiffure", "Shampoing brushing", 60, 23_000, "Mariama Bâ"),
    ],
    questions: [
      { id: "q1", question: "Une allergie connue à un soin capillaire ?", answer: "Non" },
      { id: "q2", question: "Dernier soin capillaire il y a combien de temps ?", answer: "Environ 6 semaines" },
    ],
    advantages: [{ kind: "pack", packPurchaseId: "pp-c02-express" }],
    events: [
      { at: "2026-09-01T09:15:00", label: "Rappel J-3 envoyé", detail: "Par SMS" },
      { at: "2026-08-28T16:38:00", label: "Rendez-vous créé", detail: "Pris au comptoir" },
    ],
  },
  {
    id: "rdv-2411",
    ref: "#e5f6a7b8",
    status: "à venir",
    date: "2026-09-05T14:00:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c01",
      name: "Awa Diop",
      email: "awa.diop@gmail.com",
      phone: "+221 77 512 46 08",
      whatsapp: null,
      loyaltyPoints: 480,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "coiffure-shampoing-sechage", "Coiffure", "Shampoing séchage", 60, 17_000, "Sophie Ndione"),
      pr("p2", "soin-du-visage-detox-me-facial", "Soin du visage", "Detox Me Facial", 60, 45_000, null),
    ],
    questions: [
      { id: "q1", question: "Peau sensible ou réactive ?", answer: null },
      { id: "q2", question: "Produits habituels à éviter ?", answer: null },
    ],
    advantages: [{ kind: "carte-cadeau", code: "BC-2026-4471", balance: 25_000 }],
    events: [
      { at: "2026-09-02T18:22:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },

  /* ---- Passé ---- */
  {
    id: "rdv-2380",
    ref: "#c9d0e1f2",
    status: "terminé",
    date: "2026-08-29T15:00:00",
    salon: "seaplaza",
    salonLabel: salonName("seaplaza"),
    client: {
      id: "c12",
      name: "Rama Diallo",
      email: "rama.diallo@yahoo.fr",
      phone: "+221 78 233 79 10",
      whatsapp: "+221 78 233 79 10",
      loyaltyPoints: 80,
    },
    staffGlobal: "Coumba Faye",
    prestations: [
      pr("p1", "onglerie-vernis-permanent-mains", "Onglerie", "Vernis permanent mains", 30, 17_000, "Coumba Faye"),
    ],
    questions: [{ id: "q1", question: "Ongles fragilisés ?", answer: "Un peu, base fortifiante appliquée" }],
    advantages: [],
    events: [
      { at: "2026-08-29T16:05:00", label: "Visite terminée", detail: "Encaissé · 17.000 FCFA" },
      { at: "2026-08-29T15:00:00", label: "Cliente arrivée" },
      { at: "2026-08-25T11:30:00", label: "Rendez-vous créé", detail: "Pris au comptoir" },
    ],
  },
  {
    id: "rdv-2375",
    ref: "#0a1b2c3d",
    status: "annulé",
    date: "2026-08-28T11:00:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c09",
      name: "Nafi Camara",
      email: "nafi.camara@orange.sn",
      phone: "+221 77 208 95 71",
      whatsapp: null,
      loyaltyPoints: 30,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "coiffure-soin-complet", "Coiffure", "Soin complet", 130, 46_000, null),
    ],
    questions: [{ id: "q1", question: "Une allergie connue à un soin capillaire ?", answer: "Non" }],
    advantages: [],
    events: [
      { at: "2026-08-27T19:48:00", label: "Rendez-vous annulé", detail: "Annulé par la cliente · moins de 24 h" },
      { at: "2026-08-24T14:12:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },
  {
    id: "rdv-3006",
    ref: "#e8b1d4c0",
    status: "annulé",
    date: "2026-09-04T15:30:00",
    salon: "seaplaza",
    salonLabel: salonName("seaplaza"),
    client: {
      id: "c14",
      name: "Yacine Thiam",
      email: "yacine.thiam@gmail.com",
      phone: "+221 77 640 18 22",
      whatsapp: "+221 77 640 18 22",
      loyaltyPoints: 45,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "soin-du-visage-detox-me-facial", "Soin du visage", "Detox Me Facial", 60, 45_000, null),
    ],
    questions: [{ id: "q1", question: "Peau sensible ou réactive ?", answer: "Non" }],
    advantages: [],
    events: [
      { at: "2026-09-03T10:20:00", label: "Rendez-vous annulé", detail: "Annulé au comptoir · la cliente a un empêchement" },
      { at: "2026-08-30T09:05:00", label: "Rendez-vous créé", detail: "Réservation en ligne" },
    ],
  },

  /* ---- Démo : bénéficiaires multiples + extras (2026-09-04) ---- */
  {
    id: "rdv-3007",
    ref: "#f4c8a913",
    status: "à venir",
    date: "2026-09-04T10:00:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c02",
      name: "Fatou Ndiaye",
      email: "fatou.ndiaye@yahoo.fr",
      phone: "+221 78 204 11 39",
      whatsapp: "+221 78 204 11 39",
      loyaltyPoints: 260,
    },
    staffGlobal: null,
    prestations: [
      pr("p1", "manucure-pedicure-manucure-russe-sans-vernis-sans-gel", "Manucure & pédicure", "Manucure russe", 30, 13_000, "Aïda Sarr", null, { start: "10:00", beneficiaryName: "Fatou Ndiaye" }),
      // Bénéficiaire distinct de la payeuse — sa fille, prestation en parallèle (pas de praticienne dédiée « Mini & Co » compétente présente ce jour-là).
      pr("p2", "mini-co-mini-hair-treat-mini-co", "Mini & Co", "Mini Hair Treat (Mini&Co)", 90, 28_000, null, null, { start: "10:00", beneficiaryName: "Aïssa Ndiaye (fille)" }),
    ],
    extras: [
      { id: "ex1", kind: "boisson", productId: "boisson-pure-glow", qty: 2 },
      { id: "ex2", kind: "boisson", productId: "boisson-eclat-matcha", qty: 1 },
    ],
    questions: [],
    advantages: [],
    events: [
      { at: "2026-09-01T11:00:00", label: "Rendez-vous créé", detail: "Réservation en ligne · pour elle et sa fille" },
    ],
  },
  {
    id: "rdv-3008",
    ref: "#3b7e2d01",
    status: "à venir",
    date: "2026-09-04T13:00:00",
    salon: "almadies",
    salonLabel: salonName("almadies"),
    client: {
      id: "c06",
      name: "Khady Guèye",
      email: "khady.gueye@yahoo.fr",
      phone: "+221 77 902 33 47",
      whatsapp: null,
      loyaltyPoints: 60,
    },
    staffGlobal: "Mariama Bâ",
    prestations: [
      // Prestation « à deux praticiennes » — temps de chaise divisé. Vendredi
      // 4/09 : Mariama en renfort d'après-midi (12h-19h) et Sophie en journée
      // complète, toutes deux présentes et compétentes à Almadies ce jour-là.
      pr("p1", "coiffure-tissage-versatile", "Coiffure", "Tissage Versatile", 120, 56_000, "Mariama Bâ", null, {
        secondStaff: "Sophie Ndione",
        start: "13:00",
        beneficiaryName: "Khady Guèye",
      }),
    ],
    questions: [],
    advantages: [],
    events: [
      { at: "2026-08-30T15:40:00", label: "Rendez-vous créé", detail: "Pris au comptoir · à deux praticiennes" },
    ],
  },
];

export const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (min: number): string => {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Chaînage séquentiel historique (avant l'introduction d'un `start` explicite
// par prestation) : la 1ʳᵉ prestation démarre à `RdvDetail.date`, chaque
// suivante enchaîne quand la précédente finit. Sert uniquement à compléter les
// seeds qui ne renseignent pas `start`/`beneficiaryName` à la main.
function normalize(r: RdvDetail): RdvDetail {
  let cursor = r.date.slice(11, 16);
  const prestations = r.prestations.map((p) => {
    const start = p.start || cursor;
    if (!p.start) cursor = minutesToTime(timeToMinutes(cursor) + p.durationMin);
    return {
      ...p,
      start,
      beneficiaryName: p.beneficiaryName || r.client.name,
    };
  });
  return { ...r, prestations, extras: r.extras ?? [] };
}

const SEEDS: RdvDetail[] = RAW_SEEDS.map(normalize);

/* ------------------------------------------------------------------ */
/* Dérivés                                                             */
/* ------------------------------------------------------------------ */

export const extraPrice = (e: RdvExtra) => productPrice(e.productId) * e.qty;

export const rdvTotal = (r: Pick<RdvDetail, "prestations" | "extras">) =>
  r.prestations.reduce((sum, p) => sum + p.price, 0) +
  (r.extras ?? []).reduce((sum, e) => sum + extraPrice(e), 0);

// Durée = amplitude de la visite (de la 1ʳᵉ prestation qui démarre à la
// dernière qui finit) — les prestations de bénéficiaires différents peuvent
// désormais se dérouler en parallèle, ce n'est plus une simple somme.
export const rdvDuration = (r: Pick<RdvDetail, "prestations">) => {
  if (r.prestations.length === 0) return 0;
  const starts = r.prestations.map((p) => timeToMinutes(p.start));
  const ends = r.prestations.map((p) => timeToMinutes(p.start) + p.durationMin);
  return Math.max(...ends) - Math.min(...starts);
};

// Fin du rendez-vous = la dernière prestation à finir (ISO datetime).
export const rdvEnd = (r: Pick<RdvDetail, "date" | "prestations">): string => {
  const day = r.date.slice(0, 10);
  if (r.prestations.length === 0) return r.date;
  const endMin = Math.max(...r.prestations.map((p) => timeToMinutes(p.start) + p.durationMin));
  return `${day}T${minutesToTime(endMin)}:00`;
};

// Au moins une prestation sans praticienne, sur un rendez-vous non clos.
export const needsAssign = (r: Pick<RdvDetail, "status" | "prestations">) =>
  !RDV_STATUS_META[r.status].closed && r.prestations.some((p) => p.staff === null);

// Créneau propre à chaque prestation — lu directement sur `RdvPrestation.start`
// (explicite depuis chaque prestation, plus de chaînage implicite à
// l'affichage). Permet nativement des bénéficiaires en parallèle sur des
// lignes de praticiennes différentes. Sert à positionner chaque prestation sur
// la ligne de SA praticienne dans l'agenda horaire.
export type PrestationSlot = { prestation: RdvPrestation; start: string; end: string };

export const prestationSlots = (r: Pick<RdvDetail, "date" | "prestations">): PrestationSlot[] => {
  const day = r.date.slice(0, 10);
  return r.prestations.map((prestation) => {
    const startMin = timeToMinutes(prestation.start);
    return {
      prestation,
      start: `${day}T${minutesToTime(startMin)}:00`,
      end: `${day}T${minutesToTime(startMin + prestation.durationMin)}:00`,
    };
  });
};

// Fenêtres occupées d'une praticienne (comme principale OU 2ᵉ praticienne) sur
// un jour donné, tous rendez-vous non annulés confondus — sert à valider un
// créneau à la création (`BookingDialog`) ou à l'édition (`EditRdvDialog`).
// `excludeRdvId` exclut le rendez-vous en cours d'édition de son propre calcul.
export function staffBusyWindows(
  list: RdvDetail[],
  staffName: string,
  iso: string,
  excludeRdvId?: string,
): { start: number; end: number }[] {
  const windows: { start: number; end: number }[] = [];
  for (const r of list) {
    if (r.id === excludeRdvId) continue;
    if (r.status === "annulé") continue;
    if (r.date.slice(0, 10) !== iso) continue;
    for (const p of r.prestations) {
      if (p.staff !== staffName && p.secondStaff !== staffName) continue;
      const start = timeToMinutes(p.start);
      windows.push({ start, end: start + p.durationMin });
    }
  }
  return windows;
}

export function isStaffFreeForWindow(
  list: RdvDetail[],
  staffName: string,
  iso: string,
  startMin: number,
  durationMin: number,
  excludeRdvId?: string,
): boolean {
  const end = startMin + durationMin;
  return !staffBusyWindows(list, staffName, iso, excludeRdvId).some(
    (w) => startMin < w.end && w.start < end,
  );
}

// « 3 h 10 » / « 45 min »
export const durationLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};

export type RdvRow = {
  id: string;
  ref: string;
  date: string;
  time: string; // "HH:MM"
  clientName: string;
  clientPhone: string;
  salon: SalonId;
  salonLabel: string;
  status: RdvStatus;
  total: number;
  prestationCount: number;
  prestationNames: string;
  prestationList: string[];
  durationMin: number;
  staffNames: string[]; // praticiennes distinctes affectées (principale + 2ᵉ praticienne)
  staffLabel: string;
  pendingAssign: number; // prestations sans praticienne
  posteTypes: PosteType[];
  beneficiaryCount: number; // personnes distinctes visées par ce rendez-vous
  composition: string; // "" si une seule personne, sinon « 3 personnes »
  upcoming: boolean;
  cancelled: boolean;
  needsAssign: boolean;
};

const toRow = (r: RdvDetail): RdvRow => {
  const staffNames = [
    ...new Set(r.prestations.flatMap((p) => [p.staff, p.secondStaff]).filter(Boolean)),
  ] as string[];
  const pendingAssign = r.prestations.filter((p) => p.staff === null).length;
  const beneficiaryCount = new Set(r.prestations.map((p) => p.beneficiaryName)).size;
  return {
    id: r.id,
    ref: r.ref,
    date: r.date,
    time: r.date.slice(11, 16),
    clientName: r.client.name,
    clientPhone: r.client.phone,
    salon: r.salon,
    salonLabel: r.salonLabel,
    status: r.status,
    total: rdvTotal(r),
    prestationCount: r.prestations.length,
    prestationNames: r.prestations.map((p) => p.name).join(", "),
    prestationList: r.prestations.map((p) => p.name),
    durationMin: rdvDuration(r),
    staffNames,
    staffLabel:
      staffNames.length === 0
        ? "À affecter"
        : staffNames.length === 1
          ? staffNames[0]
          : `${staffNames.length} praticiennes`,
    pendingAssign,
    posteTypes: [...new Set(r.prestations.map((p) => p.posteType))],
    beneficiaryCount,
    composition: beneficiaryCount > 1 ? `${beneficiaryCount} personnes` : "",
    upcoming: !RDV_STATUS_META[r.status].closed,
    cancelled: r.status === "annulé",
    needsAssign: needsAssign(r),
  };
};

export const rdvToRow = toRow;

const nowMs = new Date(NOW_ISO).getTime();

const sortRows = (rows: RdvRow[]): RdvRow[] =>
  [...rows].sort((a, b) => {
    // À venir d'abord (du plus proche au plus lointain), puis le passé (récent → ancien).
    if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return a.upcoming ? da - db : db - da;
  });

// Copie modifiable de tous les rendez-vous — l'écran garde ça en état de session.
export const allRendezvous = (): RdvDetail[] => SEEDS.map((r) => ({ ...r }));

export function rendezvousList(scope: SalonScope): RdvRow[] {
  return sortRows(SEEDS.filter((r) => scope === "all" || r.salon === scope).map(toRow));
}

// Variante pilotée par un état externe (liste tenue par l'écran Rendez-vous).
export function rendezvousRows(list: RdvDetail[], scope: SalonScope): RdvRow[] {
  return sortRows(list.filter((r) => scope === "all" || r.salon === scope).map(toRow));
}

export function rendezvousDetail(id: string): RdvDetail | null {
  return SEEDS.find((r) => r.id === id) ?? null;
}

// Prochain rendez-vous à venir — sert de cible par défaut à l'entrée /rendez-vous.
export function nextRendezvousId(scope: SalonScope): string {
  const rows = rendezvousList(scope);
  const next = rows.find((r) => r.upcoming && new Date(r.date).getTime() >= nowMs);
  return (next ?? rows[0])?.id ?? SEEDS[0].id;
}

export const newRdvId = () => `rdv-${Date.now().toString(36)}`;

/* ------------------------------------------------------------------ */
/* Comptage des rendez-vous par praticienne et par jour (lu par Planning) */
/* ------------------------------------------------------------------ */

export function rdvCountByStaffDay(
  scope: SalonScope,
): { date: string; staffFirstName: string; count: number }[] {
  const acc = new Map<string, { date: string; staffFirstName: string; count: number }>();
  for (const r of SEEDS) {
    if (scope !== "all" && r.salon !== scope) continue;
    if (r.status === "annulé") continue;
    const date = r.date.slice(0, 10);
    const firsts = new Set(
      r.prestations
        .flatMap((p) => [p.staff, p.secondStaff])
        .filter((s): s is string => Boolean(s))
        .map((s) => s.split(" ")[0]),
    );
    for (const first of firsts) {
      const key = `${date}__${first}`;
      const cur = acc.get(key) ?? { date, staffFirstName: first, count: 0 };
      cur.count += 1;
      acc.set(key, cur);
    }
  }
  return [...acc.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.staffFirstName.localeCompare(b.staffFirstName, "fr"),
  );
}
