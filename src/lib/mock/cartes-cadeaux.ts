// Cartes cadeaux (2026-10-05) — suivi des cartes vendues, en deux formats :
// - **digitale** : envoyée par e-mail ou WhatsApp à la bénéficiaire, tout de
//   suite ou à une date choisie (anniversaire…). Rien à préparer ; ce qui peut
//   mal tourner, c'est l'envoi (adresse ou numéro injoignable).
// - **physique** : imprimée, puis retirée au salon ou livrée dans un quartier
//   (prix réglé dans Réglages › Livraison, `@/lib/mock/livraison`). Elle passe
//   par « à imprimer » → « imprimée » (prête à remettre) → « remise » (retrait)
//   ou « expédiée » (livraison) — mêmes termes que la file de point-de-vente.
// Deux contenus, comme `GiftCardKind` de point-de-vente : **montant** (un solde
// en FCFA, utilisable en plusieurs fois) ou **prestations** (un ensemble fixe
// de prestations du catalogue, offertes ; `amountFcfa` = leur valeur à
// l'achat, jamais affichée comme un prix sur la carte). Valable 12 mois dans
// tous les salons. L'**acheteur** prime à l'affichage, le **destinataire**
// vient ensuite. Codes `BC-2026-4471` et `BC-2026-1180` : les cartes
// mobilisées par les rendez-vous de démo (`rendezvous.ts`), mêmes soldes.
// Indépendant du barrel : importer directement `@/lib/mock/cartes-cadeaux`.

import type { SalonId } from "./beautyandco";
import { prestationSeeds } from "./services";

export type GiftCardFormat = "digitale" | "physique";

export const GIFT_CARD_FORMAT_LABELS: Record<GiftCardFormat, string> = {
  digitale: "Digitales",
  physique: "Physiques",
};

/** Ce que la carte offre — mêmes valeurs que `GiftCardKind` de point-de-vente. */
export type GiftCardKind = "montant" | "prestations";

export type GiftCardPerson = {
  clientId: string | null; // null = hors fichier
  name: string;
  phone?: string;
  email?: string;
};

export type GiftCardUse = {
  at: string; // yyyy-mm-dd
  salonId: SalonId;
  amountFcfa: number;
  label: string; // ce qui a été réglé avec
  rdvId?: string;
  /** Carte prestations : la prestation honorée. */
  prestationId?: string;
};

export type DigitalSend = {
  channel: "email" | "whatsapp";
  to: string;
  status: "envoyee" | "programmee" | "echec";
  scheduledFor: string; // yyyy-mm-dd
  sentAt?: string; // yyyy-mm-ddTHH:MM
  failure?: string;
};

export type PhysicalStep = "a-preparer" | "prete" | "remise";

export type PhysicalHandover = {
  step: PhysicalStep;
  readyAt?: string; // yyyy-mm-dd
  handedAt?: string; // yyyy-mm-dd
} & (
  | { mode: "retrait"; salonId: SalonId }
  | { mode: "livraison"; zone: string; address: string; feeFcfa: number }
);

type Base = {
  id: string;
  code: string;
  kind: GiftCardKind;
  /** Montant : la valeur chargée. Prestations : la valeur des prestations à l'achat. */
  amountFcfa: number;
  /** Carte prestations : les prestations offertes (ids catalogue). */
  prestationIds?: string[];
  purchasedAt: string; // yyyy-mm-dd
  soldAt: "en-ligne" | SalonId;
  buyer: GiftCardPerson;
  recipient: GiftCardPerson;
  message?: string;
  uses: GiftCardUse[];
};

export type GiftCard =
  | (Base & { format: "digitale"; digital: DigitalSend })
  | (Base & { format: "physique"; physical: PhysicalHandover });

export const VALIDITY_MONTHS = 12;

/* ------------------------------------------------------------------ */
/* Seeds — monde de démo ancré au jeudi 3 septembre 2026              */
/* ------------------------------------------------------------------ */

