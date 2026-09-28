// Données fictives « RH » — demandes déposées par les collaboratrices.
// Front-end uniquement, aucune API, aucune persistance.
// Volontairement indépendant du barrel `@/lib/mock` : importer directement
// `@/lib/mock/rh` (comme `staff.ts` / `rendezvous.ts` / `planning.ts`).
//
// La propriétaire est EN PILOTAGE sur l'équipe : elle ne pose pas les congés ni
// les avances à la place des collaboratrices, elle TRANCHE les demandes qu'elles
// déposent depuis leur espace. Ce module porte ces demandes, leur historique de
// décision, et sait les présenter comme des notifications.
//
// Deux natures de demande, volontairement les seules pour l'instant :
//   - « avance » : une avance sur salaire, un montant en FCFA ;
//   - « conge »  : une absence posée à l'avance, une plage de dates.
//
// L' acceptation d'un congé n'est PAS synchronisée avec l'état de l'écran
// Planning : ce projet n'a aucun état global partagé entre écrans (cf. CLAUDE.md).
// L'écran Équipe se contente d'inviter la propriétaire à vérifier la couverture
// dans Planning après coup.

import { fcfa } from "./beautyandco";
import { fullName, memberById } from "./staff";
import type { AppNotification } from "./notifications";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type StaffRequestKind = "avance" | "conge";

export type StaffRequestStatus = "en_attente" | "acceptee" | "refusee";

export type StaffRequest = {
  id: string;
  memberId: string;
  kind: StaffRequestKind;
  status: StaffRequestStatus;
  submittedAt: string; // ISO 8601 — dépôt de la demande (monde mock, sept. 2026)
  decidedAt?: string; // ISO 8601 — posé à la décision, seule heure « réelle » tolérée
  amountFcfa?: number; // demande d'avance
  from?: string; // congé — ISO yyyy-mm-dd, borne incluse
  to?: string; // congé — ISO yyyy-mm-dd, borne incluse
  note?: string; // le mot de la collaboratrice
};

export const STAFF_REQUEST_LABELS: Record<StaffRequestKind, string> = {
  avance: "Avance de salaire",
  conge: "Congé",
};

export const STAFF_REQUEST_STATUS_LABELS: Record<StaffRequestStatus, string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

/* ------------------------------------------------------------------ */
/* Seeds — membres réels de staff.ts, monde ancré au 2026-09-03        */
/* ------------------------------------------------------------------ */

export const staffRequests: StaffRequest[] = [
  // --- en attente : ce que la propriétaire doit trancher ---------------
  {
    id: "rq-henry-avance",
    memberId: "m-henry",
    kind: "avance",
    status: "en_attente",
    submittedAt: "2026-09-01T09:12:00",
    amountFcfa: 50_000,
    note: "Frais de rentrée scolaire pour mes deux enfants, je rembourse sur septembre et octobre.",
  },
  {
    id: "rq-adja-conge",
    memberId: "m-adja",
    kind: "conge",
    status: "en_attente",
    submittedAt: "2026-09-02T18:40:00",
    from: "2026-09-15",
    to: "2026-09-17",
    note: "Mariage de ma sœur à Thiès, je serai absente du lundi au mercredi.",
  },

  // --- déjà tranchées : l'historique de chaque fiche -------------------
  {
    id: "rq-henry-conge-juin",
    memberId: "m-henry",
    kind: "conge",
    status: "acceptee",
    submittedAt: "2026-05-20T11:00:00",
    decidedAt: "2026-05-21T08:30:00",
    from: "2026-06-02",
    to: "2026-06-06",
  },
  {
    id: "rq-michelle-avance",
    memberId: "m-michelle",
    kind: "avance",
    status: "acceptee",
    submittedAt: "2026-08-19T10:05:00",
    decidedAt: "2026-08-20T09:15:00",
    amountFcfa: 30_000,
    note: "Réparation de ma moto, indispensable pour venir au salon.",
  },
  {
    id: "rq-gnagna-conge",
    memberId: "m-gnagna",
    kind: "conge",
    status: "refusee",
    submittedAt: "2026-08-04T16:20:00",
    decidedAt: "2026-08-06T18:00:00",
    from: "2026-08-25",
    to: "2026-08-30",
    note: "Voyage en famille au village.",
  },
  {
    id: "rq-ndiole-avance",
    memberId: "m-ndiole",
    kind: "avance",
    status: "acceptee",
    submittedAt: "2026-07-14T09:40:00",
    decidedAt: "2026-07-15T08:50:00",
    amountFcfa: 25_000,
  },
];

