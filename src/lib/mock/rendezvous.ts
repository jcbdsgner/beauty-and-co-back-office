// Données fictives « Rendez-vous » — front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du barrel `@/lib/mock` : importer directement ce fichier
// (`@/lib/mock/rendezvous`). Réutilise les helpers de format de `beautyandco`.

import {
  clients,
  fcfa,
  groupThousands,
  isClosed,
  salonConfig,
  salonName,
  type PosteType,
  type SalonId,
  type SalonScope,
} from "./beautyandco";
import { presenceFor, TODAY_ISO, type PlanningData } from "./planning";
import { prestationSeeds, productPrice, serviceSeeds } from "./services";
import { canPerform, fullName, members } from "./staff";

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
  staff: string | null; // affectée automatiquement (null = aucune praticienne disponible, conflit)
  requestedStaff?: string | null; // praticienne demandée par la cliente sur le site
  secondStaff?: string | null; // 2ᵉ praticienne — prestation « à deux » (temps de chaise divisé)
  start: string; // "HH:MM" — horaire propre à cette prestation (explicite, ne se déduit plus par chaînage)
  beneficiaryName: string; // qui reçoit la prestation — le payeur (`RdvDetail.client.name`) par défaut, ou une autre personne
  beneficiaryClientId?: string | null; // renseigné si le bénéficiaire est une autre cliente du fichier
  beneficiaryKind?: BeneficiaryKind; // « homme » pour un bénéficiaire homme ; Mini & Co vaut toujours « enfant » (cf. `reservationComposition`)
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
  /* ---- Annulations conservées (point-de-vente n'a aucune réservation annulée entière) ---- */
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
      name: "Yacine Wade",
      email: "yacine.wade@example.com",
      phone: "+221 77 555 12 34",
      whatsapp: "+221 77 555 12 34",
      loyaltyPoints: 950,
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

/* ------------------------------------------------------------------ */
/* Réservations reprises de point-de-vente (`lib/data/planning.ts`)    */
/* ------------------------------------------------------------------ */
//
// Mêmes réservations, mêmes prestations, mêmes heures demandées, mêmes
// bénéficiaires et extras que la caisse. Ce qui change à la traduction :
// - jours relatifs ancrés sur `TODAY_ISO` (et non sur la vraie date) ; les
//   salons du back-office étant fermés le dimanche, le « dimanche chargé » de
//   point-de-vente et tout ce qui tombait un dimanche passent au samedi ;
// - clientes : `cl-N` de point-de-vente → fiches du back-office (`PDV_CLIENT`) ;
// - praticiennes : l'équipe de point-de-vente n'existe pas ici. Chaque
//   prestation est recalée (`fitPdvSeeds`) sur l'équipe du back-office, comme
//   le fait `fitSeedToSchedules` côté caisse : compétente, présente ce jour-là
//   dans ce salon (planning + absences), jamais deux rendez-vous à la fois ;
//   l'heure demandée d'abord, sinon le premier créneau libre de la journée.
//   L'équipe et le planning de démo sont calés pour que toutes les
//   réservations trouvent preneuse (cf. « Affectation automatique » plus bas).

type PdvLine = {
  id: string;
  prestationId: string;
  start: string;
  durationMin: number; // déjà divisé par deux pour une prestation « à deux »
  pair?: boolean; // réalisée à deux praticiennes côté point-de-vente
  beneficiaryName?: string;
  beneficiaryKind?: BeneficiaryKind;
};

type PdvReservation = {
  id: string;
  payer: string; // `cl-N` de point-de-vente
  day: number; // décalage en jours par rapport à `TODAY_ISO`
  salon: SalonId; // salon de la praticienne d'origine
  deposit?: number; // acompte réglé en ligne, FCFA
  createdMinutesAgo?: number; // réservation toute fraîche (« non vue » côté caisse)
  extras?: Omit<RdvExtra, "id">[];
  advantages?: RdvAdvantage[];
  lines: PdvLine[];
};

// cl-7 (Sokhna) et cl-9 (Yacine) retombent sur les homonymes du fichier, qui
// portent un abonnement / un historique.
const PDV_CLIENT: Record<string, string> = {
  "cl-1": "c01", "cl-2": "c02", "cl-3": "c03", "cl-4": "c04", "cl-5": "c05",
  "cl-6": "c06", "cl-7": "c11", "cl-8": "c08", "cl-9": "c14", "cl-10": "c10",
};

