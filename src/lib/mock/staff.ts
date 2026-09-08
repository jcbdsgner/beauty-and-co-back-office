// Données fictives « Équipe » — front-end uniquement, aucune API, aucune persistance.
// Indépendant du barrel `@/lib/mock` : importer directement `@/lib/mock/staff`.
//
// Le domicile des personnes qui font tourner les salons : identité, rôles, salons
// de rattachement, accès à la plateforme, compétences (les prestations qu'elles
// savent réaliser) et horaires habituels. Ces horaires sont la trame de
// référence que « Planning » applique semaine après semaine ; « Rendez-vous »
// lit les compétences pour savoir qui proposer à la réservation.

import { type SalonId, type SalonScope, type Weekday } from "./beautyandco";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type StaffRole = "praticienne" | "caisse" | "manager";

export type StaffCategory = "coiffure" | "esthetique" | "staff";

export type AccountState = "active" | "invited" | "none";

export const ROLE_LABELS: Record<StaffRole, string> = {
  praticienne: "Praticienne",
  caisse: "Caisse",
  manager: "Manager",
};

export const CATEGORY_LABELS: Record<StaffCategory, string> = {
  coiffure: "Coiffeuse",
  esthetique: "Esthéticienne",
  staff: "Staff",
};

export const ACCOUNT_LABELS: Record<AccountState, string> = {
  active: "Compte actif",
  invited: "Invitation envoyée",
  none: "Aucun compte",
};

export const ROLE_OPTIONS: { value: StaffRole; label: string }[] = (
  ["praticienne", "caisse", "manager"] as StaffRole[]
).map((value) => ({ value, label: ROLE_LABELS[value] }));

