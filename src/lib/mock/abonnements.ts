// Données fictives — instances d'abonnements et de packs vendus, + toute la
// logique métier « cycle / échéance / consommation » du spec b&co
// (docs/backoffice-spec.md). Front-end uniquement : aucune API, aucun PSP,
// aucun paiement récurrent réel — l'écran /fidelite crée et fait évoluer ces
// objets en mémoire de session. Indépendant du barrel `@/lib/mock` : importer
// directement `@/lib/mock/abonnements`.
//
// Vocabulaire contractuel :
//   Souscription = l'action de s'engager sur un Forfait.
//   Abonnement   = l'engagement qui en résulte (instance ci-dessous).
//   Révoquer     = y mettre fin, à l'initiative du souscripteur.
//   Bénéficiaire = personne qui profite du forfait si ≠ souscripteur — PAS un
//                  rôle, juste un bloc de coordonnées optionnel sur l'abonnement.
//   PackPurchase = un pack acheté ; son stock de prestations se vide
//                  définitivement et n'expire jamais.
//
// Hors périmètre de ce squelette front-end : vraie auth, vrai paiement récurrent,
// parcours de souscription en ligne et dialogs d'upsell, groupement panier —
// tout ça vit côté site client. Le back-office garde son propre modèle d'acompte
// (`@/lib/mock/paiement`), on n'importe pas le `DEPOSIT_AMOUNT` du spec.

import {
  getPackPrestations,
  packSeeds,
  type Pack,
} from "./packs";
import { forfaitSeeds, type Forfait } from "./forfaits";
import { clients, groupThousands, type Kpi } from "./beautyandco";

/* ------------------------------------------------------------------ Types */

// ContactInfo simplifié (comme `@/lib/mock/compte` — pas de `phoneCountry` /
// `whatsappSameAsPhone`). `sex: ""` toléré : une souscription faite en étant
// connecté ne collecte pas le genre (spec §2.4).
export type Contact = {
  firstName: string;
  lastName: string;
  sex: "femme" | "homme" | "";
  email: string;
  phone: string;
  whatsapp: string;
};

export type Abonnement = {
  id: string;
  forfaitId: string;
  clientId: string | null; // rattachement à une cliente du fichier, si connue
  subscriber: Contact; // identité propriétaire : retrouve / paie / révoque
  beneficiary: Contact | null; // null = pour le souscripteur lui-même
  subscribedAt: string; // ISO
  lastPaidAt: string; // ISO — point de départ du calcul d'échéance
  revokedAt: string | null; // ISO si révoqué
  redeemedPrestationIds: string[]; // prestations déjà consommées CE cycle
};

export type PackPurchase = {
  id: string;
  packId: string;
  clientId: string | null;
  buyer: Contact;
  purchasedAt: string; // ISO
  redeemedPrestationIds: string[]; // DÉFINITIF — ne se réinitialise jamais
};

export const BLANK_CONTACT: Contact = {
  firstName: "",
  lastName: "",
  sex: "",
  email: "",
  phone: "",
  whatsapp: "",
};

/* ------------------------------------------------------------- Contact utils */

export const contactName = (c: Contact) =>
  `${c.firstName} ${c.lastName}`.trim() || "—";