const SP: SalonId = "seaplaza";
const AL: SalonId = "almadies";

const line = (
  id: string,
  prestationId: string,
  start: string,
  durationMin: number,
  opts: Pick<PdvLine, "pair" | "beneficiaryName" | "beneficiaryKind"> = {},
): PdvLine => ({ id, prestationId, start, durationMin, ...opts });

const PDV_RESERVATIONS: PdvReservation[] = [
  /* ── Aujourd'hui ── */
  {
    id: "RV-1787667600000-0qtafz9td", payer: "cl-7", day: 0, salon: SP, deposit: 5000,
    advantages: [{ kind: "abonnement", abonnementId: "ab-c11-mains" }],
    lines: [
      line("rdv-1a", "coiffure-tissage-versatile", "10:00", 60, { pair: true }),
      line("rdv-1b", "manucure-pedicure-manucure-spa-express", "10:00", 45, { beneficiaryName: "Awa" }),
    ],
  },
  {
    // La 2ᵉ prestation (épilation des sourcils) a été annulée côté caisse.
    id: "RV-1787671200000-1hmkvyjmq", payer: "cl-6", day: 0, salon: SP,
    lines: [line("rdv-2a", "soin-du-visage-glow-me-facial", "11:30", 60)],
  },
  {
    id: "RV-1787674800000-28fvbxtg3", payer: "cl-8", day: 0, salon: AL, deposit: 8000,
    extras: [
      { kind: "boisson", productId: "boisson-pure-glow", qty: 1 },
      { kind: "boisson", productId: "boisson-eclat-matcha", qty: 1 },
    ],
    lines: [line("rdv-3a", "spa-relax-me-time", "13:40", 80)],
  },
  {
    id: "RV-1787678400000-2z95rx39g", payer: "cl-2", day: 0, salon: AL,
    extras: [{ kind: "produit", productId: "nutritive-bain-riche-250ml", qty: 1 }],
    advantages: [{ kind: "pack", packPurchaseId: "pp-c02-express" }],
    lines: [line("rdv-4a", "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire", "10:00", 60)],
  },
  {
    id: "RV-1787682000000-3q2g7wd2t", payer: "cl-1", day: 0, salon: AL, createdMinutesAgo: 4,
    advantages: [{ kind: "carte-cadeau", code: "BC-2026-4471", balance: 25_000 }],
    lines: [line("rdv-5a", "spa-soin-du-dos", "16:00", 90)],
  },
  {
    id: "RV-1787685600000-4gvqnvmw6", payer: "cl-3", day: 0, salon: SP, createdMinutesAgo: 26,
    advantages: [{ kind: "pack", packPurchaseId: "pp-c03-express" }],
    lines: [
      line("rdv-6a", "coiffure-silk-press", "13:00", 180),
      line("rdv-6b", "mini-co-mini-jely-manucure", "13:00", 30, { beneficiaryName: "Salématou (7 ans)" }),
    ],
  },
  {
    id: "RV-1787743200000-gdwdrjzxy", payer: "cl-5", day: 0, salon: SP,
    extras: [
      { kind: "boisson", productId: "boisson-dragon-mystic", qty: 1 },
      { kind: "boisson", productId: "boisson-ice-coffee-caramel", qty: 1 },
    ],
    lines: [
      line("rdv-22a", "coiffure-tissage-versatile", "11:00", 60, { pair: true }),
      line("rdv-22b", "coiffure-tissage-versatile", "11:00", 60, { pair: true, beneficiaryName: "Aïda" }),
    ],
  },
  {
    id: "RV-1787746800000-h4po7j9rb", payer: "cl-9", day: 0, salon: AL,
    extras: [
      { kind: "produit", productId: "antiseptique-saryna-keys", qty: 1 },
      { kind: "produit", productId: "damage-repair-oil-saryna-keys", qty: 1 },
    ],
    lines: [
      line("rdv-23a", "manucure-pedicure-manucure-spa-express", "11:35", 45),
      line("rdv-23b", "manucure-pedicure-jelly-pedicure", "10:00", 65, { beneficiaryName: "Rokhaya" }),
      line("rdv-23c", "manucure-pedicure-smooth-pedicure", "10:00", 80, { beneficiaryName: "Marème" }),
    ],
  },
  {
    id: "RV-1787750400000-hviynijko", payer: "cl-4", day: 0, salon: AL,
    advantages: [{ kind: "carte-cadeau", code: "BC-2026-1180", balance: 15_000 }],
    extras: [
      { kind: "produit", productId: "k-elixir-oil-30ml", qty: 1 },
      { kind: "produit", productId: "correcteur-fluide-swiss-perfection-haute-couvrance", qty: 1 },
      { kind: "produit", productId: "peigne-bijou-eclat-de-mariee-finition-or-rose", qty: 1 },
    ],
    lines: [
      line("rdv-24a", "coiffure-shampoing-sechage", "15:00", 60),
      line("rdv-24b", "manucure-pedicure-manucure-spa-express", "15:00", 45, { beneficiaryName: "Moussa", beneficiaryKind: "homme" }),
    ],
  },
  {
    id: "RV-1787754000000-imc93hte1", payer: "cl-10", day: 0, salon: AL,
    lines: [
      line("rdv-25a", "mini-co-mini-jely-manucure", "11:05", 30, { beneficiaryName: "Khady (8 ans)" }),
      line("rdv-25b", "mini-co-mini-cutie-pedicure", "11:00", 35, { beneficiaryName: "Aïcha (5 ans)" }),
    ],
  },

  /* ── Il y a trois jours ── */
  { id: "RV-1787757600000-jd5jjh37e", payer: "cl-3", day: -3, salon: AL, lines: [line("rdv-26a", "coiffure-coupe-transformation", "10:00", 40)] },
  { id: "RV-1787761200000-k3ytzgd0r", payer: "cl-8", day: -3, salon: AL, lines: [line("rdv-27a", "soin-du-visage-hydrafacial-deep-clean", "12:00", 75)] },
  { id: "RV-1787764800000-kus4ffmu4", payer: "cl-10", day: -3, salon: AL, lines: [line("rdv-28a", "manucure-pedicure-jelly-pedicure", "16:30", 65)] },

  /* ── Avant-hier ── */
  { id: "RV-1787689200000-57p13uwpj", payer: "cl-4", day: -2, salon: AL, lines: [line("rdv-7a", "manucure-pedicure-jelly-pedicure", "10:00", 65)] },
  { id: "RV-1787692800000-5yibju6iw", payer: "cl-5", day: -2, salon: SP, lines: [line("rdv-8a", "coiffure-silk-press", "14:00", 180)] },
  { id: "RV-1787696400000-6pblztgc9", payer: "cl-9", day: -2, salon: SP, lines: [line("rdv-9a", "soin-du-visage-hydrafacial-deep-clean", "11:00", 75)] },

  /* ── Hier ── */
  { id: "RV-1787700000000-7g4wfsq5m", payer: "cl-2", day: -1, salon: SP, lines: [line("rdv-10a", "coiffure-soin-complet", "10:00", 130)] },
  { id: "RV-1787703600000-86y6vrzyz", payer: "cl-6", day: -1, salon: AL, lines: [line("rdv-11a", "spa-relax-me-time", "15:00", 80)] },
  { id: "RV-1787707200000-8xrhbr9sc", payer: "cl-1", day: -1, salon: AL, lines: [line("rdv-12a", "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage", "10:00", 90)] },

  /* ── Demain ── */
  {
    id: "RV-1787710800000-9okrrqjlp", payer: "cl-3", day: 1, salon: SP, createdMinutesAgo: 72,
    lines: [
      line("rdv-13a", "coiffure-tissage-versatile", "10:00", 60, { pair: true }),
      line("rdv-13b", "manucure-pedicure-manucure-spa-express", "10:30", 45),
    ],
  },
  { id: "RV-1787714400000-afe27ptf2", payer: "cl-7", day: 1, salon: SP, lines: [line("rdv-14a", "soin-du-visage-golden-vip-facial", "14:00", 90)] },
  { id: "RV-1787718000000-b67cnp38f", payer: "cl-8", day: 1, salon: AL, lines: [line("rdv-15a", "spa-soin-du-dos", "16:00", 90)] },

  /* ── Après-demain ── */
  {
    id: "RV-1787721600000-bx0n3od1s", payer: "cl-5", day: 2, salon: AL,
    lines: [
      line("rdv-16a", "coiffure-coupe-transformation", "10:00", 40),
      line("rdv-16b", "coiffure-silk-press", "11:00", 180),
    ],
  },
  { id: "RV-1787725200000-cntxjnmv5", payer: "cl-9", day: 2, salon: AL, lines: [line("rdv-17a", "manucure-pedicure-smooth-pedicure", "13:00", 80)] },
  { id: "RV-1787768400000-lllevewnh", payer: "cl-1", day: 2, salon: AL, lines: [line("rdv-29a", "spa-relax-me-time", "09:30", 80)] },

  /* ── Dans trois jours ── */
  { id: "RV-1787728800000-den7zmwoi", payer: "cl-4", day: 3, salon: SP, lines: [line("rdv-18a", "coiffure-tresses-cheveux", "09:30", 60)] },
  {
    id: "RV-1787732400000-e5gifm6hv", payer: "cl-1", day: 3, salon: SP,
    lines: [
      line("rdv-19a", "soin-du-visage-face-lift-and-glow-raffermissant-lift-et-glow", "11:00", 70),
      line("rdv-19b", "epilation-epilation-sourcils", "12:30", 15),
    ],
  },
  { id: "RV-1787772000000-mcepbe6gu", payer: "cl-7", day: 3, salon: AL, lines: [line("rdv-30a", "coiffure-tresses-cheveux", "14:30", 60)] },

  /* ── Dans quatre / cinq / six jours ── */
  { id: "RV-1787736000000-ew9svlgb8", payer: "cl-6", day: 4, salon: AL, lines: [line("rdv-20a", "spa-hot-stone-pierres-chaudes", "10:00", 60)] },
  { id: "RV-1787775600000-n37zrdga7", payer: "cl-10", day: 4, salon: SP, lines: [line("rdv-31a", "coiffure-soin-complet", "13:30", 130)] },
  { id: "RV-1787779200000-nu1a7cq3k", payer: "cl-3", day: 5, salon: AL, lines: [line("rdv-32a", "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage", "10:00", 90)] },
  { id: "RV-1787782800000-okuknbzwx", payer: "cl-9", day: 5, salon: AL, lines: [line("rdv-33a", "coiffure-tissage-versatile", "10:00", 60, { pair: true })] },
  { id: "RV-1787739600000-fn33bkq4l", payer: "cl-2", day: 6, salon: SP, lines: [line("rdv-21a", "coiffure-ponytail", "14:00", 90)] },
  { id: "RV-1787786400000-pbnv3b9qa", payer: "cl-5", day: 6, salon: AL, lines: [line("rdv-34a", "soin-du-visage-golden-vip-facial", "11:00", 90)] },

  /* ── Le « dimanche chargé » de point-de-vente (une prestation par réservation) ── */
  ...(
    [
      ["cl-1", "coiffure-silk-press", SP, "10:00"],
      ["cl-2", "manucure-pedicure-manucure-spa-express", AL, "10:00"],
      ["cl-3", "soin-du-visage-hydrafacial-deep-clean", SP, "11:00"],
      ["cl-4", "coiffure-tresses-cheveux", SP, "10:30"],
      ["cl-5", "spa-relax-me-time", AL, "11:00"],
      ["cl-6", "coiffure-coupe-transformation", AL, "11:30"],
      ["cl-7", "manucure-pedicure-jelly-pedicure", AL, "12:00"],
      ["cl-8", "coiffure-soin-complet", AL, "12:30"],
      ["cl-9", "epilation-epilation-sourcils", SP, "14:00"],
      ["cl-10", "coiffure-silk-press", SP, "14:00"],
      ["cl-1", "spa-soin-du-dos", AL, "14:30"],
      ["cl-3", "manucure-pedicure-smooth-pedicure", AL, "15:00"],
      ["cl-6", "coiffure-shampoing-sechage", AL, "15:00"],
      ["cl-9", "soin-du-visage-golden-vip-facial", SP, "15:30"],
      ["cl-4", "coiffure-tresses-cheveux", SP, "15:30"],
      ["cl-2", "mini-co-mini-jely-manucure", AL, "16:30"],
    ] as const
  ).map(([payer, prestationId, salon, start], i): PdvReservation => ({
    id: `RV-DIM-${String(i + 1).padStart(2, "0")}`,
    payer,
    day: 3, // le dimanche qui vient, ramené au samedi (cf. plus haut)
    salon,
    lines: [
      line(
        `rdv-dim-${i + 1}`,
        prestationId,
        start,
        prestationSeeds.find((p) => p.id === prestationId)?.durationMin ?? 60,
      ),
    ],
  })),
];