export const CATEGORY_OPTIONS: { value: StaffCategory; label: string }[] = (
  ["coiffure", "esthetique", "staff"] as StaffCategory[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

// Horaire habituel d'un jour : soit repos, soit une plage avec coupure
// optionnelle. Heures au format "HH:MM".
export type DayShift =
  | { off: true }
  | { off: false; start: string; end: string; breakStart?: string; breakEnd?: string };

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  roles: StaffRole[];
  category: StaffCategory;
  salonIds: SalonId[]; // salons de rattachement
  account: AccountState;
  active: boolean;
  skills: string[]; // ids de prestations (cf. `@/lib/mock/services`)
  baseHours: Record<Weekday, DayShift>;
};

/* ------------------------------------------------------------------ */
/* Trames d'horaires                                                  */
/* ------------------------------------------------------------------ */

const OFF: DayShift = { off: true };

// Journée « standard salon » : 09:00–19:00, coupure 13:00–14:00.
const full = (start = "09:00", end = "19:00"): DayShift => ({
  off: false,
  start,
  end,
  breakStart: "13:00",
  breakEnd: "14:00",
});

// Construit une semaine à partir d'une trame partielle ; les jours absents sont
// des repos.
const week = (days: Partial<Record<Weekday, DayShift>>): Record<Weekday, DayShift> => ({
  lun: days.lun ?? OFF,
  mar: days.mar ?? OFF,
  mer: days.mer ?? OFF,
  jeu: days.jeu ?? OFF,
  ven: days.ven ?? OFF,
  sam: days.sam ?? OFF,
  dim: days.dim ?? OFF,
});

/* ------------------------------------------------------------------ */
/* Fixtures — 5 praticiennes canon + 1 caisse + 1 manager             */
/* ------------------------------------------------------------------ */

export const members: Member[] = [
  {
    id: "m-sophie",
    firstName: "Sophie",
    lastName: "Ndione",
    phone: "+221 77 512 40 18",
    email: "sophie.ndione@beautyandco.sn",
    roles: ["praticienne"],
    category: "coiffure",
    salonIds: ["almadies"],
    account: "active",
    active: true,
    skills: [
      "coiffure-supplement-lisseur",
      "coiffure-soin-keratine",
      "coiffure-supplement-coupe-pointes",
      "coiffure-coupe-transformation",
      "coiffure-tresses-cheveux",
      "coiffure-shampoing-brushing-sur-extensions-tissages-shampoing-inclus-et-obligatoire",
      "coiffure-soin-croisiere",
      "coiffure-soin-botox-lissant",
      "coiffure-tissage-ouvert",
      "coiffure-tissage-rajout",
      "coiffure-half-up-half-down",
      "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire",
      "coiffure-defrisage-professionnel-soin-fortifiant-anti-casse",
      "coiffure-soin-complet",
      "coiffure-soin-detox",
      "coiffure-soin-botox-reparateur-non-lissant",
      "coiffure-silk-press",
      "coiffure-pose-clips",
      "coiffure-ponytail",
      "coiffure-supplement-hand-feet-massage-massage-pieds-mains",
      "coiffure-pose-u-part-wig",
      "coiffure-tissage-versatile",
      "coiffure-shampoing-sechage",
      "coiffure-flip-over-sew-in-tissage-ferme",
      "coiffure-soin-vip",
      "mini-co-mini-hair-treat-mini-co",
      "mini-co-coupe-pointes-enfants-mini-co",
    ],
    // Mercredi repos.
    baseHours: week({ lun: full(), mar: full(), jeu: full(), ven: full(), sam: full() }),
  },
  {
    id: "m-mariama",
    firstName: "Mariama",
    lastName: "Bâ",
    phone: "+221 77 634 09 55",
    email: "mariama.ba@beautyandco.sn",
    roles: ["praticienne"],
    category: "coiffure",
    salonIds: ["almadies"],
    account: "active",
    active: true,
    skills: [
      "coiffure-defrisage-professionnel-beauty-and-co-texlax",
      "coiffure-hybrid-extensions",
      "coiffure-extensions-tapes-2-paquets-de-cheveux-soit-100-g-18-pouces-coiffage",
      "coiffure-enlever-anneaux",
      "coiffure-pose-perruque",
      "coiffure-soin-perruque",
      "coiffure-tresses-cheveux",
      "coiffure-soin-croisiere",
      "coiffure-extension-aux-fils-2-paquets",
      "coiffure-tissage-ouvert",
      "coiffure-tissage-rajout",
      "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire",
      "coiffure-extensions-aux-fils-1-paquet",
      "coiffure-soin-complet",
      "coiffure-soin-detox",
      "coiffure-pose-clips",
      "coiffure-tissage-versatile",
      "coiffure-shampoing-sechage",
      "coiffure-supplement-express-floral-facial-soin-du-visage-relaxant",
      "coiffure-soin-reparateur-olapex-new-in",
      "coiffure-silk-press",
      "mini-co-mini-hair-treat-braids-mini-co",
      "mini-co-defaire-tresses-enfant",
    ],
    // Mardi–samedi.
    baseHours: week({ mar: full(), mer: full(), jeu: full(), ven: full(), sam: full() }),
  },
  {
    id: "m-aida",
    firstName: "Aïda",
    lastName: "Sarr",
    phone: "+221 78 220 71 03",
    email: "aida.sarr@beautyandco.sn",
    roles: ["praticienne"],
    category: "coiffure",
    salonIds: ["almadies"],
    account: "invited",
    active: true,
    // Coiffure + un peu d'onglerie/manucure (dépannage).
    skills: [
      "coiffure-supplement-lisseur",
      "coiffure-supplement-coupe-pointes",
      "coiffure-coupe-transformation",
      "coiffure-tresses-cheveux",
      "coiffure-half-up-half-down",
      "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire",
      "coiffure-ponytail",
      "coiffure-shampoing-sechage",
      "manucure-pedicure-manucure-russe-sans-vernis-sans-gel",
      "onglerie-vernis-permanent-mains",
      "onglerie-remplissage-gel",
    ],
    // Lundi–vendredi pleine journée, samedi matin seulement.
    baseHours: week({
      lun: full(),
      mar: full(),
      mer: full(),
      jeu: full(),
      ven: full(),
      sam: { off: false, start: "09:00", end: "14:00" },
    }),
  },
  {
    id: "m-bineta",
    firstName: "Bineta",
    lastName: "Cissé",
    phone: "+221 77 401 88 26",
    email: "bineta.cisse@beautyandco.sn",
    roles: ["praticienne"],
    category: "esthetique",
    salonIds: ["seaplaza"],
    account: "active",
    active: true,
    skills: [
      "spa-soin-du-dos",
      "spa-reflexology",
      "spa-relax-me-time",
      "spa-energissant-sportif",
      "spa-black-relief-dos",
      "spa-de-stress-relaxant",
      "spa-deep-tonique",
      "spa-steam-time",
      "spa-express-head-neck-shoulder",
      "soin-du-visage-face-lift-and-glow-raffermissant-lift-et-glow",
      "soin-du-visage-glow-me-facial",
      "soin-du-visage-acne-treatment",
      "soin-du-visage-hydrate-me-and-restore",
      "soin-du-visage-detox-me-facial",
      "epilation-epilation-menton",
      "epilation-epilation-bras",
      "epilation-epilation-jambes-completes",
      "epilation-epilation-demi-jambes",
      "epilation-epilation-duvet-ventre",
      "epilation-epilation-aisselles",
      "epilation-epilation-sourcils",
      "epilation-pack-epilations-completes",
      "mini-co-mini-cutie-pedicure",
    ],
    // Jeudi repos.
    baseHours: week({ lun: full(), mar: full(), mer: full(), ven: full(), sam: full() }),
  },
  {
    id: "m-coumba",
    firstName: "Coumba",
    lastName: "Faye",
    phone: "+221 76 918 33 40",
    email: "coumba.faye@beautyandco.sn",
    roles: ["praticienne"],
    category: "esthetique",
    salonIds: ["seaplaza"],
    account: "none",
    active: true,
    skills: [
      "manucure-pedicure-manucure-russe-sans-vernis-sans-gel",
      "manucure-pedicure-vernis-simple-mains-classique-et-halal",
      "manucure-pedicure-jelly-pedicure",
      "manucure-pedicure-smooth-pedicure",
      "manucure-pedicure-manucure-permanent",
      "manucure-pedicure-pedicure-permanent",
      "manucure-pedicure-pedicure-me-spa",
      "manucure-pedicure-manucure-spa-express",
      "manucure-pedicure-gel-sur-ongle-naturel-gainage",
      "manucure-pedicure-supplement-decoration-chrome-cat-eye-baby-boomer",
      "onglerie-vernis-permanent-pieds",
      "onglerie-vernis-permanent-mains",
      "onglerie-remplissage-gel",
      "onglerie-gel-x",
      "onglerie-capsules-permanents-mains",
      "onglerie-depose-gel-gel-a-enlever",
      "onglerie-reparation-ongle-1-doigt",
      "onglerie-supplement-french",
      "onglerie-supplement-decoration-chrome-cat-eye-baby-boomer",
      "mini-co-mini-jely-manucure",
    ],
    // Mardi–samedi, démarrage 10:00, coupure 13:30–14:30.
    baseHours: week({
      mar: { off: false, start: "10:00", end: "19:00", breakStart: "13:30", breakEnd: "14:30" },
      mer: { off: false, start: "10:00", end: "19:00", breakStart: "13:30", breakEnd: "14:30" },
      jeu: { off: false, start: "10:00", end: "19:00", breakStart: "13:30", breakEnd: "14:30" },
      ven: { off: false, start: "10:00", end: "19:00", breakStart: "13:30", breakEnd: "14:30" },
      sam: { off: false, start: "10:00", end: "19:00", breakStart: "13:30", breakEnd: "14:30" },
    }),
  },
  {
    id: "m-awa",
    firstName: "Awa",
    lastName: "Diagne",
    phone: "+221 77 305 62 11",
    email: "awa.diagne@beautyandco.sn",
    roles: ["caisse"],
    category: "staff",
    salonIds: ["almadies"],
    account: "active",
    active: true,
    skills: [],
    baseHours: week({
      lun: full("08:30", "19:00"),
      mar: full("08:30", "19:00"),
      mer: full("08:30", "19:00"),
      jeu: full("08:30", "19:00"),
      ven: full("08:30", "19:00"),
      sam: full("08:30", "19:00"),
    }),
  },
  {
    id: "m-rokhaya",
    firstName: "Rokhaya",
    lastName: "Diallo",
    phone: "+221 77 118 09 74",
    email: "rokhaya.diallo@beautyandco.sn",
    roles: ["manager", "caisse"],
    category: "staff",
    salonIds: ["almadies", "seaplaza"],
    account: "active",
    active: true,
    skills: [],
    baseHours: week({
      lun: { off: false, start: "09:00", end: "17:00" },
      mar: { off: false, start: "09:00", end: "17:00" },
      mer: { off: false, start: "09:00", end: "17:00" },
      jeu: { off: false, start: "09:00", end: "17:00" },
      ven: { off: false, start: "09:00", end: "17:00" },
    }),
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export const fullName = (m: Member) => `${m.firstName} ${m.lastName}`;

export const initials = (m: Member) =>
  `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`.toUpperCase();

export const memberById = (id: string): Member | null =>
  members.find((m) => m.id === id) ?? null;

export const membersInScope = (scope: SalonScope): Member[] =>
  scope === "all" ? members : members.filter((m) => m.salonIds.includes(scope));

export const roleLabel = (r: StaffRole) => ROLE_LABELS[r];
export const categoryLabel = (c: StaffCategory) => CATEGORY_LABELS[c];
export const accountLabel = (a: AccountState) => ACCOUNT_LABELS[a];

// Cette personne sait-elle réaliser cette prestation ?
export const canPerform = (memberId: string, prestationId: string) =>
  memberById(memberId)?.skills.includes(prestationId) ?? false;

// Personnes qui peuvent être proposées à la réservation pour une prestation :
// actives, praticiennes, compétentes, et — si un salon est précisé — rattachées
// à ce salon.
export const membersForPrestation = (
  prestationId: string,
  scope: SalonScope = "all",
): Member[] =>
  members.filter(
    (m) =>
      m.active &&
      m.roles.includes("praticienne") &&
      m.skills.includes(prestationId) &&
      (scope === "all" || m.salonIds.includes(scope)),
  );

export const newStaffId = () => `m-${Date.now().toString(36)}`;