export const contactInitials = (c: Contact) =>
  `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase() || "—";

export const contactSexLabel = (s: Contact["sex"]) =>
  s === "homme" ? "Homme" : s === "femme" ? "Femme" : "Non précisé";

export const contactValid = (c: Contact) =>
  c.firstName.trim().length > 0 &&
  c.lastName.trim().length > 0 &&
  /.+@.+\..+/.test(c.email.trim()) &&
  c.phone.trim().length > 0;

/* -------------------------------------------------------------- Dates utils */

const DAY_MS = 86_400_000;

// Toutes les dates de cette couche sont au format « yyyy-mm-dd » (comme le reste
// des fixtures) : les helpers d'affichage `frLongDate` / `frShortDate` de
// `beautyandco` découpent sur « - ».
const toDateOnly = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
export const todayIso = () => toDateOnly(new Date());
const addDaysIso = (iso: string, n: number) =>
  toDateOnly(new Date(new Date(iso).getTime() + n * DAY_MS));
const nowIso = () => todayIso();

/* ---------------------------------------------------- Cycle & statut (§3.3) */

export const computeNextDueDate = (ab: Abonnement, cycleDays: number) =>
  addDaysIso(ab.lastPaidAt, cycleDays);

export const isPaymentDue = (
  ab: Abonnement,
  cycleDays: number,
  now: Date = new Date(),
) => new Date(computeNextDueDate(ab, cycleDays)).getTime() <= now.getTime();

export type AbonnementStatus = "revoked" | "due" | "current";

export const abonnementStatus = (
  ab: Abonnement,
  cycleDays: number,
  now: Date = new Date(),
): AbonnementStatus => {
  if (ab.revokedAt != null) return "revoked";
  return isPaymentDue(ab, cycleDays, now) ? "due" : "current";
};

export const ABONNEMENT_STATUS_META: Record<
  AbonnementStatus,
  { label: string; tone: "success" | "error" | "light" }
> = {
  current: { label: "À jour", tone: "success" },
  due: { label: "À régler", tone: "error" },
  revoked: { label: "Révoqué", tone: "light" },
};

/* -------------------------------------------------------- Paiement (§3.4) */

export const MIN_CYCLES = 1;
export const MAX_CYCLES = 12;

// Montant dû pour régler N cycles d'un coup.
export const amountDueForCycles = (forfait: Forfait, cycles: number) =>
  forfait.priceFcfa * Math.max(1, cycles);

// Aperçu avant paiement : prochaine échéance si on règle `cycles` maintenant.
export const estimatePrepaidDueDate = (
  cycles: number,
  cycleDays: number,
  from: Date = new Date(),
) => addDaysIso(from.toISOString(), Math.max(1, cycles) * cycleDays);

// Encaissement d'une échéance (ou prépaiement de N cycles) :
//  1. redeemedPrestationIds remis à [] → toutes les prestations redeviennent
//     disponibles pour le nouveau cycle.
//  2. lastPaidAt = now + (cycles - 1) * cycleDays → `computeNextDueDate`
//     (qui n'ajoute qu'un cycleDays) tombe bien à now + cycles * cycleDays.
export const markAbonnementPaid = (
  ab: Abonnement,
  cycleDays: number,
  cycles = 1,
  now: Date = new Date(),
): Abonnement => ({
  ...ab,
  redeemedPrestationIds: [],
  lastPaidAt: addDaysIso(now.toISOString(), (Math.max(1, cycles) - 1) * cycleDays),
});

/* ------------------------------------------------------ Révocation (§3.5) */

export const revokeAbonnement = (
  ab: Abonnement,
  now: Date = new Date(),
): Abonnement => ({ ...ab, revokedAt: toDateOnly(now) });

/* --------------------------------------------- Consommation « redeem » (§3.6) */

// Une prestation est disponible si elle est dans la définition ET pas déjà
// consommée sur l'instance.
export const availablePrestationIds = (
  definitionIds: string[],
  redeemed: string[],
) => definitionIds.filter((id) => !redeemed.includes(id));

export const isPrestationAvailable = (
  id: string,
  definitionIds: string[],
  redeemed: string[],
) => definitionIds.includes(id) && !redeemed.includes(id);

// Consommation — n'a lieu qu'à la confirmation d'une réservation (spec §3.6).
export const redeemPrestations = <T extends { redeemedPrestationIds: string[] }>(
  instance: T,
  ids: string[],
): T => ({
  ...instance,
  redeemedPrestationIds: [
    ...new Set([...instance.redeemedPrestationIds, ...ids]),
  ],
});

export const packRemainingIds = (purchase: PackPurchase, pack: Pack) =>
  availablePrestationIds(pack.prestationIds, purchase.redeemedPrestationIds);

export const packFullyUsed = (purchase: PackPurchase, pack: Pack) =>
  packRemainingIds(purchase, pack).length === 0;

/* --------------------------------------------------------- Reporting (§4.8) */

export const activeAbonnements = (abonnements: Abonnement[]) =>
  abonnements.filter((a) => a.revokedAt == null);

// Revenu récurrent normalisé sur 30 jours : Σ (prix * 30 / cycleDays) sur les
// abonnements non révoqués.
export const recurringRevenue = (
  abonnements: Abonnement[],
  forfaits: Forfait[],
) =>
  abonnements.reduce((sum, ab) => {
    if (ab.revokedAt != null) return sum;
    const f = forfaits.find((x) => x.id === ab.forfaitId);
    if (!f || f.cycleDays <= 0) return sum;
    return sum + (f.priceFcfa * 30) / f.cycleDays;
  }, 0);

export const overdueAbonnements = (
  abonnements: Abonnement[],
  forfaits: Forfait[],
  now: Date = new Date(),
) =>
  abonnements.filter((ab) => {
    const f = forfaits.find((x) => x.id === ab.forfaitId);
    return f ? abonnementStatus(ab, f.cycleDays, now) === "due" : false;
  });

export const revocationRate = (abonnements: Abonnement[]) =>
  abonnements.length === 0
    ? 0
    : abonnements.filter((a) => a.revokedAt != null).length / abonnements.length;

// « Passif » : valeur à l'unité des prestations de packs achetées mais pas
// encore consommées.
export const packLiability = (purchases: PackPurchase[], packs: Pack[]) =>
  purchases.reduce((sum, pu) => {
    const pack = packs.find((p) => p.id === pu.packId);
    if (!pack) return sum;
    const prices = getPackPrestations(pack);
    return (
      sum +
      packRemainingIds(pu, pack).reduce(
        (s, id) => s + (prices.find((x) => x.id === id)?.priceFcfa ?? 0),
        0,
      )
    );
  }, 0);

// Carte « Revenu récurrent » du tableau de bord (salon-indépendant).
export const recurringRevenueKpi = (
  abonnements: Abonnement[],
  forfaits: Forfait[],
): Kpi => {
  const n = activeAbonnements(abonnements).length;
  return {
    key: "recurring-revenue",
    label: "Revenu récurrent / 30 j",
    value: groupThousands(Math.round(recurringRevenue(abonnements, forfaits))),
    unit: "FCFA",
    direction: "flat",
    hint: `${n} abonnement${n > 1 ? "s" : ""} actif${n > 1 ? "s" : ""} · tous salons`,
  };
};

/* ------------------------------------------------------------------ Seeds */

const CLIENTS = clients("all");

const contactFromClient = (
  clientId: string,
): { clientId: string; contact: Contact } => {
  const c = CLIENTS.find((x) => x.id === clientId);
  if (!c) return { clientId, contact: BLANK_CONTACT };
  const [firstName, ...rest] = c.name.split(" ");
  return {
    clientId: c.id,
    contact: {
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      sex: c.gender,
      email: c.email,
      phone: c.phone,
      whatsapp: c.phone,
    },
  };
};

const c01 = contactFromClient("c01");
const c02 = contactFromClient("c02");
const c03 = contactFromClient("c03");
const c05 = contactFromClient("c05");
const c07 = contactFromClient("c07");
const c09 = contactFromClient("c09");
const c11 = contactFromClient("c11");
const c12 = contactFromClient("c12");
const c14 = contactFromClient("c14");

// Seeds ancrés sur la date réelle → les statuts « à jour / à régler » restent
// cohérents quelle que soit la date de consultation.
export const abonnementSeeds: Abonnement[] = [
  // c11 Sokhna Mbaye — Mains & Pieds, à jour (avantage du RDV rdv-2409).
  {
    id: "ab-c11-mains",
    forfaitId: "mains-et-pieds",
    clientId: c11.clientId,
    subscriber: c11.contact,
    beneficiary: null,
    subscribedAt: addDaysIso(nowIso(), -120),
    lastPaidAt: addDaysIso(nowIso(), -12),
    revokedAt: null,
    redeemedPrestationIds: ["onglerie-remplissage-gel"],
  },
  // c01 Awa Diop — Éclat Mensuel, prépayé (échéance loin devant).
  {
    id: "ab-c01-eclat",
    forfaitId: "eclat-mensuel",
    clientId: c01.clientId,
    subscriber: c01.contact,
    beneficiary: null,
    subscribedAt: addDaysIso(nowIso(), -80),
    lastPaidAt: addDaysIso(nowIso(), 25), // réglé 2 cycles d'avance
    revokedAt: null,
    redeemedPrestationIds: [],
  },
  // c05 Ndèye Fall — Détente Spa, à régler (échéance dépassée).
  {
    id: "ab-c05-spa",
    forfaitId: "detente-spa",
    clientId: c05.clientId,
    subscriber: c05.contact,
    beneficiary: null,
    subscribedAt: addDaysIso(nowIso(), -95),
    lastPaidAt: addDaysIso(nowIso(), -41),
    revokedAt: null,
    redeemedPrestationIds: ["spa-soin-du-dos"],
  },
  // c14 Yacine Thiam — Détente Spa pour une bénéficiaire distincte.
  {
    id: "ab-c14-spa",
    forfaitId: "detente-spa",
    clientId: c14.clientId,
    subscriber: c14.contact,
    beneficiary: {
      firstName: "Coura",
      lastName: "Thiam",
      sex: "femme",
      email: "coura.thiam@gmail.com",
      phone: "+221 77 640 22 18",
      whatsapp: "+221 77 640 22 18",
    },
    subscribedAt: addDaysIso(nowIso(), -50),
    lastPaidAt: addDaysIso(nowIso(), -8),
    revokedAt: null,
    redeemedPrestationIds: [],
  },
  // c07 Adama Sarr — Éclat Mensuel, révoqué.
  {
    id: "ab-c07-eclat",
    forfaitId: "eclat-mensuel",
    clientId: c07.clientId,
    subscriber: c07.contact,
    beneficiary: null,
    subscribedAt: addDaysIso(nowIso(), -160),
    lastPaidAt: addDaysIso(nowIso(), -22),
    revokedAt: addDaysIso(nowIso(), -6),
    redeemedPrestationIds: [],
  },
];

export const packPurchaseSeeds: PackPurchase[] = [
  // c03 Marième Sow — Éclat Express, 1/3 consommé (avantage du RDV rdv-3002).
  {
    id: "pp-c03-express",
    packId: "eclat-express",
    clientId: c03.clientId,
    buyer: c03.contact,
    purchasedAt: addDaysIso(nowIso(), -18),
    redeemedPrestationIds: ["epilation-epilation-sourcils"],
  },
  // c02 Fatou Ndiaye — Éclat Express, 2/3 consommé (avantage du RDV rdv-2410).
  {
    id: "pp-c02-express",
    packId: "eclat-express",
    clientId: c02.clientId,
    buyer: c02.contact,
    purchasedAt: addDaysIso(nowIso(), -30),
    redeemedPrestationIds: [
      "epilation-epilation-sourcils",
      "manucure-pedicure-vernis-simple-mains-classique-et-halal",
    ],
  },
  // c09 Nafi Camara — Cocooning Duo, neuf.
  {
    id: "pp-c09-cocooning",
    packId: "cocooning-duo",
    clientId: c09.clientId,
    buyer: c09.contact,
    purchasedAt: addDaysIso(nowIso(), -5),
    redeemedPrestationIds: [],
  },
  // c12 Rama Diallo — Glow Total, entièrement utilisé.
  {
    id: "pp-c12-glow",
    packId: "glow-total",
    clientId: c12.clientId,
    buyer: c12.contact,
    purchasedAt: addDaysIso(nowIso(), -70),
    redeemedPrestationIds: [
      "soin-du-visage-glow-me-facial",
      "epilation-pack-epilations-completes",
      "manucure-pedicure-manucure-russe-sans-vernis-sans-gel",
    ],
  },
];

/* ------------------------------------------------------------- Résolution */

export const forfaitById = (id: string) => forfaitSeeds.find((f) => f.id === id);
export const packById = (id: string) => packSeeds.find((p) => p.id === id);
export const abonnementById = (list: Abonnement[], id: string) =>
  list.find((a) => a.id === id);
export const packPurchaseById = (list: PackPurchase[], id: string) =>
  list.find((p) => p.id === id);

let seq = 0;
export const newAbonnementId = () => `ab-${Date.now().toString(36)}-${seq++}`;
export const newPackPurchaseId = () => `pp-${Date.now().toString(36)}-${seq++}`;