// « Maintenant » du monde de démo, en minutes — sert à dater les réservations
// toutes fraîches (`createdMinutesAgo`).
const NOW_MIN = timeToMinutes(NOW_ISO.slice(11, 16));

const isoPlusDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

// Jour réel d'une réservation : décalage depuis `TODAY_ISO`, dimanche → samedi.
const pdvDay = (offset: number) => {
  const iso = isoPlusDays(TODAY_ISO, offset);
  return new Date(`${iso}T12:00:00`).getDay() === 0 ? isoPlusDays(iso, -1) : iso;
};

const categoryOf = (prestationId: string) => {
  const p = prestationSeeds.find((x) => x.id === prestationId);
  return serviceSeeds.find((s) => s.id === p?.serviceId)?.name ?? "Autres";
};

function fitPdvSeeds(input: PdvReservation[]): RdvDetail[] {
  const clientRows = clients("all");
  const practitioners = members.filter((m) => m.active && m.roles.includes("praticienne"));
  const busy = new Map<string, { start: number; end: number }[]>(); // memberId|iso

  // Présente ce jour-là dans ce salon, toute la fenêtre dans ses horaires,
  // hors coupure, et pas déjà prise.
  const fits = (memberId: string, iso: string, salon: SalonId, start: number, dur: number) =>
    coversWindow(memberId, salon, iso, start, dur) &&
    !(busy.get(`${memberId}|${iso}`) ?? []).some((b) => start < b.end && b.start < start + dur);
  const book = (memberId: string, iso: string, start: number, dur: number) => {
    const key = `${memberId}|${iso}`;
    busy.set(key, [...(busy.get(key) ?? []), { start, end: start + dur }]);
  };
  // La moins chargée d'abord, comme la prise de RDV de point-de-vente.
  const candidates = (prestationId: string, iso: string) =>
    practitioners
      .filter((m) => canPerform(m.id, prestationId))
      .sort(
        (a, b) =>
          (busy.get(`${a.id}|${iso}`)?.length ?? 0) - (busy.get(`${b.id}|${iso}`)?.length ?? 0),
      );

  type Placed = { staff: string | null; second: string | null; start: number; dur: number };
  const place = (l: PdvLine, iso: string, salon: SalonId, commit: boolean): Placed => {
    const wanted = timeToMinutes(l.start);
    const hours = salonConfig(salon).hours;
    const day = hours[(["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const)[new Date(`${iso}T12:00:00`).getDay()]];
    const open = day.closed ? wanted : timeToMinutes(day.open);
    const close = day.closed ? wanted : timeToMinutes(day.close);
    const times = [wanted];
    for (let t = open; t < close; t += 15) if (t !== wanted) times.push(t);
    const full = prestationSeeds.find((p) => p.id === l.prestationId)?.durationMin ?? l.durationMin;
    const pool = candidates(l.prestationId, iso);

    for (const start of times) {
      for (const m of pool) {
        if (!fits(m.id, iso, salon, start, l.durationMin)) continue;
        if (!l.pair) {
          if (commit) book(m.id, iso, start, l.durationMin);
          return { staff: fullName(m), second: null, start, dur: l.durationMin };
        }
        const second = pool.find((o) => o.id !== m.id && fits(o.id, iso, salon, start, l.durationMin));
        if (second) {
          if (commit) {
            book(m.id, iso, start, l.durationMin);
            book(second.id, iso, start, l.durationMin);
          }
          return { staff: fullName(m), second: fullName(second), start, dur: l.durationMin };
        }
      }
      // Pas de binôme à l'heure demandée : une seule praticienne, temps plein.
      if (l.pair && start === wanted) {
        const solo = pool.find((m) => fits(m.id, iso, salon, start, full));
        if (solo) {
          if (commit) book(solo.id, iso, start, full);
          return { staff: fullName(solo), second: null, start, dur: full };
        }
      }
    }
    return { staff: null, second: null, start: wanted, dur: l.pair ? full : l.durationMin };
  };

  // Par jour puis par heure demandée, comme côté caisse.
  const ordered = input
    .map((r) => ({ r, iso: pdvDay(r.day) }))
    .sort(
      (a, b) =>
        a.iso.localeCompare(b.iso) ||
        Math.min(...a.r.lines.map((l) => timeToMinutes(l.start))) -
          Math.min(...b.r.lines.map((l) => timeToMinutes(l.start))),
    );

  return ordered.map(({ r, iso }) => {
    // Le salon d'origine, sauf si l'autre permet d'affecter davantage de
    // prestations (la répartition des métiers entre salons diffère ici).
    const other: SalonId = r.salon === AL ? SP : AL;
    const score = (salon: SalonId) =>
      isClosed(salon, iso) ? -1 : r.lines.filter((l) => place(l, iso, salon, false).staff).length;
    const salon = score(other) > score(r.salon) ? other : r.salon;
    const placed = r.lines.map((l) => ({ l, p: place(l, iso, salon, true) }));

    const row = clientRows.find((c) => c.id === PDV_CLIENT[r.payer])!;
    const client: RdvClient = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      whatsapp: row.phone,
      loyaltyPoints: row.loyaltyPoints,
    };
    const prestations: RdvPrestation[] = placed.map(({ l, p }) => {
      const cat = categoryOf(l.prestationId);
      const item = prestationSeeds.find((x) => x.id === l.prestationId)!;
      return {
        id: l.id,
        prestationId: l.prestationId,
        category: cat,
        name: item.name,
        durationMin: p.dur,
        price: item.priceFcfa,
        posteType: posteTypeForCategory(cat),
        staff: p.staff,
        secondStaff: p.second,
        start: minutesToTime(p.start),
        beneficiaryName: l.beneficiaryName ?? client.name,
        beneficiaryKind: l.beneficiaryKind,
      };
    });
    const first = Math.min(...prestations.map((p) => timeToMinutes(p.start)));
    const staffs = new Set(prestations.map((p) => p.staff));
    const past = iso < TODAY_ISO;
    const total = prestations.reduce((n, p) => n + p.price, 0);

    const created =
      r.createdMinutesAgo != null
        ? `${TODAY_ISO}T${minutesToTime(NOW_MIN - r.createdMinutesAgo)}:00`
        : `${isoPlusDays(iso, -2)}T18:30:00`;
    const last = Math.max(...prestations.map((p) => timeToMinutes(p.start) + p.durationMin));
    // Du plus récent au plus ancien.
    const events: RdvEvent[] = [
      ...(past
        ? [
            { at: `${iso}T${minutesToTime(last)}:00`, label: "Visite terminée", detail: `Encaissé · ${fcfa(total)}` },
            { at: `${iso}T${minutesToTime(first)}:00`, label: "Cliente arrivée" },
          ]
        : []),
      {
        at: created,
        label: "Rendez-vous créé",
        detail: `Réservation en ligne${r.deposit ? ` · acompte de ${fcfa(r.deposit)} réglé` : ""}`,
      },
    ];

    return {
      id: r.id,
      ref: `#${r.id.split("-").pop()!.slice(0, 8)}`,
      status: past ? "terminé" : "à venir",
      date: `${iso}T${minutesToTime(first)}:00`,
      salon,
      salonLabel: salonName(salon),
      client,
      staffGlobal: staffs.size === 1 ? [...staffs][0] : null,
      prestations,
      extras: (r.extras ?? []).map((e, i) => ({ ...e, id: `ex${i + 1}` })),
      questions: [],
      advantages: r.advantages ?? [],
      events,
    };
  });
}

const SEEDS: RdvDetail[] = [...fitPdvSeeds(PDV_RESERVATIONS), ...RAW_SEEDS.map(normalize)];

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

// Au moins une prestation qu'aucune praticienne ne peut prendre, sur un
// rendez-vous non clos — un conflit (cf. `autoAssign`), pas une tâche courante.
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

/* ------------------------------------------------------------------ */
/* Affectation automatique                                             */
/* ------------------------------------------------------------------ */
//
// Règle métier : une prestation n'attend jamais qu'on lui choisisse une
// praticienne. Elle est affectée d'office à une praticienne compétente,
// présente ce jour-là dans le salon du rendez-vous (horaires, coupure,
// absences du planning) et libre sur toute sa fenêtre — la moins chargée de
// la journée d'abord, comme la prise de RDV de point-de-vente. La propriétaire
// peut ensuite changer d'intervenante, jamais « désaffecter ».
//
// `staff === null` ne subsiste donc que dans un cas d'exception : personne ne
// peut la prendre (absence posée après la réservation, équipe complète). C'est
// un conflit à résoudre (déplacer le rendez-vous), plus une tâche d'affectation.

type Window = { start: number; end: number };

const overlaps = (ws: Window[], start: number, end: number) =>
  ws.some((w) => start < w.end && w.start < end);

// La praticienne peut-elle tenir cette fenêtre d'après son planning ?
export function coversWindow(
  memberId: string,
  salon: SalonId,
  iso: string,
  startMin: number,
  durationMin: number,
  data?: PlanningData,
): boolean {
  const pres = presenceFor(memberId, iso, data);
  if (pres.state !== "present" || pres.salonId !== salon) return false;
  const end = startMin + durationMin;
  if (startMin < timeToMinutes(pres.start) || end > timeToMinutes(pres.end)) return false;
  if (pres.breakStart && pres.breakEnd) {
    if (startMin < timeToMinutes(pres.breakEnd) && timeToMinutes(pres.breakStart) < end) return false;
  }
  return true;
}

const practitionerPool = () =>
  members.filter((m) => m.active && m.roles.includes("praticienne"));

// Praticiennes (noms complets) pouvant prendre cette prestation à ce créneau,
// la moins chargée ce jour-là d'abord. `excludeRdvId` : le rendez-vous en
// cours d'édition ne se bloque pas lui-même ; `exclude` : noms à écarter
// (ex. la 1ʳᵉ praticienne quand on cherche la 2ᵉ).
export function availablePractitioners(
  list: RdvDetail[],
  prestationId: string,
  salon: SalonId,
  iso: string,
  startMin: number,
  durationMin: number,
  opts: { data?: PlanningData; excludeRdvId?: string; exclude?: (string | null)[] } = {},
): string[] {
  const load = (name: string) => staffBusyWindows(list, name, iso, opts.excludeRdvId).length;
  return practitionerPool()
    .filter((m) => canPerform(m.id, prestationId))
    .filter((m) => coversWindow(m.id, salon, iso, startMin, durationMin, opts.data))
    .map(fullName)
    .filter((name) => !opts.exclude?.includes(name))
    .filter((name) => isStaffFreeForWindow(list, name, iso, startMin, durationMin, opts.excludeRdvId))
    .sort((a, b) => load(a) - load(b));
}

// Garantit la règle sur toute une liste de rendez-vous : chaque prestation
// d'un rendez-vous non clos garde sa praticienne si elle reste valable
// (compétente, présente, pas déjà prise ailleurs), sinon en reçoit une
// automatiquement. Les rendez-vous clos et annulés ne bougent pas. Renvoie les
// mêmes objets quand rien ne change.
export function autoAssign(list: RdvDetail[], data?: PlanningData): RdvDetail[] {
  const byName = new Map(practitionerPool().map((m) => [fullName(m), m.id]));
  const busy = new Map<string, Window[]>(); // nom|iso
  const key = (name: string, iso: string) => `${name}|${iso}`;
  const book = (name: string, iso: string, start: number, end: number) =>
    busy.set(key(name, iso), [...(busy.get(key(name, iso)) ?? []), { start, end }]);
  const isFree = (name: string, iso: string, start: number, end: number) =>
    !overlaps(busy.get(key(name, iso)) ?? [], start, end);

  const open = (r: RdvDetail) => !RDV_STATUS_META[r.status].closed;
  const order = list
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.status !== "annulé")
    .sort((a, b) => a.r.date.localeCompare(b.r.date));

  // 1. Ce qui est clos compte comme occupé, tel quel.
  for (const { r } of order) {
    if (open(r)) continue;
    const iso = r.date.slice(0, 10);
    for (const p of r.prestations) {
      const start = timeToMinutes(p.start);
      for (const n of [p.staff, p.secondStaff]) if (n) book(n, iso, start, start + p.durationMin);
    }
  }

  // 2. Affectations existantes encore valables, dans l'ordre chronologique.
  const valid = (r: RdvDetail, p: RdvPrestation, name: string | null | undefined) => {
    if (!name) return false;
    const id = byName.get(name);
    if (!id || !canPerform(id, p.prestationId)) return false;
    const iso = r.date.slice(0, 10);
    const start = timeToMinutes(p.start);
    return (
      coversWindow(id, r.salon, iso, start, p.durationMin, data) &&
      isFree(name, iso, start, start + p.durationMin)
    );
  };
  const kept = new Map<string, { staff: boolean; second: boolean }>(); // rdvId|prestationId
  for (const { r } of order) {
    if (!open(r)) continue;
    const iso = r.date.slice(0, 10);
    for (const p of r.prestations) {
      const start = timeToMinutes(p.start);
      const staff = valid(r, p, p.staff);
      if (staff) book(p.staff!, iso, start, start + p.durationMin);
      const second = staff && valid(r, p, p.secondStaff);
      if (second) book(p.secondStaff!, iso, start, start + p.durationMin);
      kept.set(`${r.id}|${p.id}`, { staff, second });
    }
  }

  // 3. Le reste reçoit la première praticienne disponible.
  const pick = (r: RdvDetail, p: RdvPrestation, exclude: (string | null)[]) => {
    const iso = r.date.slice(0, 10);
    const start = timeToMinutes(p.start);
    const load = (n: string) => busy.get(key(n, iso))?.length ?? 0;
    const name =
      practitionerPool()
        .filter((m) => canPerform(m.id, p.prestationId))
        .filter((m) => coversWindow(m.id, r.salon, iso, start, p.durationMin, data))
        .map(fullName)
        .filter((n) => !exclude.includes(n) && isFree(n, iso, start, start + p.durationMin))
        .sort((a, b) => load(a) - load(b))[0] ?? null;
    if (name) book(name, iso, start, start + p.durationMin);
    return name;
  };

  const out = [...list];
  for (const { r, i } of order) {
    if (!open(r)) continue;
    let changed = false;
    const prestations = r.prestations.map((p) => {
      const k = kept.get(`${r.id}|${p.id}`)!;
      if (k.staff && (k.second || !p.secondStaff)) return p;
      changed = true;
      const staff = k.staff ? p.staff : pick(r, p, [p.secondStaff ?? null]);
      // « À deux » : la 2ᵉ praticienne est remplacée si possible, sinon la
      // prestation reste à une seule praticienne.
      const secondStaff =
        p.secondStaff && staff ? (k.second ? p.secondStaff : pick(r, p, [staff])) : null;
      return { ...p, staff, secondStaff };
    });
    if (!changed) continue;
    const staffs = new Set(prestations.map((p) => p.staff));
    out[i] = { ...r, prestations, staffGlobal: staffs.size === 1 ? [...staffs][0] : null };
  }
  return out;
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
  pendingAssign: number; // prestations sans praticienne disponible (conflit)
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
        ? "Aucune praticienne"
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

/* ------------------------------------------------------------------ */
/* Composition d'une réservation (point-de-vente fait autorité)        */
/* ------------------------------------------------------------------ */

export type BeneficiaryKind = "femme" | "homme" | "enfant";

// Clé d'une personne servie — même dérivation que point-de-vente
// (`beneficiaryClientId ?? beneficiaryName`, le payeur sinon).
export const beneficiaryKey = (p: RdvPrestation, payerName: string) =>
  p.beneficiaryClientId ?? (p.beneficiaryName && p.beneficiaryName !== payerName ? p.beneficiaryName : "__payer__");

// Mini & Co vaut toujours « enfant » ; sinon `beneficiaryKind` tranche.
export const beneficiaryKindOf = (p: RdvPrestation): BeneficiaryKind =>
  p.category.startsWith("Mini & Co") ? "enfant" : (p.beneficiaryKind ?? "femme");

/** « 1 femme + 1 enfant » — la ligne de composition des cartes et de la fiche
 *  (`reservationComposition` de point-de-vente). */
export function reservationComposition(r: Pick<RdvDetail, "prestations" | "client">): string {
  const people = new Map<string, BeneficiaryKind>();
  for (const p of r.prestations) {
    const key = beneficiaryKey(p, r.client.name);
    if (!people.has(key)) people.set(key, beneficiaryKindOf(p));
  }
  const counts = { femme: 0, homme: 0, enfant: 0 };
  for (const kind of people.values()) counts[kind] += 1;
  const parts: string[] = [];
  if (counts.femme > 0) parts.push(`${counts.femme} femme${counts.femme > 1 ? "s" : ""}`);
  if (counts.homme > 0) parts.push(`${counts.homme} homme${counts.homme > 1 ? "s" : ""}`);
  if (counts.enfant > 0) parts.push(`${counts.enfant} enfant${counts.enfant > 1 ? "s" : ""}`);
  return parts.join(" + ") || "1 femme";
}

/** Début et fin de la visite, « HH:MM ». */
export const rdvStartTime = (r: Pick<RdvDetail, "date" | "prestations">) =>
  r.prestations.length
    ? minutesToTime(Math.min(...r.prestations.map((p) => timeToMinutes(p.start))))
    : r.date.slice(11, 16);
export const rdvEndTime = (r: Pick<RdvDetail, "date" | "prestations">) => rdvEnd(r).slice(11, 16);