/* ------------------------------------------------------------------ */
/* Format                                                             */
/* ------------------------------------------------------------------ */

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// Nombre de jours d'un congé, bornes incluses.
export const leaveDays = (from: string, to: string): number => {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
};

// « 15–17 sept. » (même mois) · « 30 sept. – 2 oct. » (mois différents) · « 4 oct. » (un jour).
export const leaveRange = (from: string, to: string): string => {
  const [, fm, fd] = from.split("-").map(Number);
  const [, tm, td] = to.split("-").map(Number);
  if (from === to) return `${fd} ${MONTHS_SHORT[fm - 1]}`;
  if (fm === tm) return `${fd}–${td} ${MONTHS_SHORT[tm - 1]}`;
  return `${fd} ${MONTHS_SHORT[fm - 1]} – ${td} ${MONTHS_SHORT[tm - 1]}`;
};

// Résumé court d'une demande, sans le nom de la personne.
//   avance → « 50.000 FCFA »
//   congé  → « 3 jours, 15–17 sept. »
export const requestSummary = (r: StaffRequest): string => {
  if (r.kind === "avance") return fcfa(r.amountFcfa ?? 0);
  if (r.from && r.to) {
    const d = leaveDays(r.from, r.to);
    return `${d} jour${d > 1 ? "s" : ""}, ${leaveRange(r.from, r.to)}`;
  }
  return "dates à préciser";
};

// Titre lisible d'une demande (aussi utilisé pour les notifications).
export const requestTitle = (kind: StaffRequestKind): string =>
  kind === "avance" ? "Demande d'avance de salaire" : "Demande de congé";

/* ------------------------------------------------------------------ */
/* Dérivés — tolérants à une liste tenue en état de session           */
/* ------------------------------------------------------------------ */

// Les écrans éditent `staffRequests` en mémoire de session ; ils passent alors
// leur propre liste. Par défaut, les seeds.
export const requestsForMember = (
  memberId: string,
  list: StaffRequest[] = staffRequests,
): StaffRequest[] =>
  list
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

export const pendingRequestsForMember = (
  memberId: string,
  list: StaffRequest[] = staffRequests,
): StaffRequest[] =>
  requestsForMember(memberId, list).filter((r) => r.status === "en_attente");

// Nombre de demandes en attente, éventuellement restreint à un ensemble de
// membres (une pastille par ligne dans la liste Équipe).
export const pendingRequestCount = (
  memberIds?: string[],
  list: StaffRequest[] = staffRequests,
): number =>
  list.filter(
    (r) =>
      r.status === "en_attente" && (!memberIds || memberIds.includes(r.memberId)),
  ).length;

/* ------------------------------------------------------------------ */
/* Notifications — une entrée par demande EN ATTENTE                   */
/* ------------------------------------------------------------------ */

// Consommé par `src/context/NotificationsContext.tsx` :
//   [...notifications, ...requestNotifications(staffRequests)]
// On n'importe que le type `AppNotification` de `./notifications` — la concat se
// fait côté contexte, jamais ici (sinon cycle d'imports).
export const requestNotifications = (
  list: StaffRequest[] = staffRequests,
): AppNotification[] =>
  list
    .filter((r) => r.status === "en_attente")
    .map((r) => {
      const member = memberById(r.memberId);
      const who = member ? fullName(member) : "Collaboratrice";
      return {
        id: `notif-${r.id}`,
        category: "equipe",
        title: requestTitle(r.kind),
        body: `${who} — ${requestSummary(r)}`,
        date: r.submittedAt,
        read: false,
        tone: "warning",
        href: `/equipe?membre=${r.memberId}`,
      } satisfies AppNotification;
    });

export const newRequestId = () => `rq-${Date.now().toString(36)}`;