export const giftCardSeeds: GiftCard[] = [
  // — Digitales —
  {
    id: "gc-5141", code: "BC-2026-5141", format: "digitale", kind: "montant", amountFcfa: 50_000,
    purchasedAt: "2026-09-03", soldAt: "en-ligne",
    buyer: { clientId: "c12", name: "Rama Diallo" },
    recipient: { clientId: null, name: "Khady Mbaye", email: "khady.mbaye@gmail.com" },
    message: "Pour ta pendaison de crémaillère, prends soin de toi !",
    digital: { channel: "email", to: "khady.mbaye@gmail.com", status: "envoyee", scheduledFor: "2026-09-03", sentAt: "2026-09-03T11:02" },
    uses: [],
  },
  {
    id: "gc-5120", code: "BC-2026-5120", format: "digitale", kind: "montant", amountFcfa: 30_000,
    purchasedAt: "2026-09-02", soldAt: "en-ligne",
    buyer: { clientId: "c10", name: "Aminata Fall" },
    recipient: { clientId: "c08", name: "Ndèye Diop", phone: "+221 77 412 08 33" },
    message: "Joyeux anniversaire ma sœur ❤️",
    digital: {
      channel: "whatsapp", to: "+221 77 412 08 33", status: "echec", scheduledFor: "2026-09-02",
      failure: "Ce numéro n'a pas de compte WhatsApp.",
    },
    uses: [],
  },
  {
    id: "gc-5133", code: "BC-2026-5133", format: "digitale", kind: "prestations", amountFcfa: 45_000,
    prestationIds: ["manucure-pedicure-manucure-spa-express", "manucure-pedicure-jelly-pedicure"],
    purchasedAt: "2026-09-01", soldAt: "almadies",
    buyer: { clientId: "c11", name: "Sokhna Ndiaye" },
    recipient: { clientId: null, name: "Mame Diarra Sow", email: "mamediarra.sow@yahoo.fr" },
    message: "Bon anniversaire Maman !",
    digital: { channel: "email", to: "mamediarra.sow@yahoo.fr", status: "programmee", scheduledFor: "2026-09-12" },
    uses: [],
  },
  {
    id: "gc-5098", code: "BC-2026-5098", format: "digitale", kind: "montant", amountFcfa: 75_000,
    purchasedAt: "2026-08-28", soldAt: "en-ligne",
    buyer: { clientId: "c16", name: "Penda Ndoye" },
    recipient: { clientId: "c17", name: "Oumou Baldé", email: "oumou.balde@gmail.com" },
    digital: { channel: "email", to: "oumou.balde@gmail.com", status: "envoyee", scheduledFor: "2026-08-28", sentAt: "2026-08-28T19:40" },
    uses: [{ at: "2026-09-01", salonId: "seaplaza", amountFcfa: 20_000, label: "Perfect Manucure russe gel" }],
  },
  {
    id: "gc-4980", code: "BC-2026-4980", format: "digitale", kind: "montant", amountFcfa: 40_000,
    purchasedAt: "2026-08-20", soldAt: "en-ligne",
    buyer: { clientId: "c14", name: "Yacine Wade" },
    recipient: { clientId: "c03", name: "Coumba Thiam", phone: "+221 76 554 21 90" },
    message: "Merci pour tout, tu le mérites.",
    digital: { channel: "whatsapp", to: "+221 76 554 21 90", status: "envoyee", scheduledFor: "2026-08-20", sentAt: "2026-08-20T09:15" },
    uses: [],
  },
  {
    id: "gc-4471", code: "BC-2026-4471", format: "digitale", kind: "montant", amountFcfa: 50_000,
    purchasedAt: "2026-07-14", soldAt: "en-ligne",
    buyer: { clientId: null, name: "Moussa Sarr", phone: "+221 77 630 11 45" },
    recipient: { clientId: "c01", name: "Awa Sarr", email: "awa.sarr@example.com" },
    message: "Pour nos 10 ans de mariage.",
    digital: { channel: "email", to: "awa.sarr@example.com", status: "envoyee", scheduledFor: "2026-07-14", sentAt: "2026-07-14T20:31" },
    uses: [{ at: "2026-08-10", salonId: "almadies", amountFcfa: 25_000, label: "Soin complet" }],
  },
  {
    id: "gc-4302", code: "BC-2026-4302", format: "digitale", kind: "montant", amountFcfa: 20_000,
    purchasedAt: "2026-06-30", soldAt: "en-ligne",
    buyer: { clientId: "c02", name: "Fatou Camara" },
    recipient: { clientId: "c05", name: "Mariam Kane", email: "mariam.kane@example.com" },
    digital: { channel: "email", to: "mariam.kane@example.com", status: "envoyee", scheduledFor: "2026-06-30", sentAt: "2026-06-30T12:05" },
    uses: [
      { at: "2026-07-11", salonId: "seaplaza", amountFcfa: 12_000, label: "Shampoing brushing" },
      { at: "2026-08-22", salonId: "seaplaza", amountFcfa: 8_000, label: "Manucure Spa Express" },
    ],
  },
  {
    id: "gc-2210", code: "BC-2025-2210", format: "digitale", kind: "montant", amountFcfa: 15_000,
    purchasedAt: "2025-08-15", soldAt: "en-ligne",
    buyer: { clientId: "c06", name: "Awa Niang" },
    recipient: { clientId: null, name: "Aïssatou Ba", phone: "+221 78 220 64 17" },
    digital: { channel: "whatsapp", to: "+221 78 220 64 17", status: "envoyee", scheduledFor: "2025-08-15", sentAt: "2025-08-15T10:12" },
    uses: [],
  },

  // — Physiques —
  {
    id: "gc-5138", code: "BC-2026-5138", format: "physique", kind: "montant", amountFcfa: 25_000,
    purchasedAt: "2026-09-03", soldAt: "seaplaza",
    buyer: { clientId: "c07", name: "Adama Sarr" },
    recipient: { clientId: "c09", name: "Nafi Camara" },
    message: "Félicitations pour ton diplôme !",
    physical: { mode: "retrait", salonId: "seaplaza", step: "a-preparer" },
    uses: [],
  },
  {
    id: "gc-5127", code: "BC-2026-5127", format: "physique", kind: "prestations", amountFcfa: 109_000,
    prestationIds: ["soin-du-visage-glow-me-facial", "spa-relax-me-time"],
    purchasedAt: "2026-09-02", soldAt: "en-ligne",
    buyer: { clientId: "c06", name: "Awa Niang" },
    recipient: { clientId: null, name: "Fatima Diallo", phone: "+221 77 905 33 12" },
    message: "Bienvenue à Dakar ! On se voit vite.",
    physical: {
      mode: "livraison", zone: "Mermoz", address: "Rue MZ-84, villa 12", feeFcfa: 2_000,
      step: "a-preparer",
    },
    uses: [],
  },
  {
    id: "gc-5089", code: "BC-2026-5089", format: "physique", kind: "montant", amountFcfa: 35_000,
    purchasedAt: "2026-09-01", soldAt: "en-ligne",
    buyer: { clientId: "c13", name: "Bineta Cissé" },
    recipient: { clientId: "c16", name: "Penda Ndoye", phone: "+221 76 118 47 02" },
    physical: {
      mode: "livraison", zone: "Ngor", address: "Village de Ngor, en face de la mosquée", feeFcfa: 1_500,
      step: "prete", readyAt: "2026-09-02",
    },
    uses: [],
  },
  {
    id: "gc-5102", code: "BC-2026-5102", format: "physique", kind: "montant", amountFcfa: 100_000,
    purchasedAt: "2026-08-30", soldAt: "almadies",
    buyer: { clientId: "c15", name: "Dieynaba Kane" },
    recipient: { clientId: null, name: "Seynabou Kane" },
    message: "Pour ton mariage, le grand jour approche !",
    physical: { mode: "retrait", salonId: "almadies", step: "prete", readyAt: "2026-08-31" },
    uses: [],
  },
  {
    id: "gc-4890", code: "BC-2026-4890", format: "physique", kind: "montant", amountFcfa: 60_000,
    purchasedAt: "2026-08-14", soldAt: "en-ligne",
    buyer: { clientId: "c03", name: "Coumba Thiam" },
    recipient: { clientId: null, name: "Marième Faye", phone: "+221 77 341 90 28" },
    physical: {
      mode: "livraison", zone: "Ouakam", address: "Cité Avion, villa 47", feeFcfa: 2_000,
      step: "remise", readyAt: "2026-08-16", handedAt: "2026-08-18",
    },
    uses: [],
  },
  {
    id: "gc-1180", code: "BC-2026-1180", format: "physique", kind: "montant", amountFcfa: 30_000,
    purchasedAt: "2026-07-28", soldAt: "almadies",
    buyer: { clientId: null, name: "Moussa Diagne", phone: "+221 77 508 62 19" },
    recipient: { clientId: "c04", name: "Bineta Diagne" },
    physical: { mode: "retrait", salonId: "almadies", step: "remise", readyAt: "2026-07-29", handedAt: "2026-08-05" },
    uses: [{ at: "2026-08-19", salonId: "almadies", amountFcfa: 15_000, label: "Shampoing séchage + Manucure Spa Express" }],
  },
  {
    id: "gc-4655", code: "BC-2026-4655", format: "physique", kind: "prestations", amountFcfa: 75_000,
    prestationIds: ["manucure-pedicure-luxury-perfect-manucure-spa", "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage"],
    purchasedAt: "2026-07-15", soldAt: "seaplaza",
    buyer: { clientId: "c08", name: "Ndèye Diop" },
    recipient: { clientId: "c06", name: "Awa Niang" },
    physical: { mode: "retrait", salonId: "seaplaza", step: "remise", readyAt: "2026-07-16", handedAt: "2026-07-20" },
    uses: [
      {
        at: "2026-08-02", salonId: "seaplaza", amountFcfa: 32_000, label: "Luxury Perfect Manucure Spa",
        prestationId: "manucure-pedicure-luxury-perfect-manucure-spa",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Dérivés                                                             */
/* ------------------------------------------------------------------ */

export const usedAmount = (c: GiftCard) => c.uses.reduce((n, u) => n + u.amountFcfa, 0);
export const balanceOf = (c: GiftCard) => Math.max(0, c.amountFcfa - usedAmount(c));

const prestationName = (id: string) => prestationSeeds.find((p) => p.id === id)?.name ?? id;

/** Carte prestations : ce qu'elle offre, avec ce qui a déjà été honoré. */
export function giftCardPrestations(c: GiftCard): { id: string; name: string; used: boolean }[] {
  const used = new Set(c.uses.map((u) => u.prestationId).filter(Boolean));
  return (c.prestationIds ?? []).map((id) => ({ id, name: prestationName(id), used: used.has(id) }));
}

/** Ce que la carte offre, en une ligne : « 50.000 FCFA » ou « Glow Me Facial · Relax Me Time ». */
export const giftCardContentLabel = (c: GiftCard, fcfaFmt: (n: number) => string) =>
  c.kind === "montant" ? fcfaFmt(c.amountFcfa) : giftCardPrestations(c).map((p) => p.name).join(" · ");

export function expiresAt(c: GiftCard): string {
  const [y, m, d] = c.purchasedAt.split("-").map(Number);
  return `${y + VALIDITY_MONTHS / 12}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const isExpired = (c: GiftCard, today: string) => expiresAt(c) < today;

// Où se range une carte dans le suivi de son format.
export type GiftCardBucket =
  | "echec" // digitale : l'envoi n'est pas parti
  | "a-preparer" // physique
  | "prete" // physique : attend d'être retirée / livrée
  | "programmee" // digitale : partira à la date choisie
  | "en-circulation"
  | "terminee"; // épuisée ou expirée

export function bucketOf(c: GiftCard, today: string): GiftCardBucket {
  if (c.format === "digitale") {
    if (c.digital.status === "echec") return "echec";
    if (c.digital.status === "programmee") return "programmee";
  } else {
    if (c.physical.step === "a-preparer") return "a-preparer";
    if (c.physical.step === "prete") return "prete";
  }
  if (balanceOf(c) === 0 || isExpired(c, today)) return "terminee";
  return "en-circulation";
}

export const needsAction = (b: GiftCardBucket) => b === "echec" || b === "a-preparer" || b === "prete";

// Solde encore dû aux bénéficiaires (cartes non expirées).
export const outstanding = (cards: GiftCard[], today: string) =>
  cards.filter((c) => !isExpired(c, today)).reduce((n, c) => n + balanceOf(c), 0);

export const CHANNEL_LABELS: Record<DigitalSend["channel"], string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
};

// « 2026-09-03T11:02 » → « 3 sept. à 11:02 ».
const SHORT_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export function frDayShort(iso: string, withYear = false) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)} ${SHORT_MONTHS[Number(m) - 1]}${withYear ? ` ${y}` : ""}`;
}
export const frStamp = (isoDateTime: string) =>
  `${frDayShort(isoDateTime)} à ${isoDateTime.slice(11, 16)}`;

export const nowStamp = (todayIso: string, time: string) => `${todayIso}T${time}`;

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const digits = (s: string) => s.replace(/\D/g, "");

/** Recherche (comme point-de-vente) : nom, n° de carte, prestation ou téléphone — e-mail en plus. */
export function giftCardMatches(c: GiftCard, query: string) {
  const q = fold(query.trim());
  if (!q) return true;
  const text = [
    c.code,
    c.buyer.name,
    c.recipient.name,
    c.recipient.email ?? "",
    c.buyer.email ?? "",
    ...giftCardPrestations(c).map((p) => p.name),
  ].map(fold);
  if (text.some((t) => t.includes(q))) return true;
  const qd = digits(q);
  if (qd.length < 3) return false;
  return [c.buyer.phone, c.recipient.phone, c.format === "digitale" ? c.digital.to : ""]
    .map((p) => digits(p ?? ""))
    .some((p) => p.includes(qd));
}
