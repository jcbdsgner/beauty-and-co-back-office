// Données fictives « Remises » — front-end uniquement. Une remise est accordée
// à la caisse au moment de l'encaissement d'un rendez-vous ; la propriétaire en
// est avertie sur le tableau de bord (« À régler aujourd'hui »).
//
// Indépendant du barrel : importer directement `@/lib/mock/remises`. N'importe
// que le type `AppNotification` (la concaténation se fait dans
// `NotificationsContext`, comme les demandes RH). Cliente et auteur sont
// dénormalisés, comme dans `journal.ts` : une remise reste lisible même si la
// fiche change.

import type { SalonId } from "./beautyandco";
import type { AppNotification } from "./notifications";

export type Remise = {
  id: string;
  at: string; // ISO — moment de l'encaissement
  salonId: SalonId;
  rdvId: string; // id de `@/lib/mock/rendezvous`
  clientId: string; // id de `@/lib/mock/beautyandco::clients()`
  clientName: string;
  cashierId: string; // id de `@/lib/mock/staff`
  cashierName: string;
  amountFcfa: number;
  reason: string;
};

export const remises: Remise[] = [
  {
    id: "rem-0412",
    at: "2026-09-03T12:50:00",
    salonId: "almadies",
    rdvId: "RV-1787678400000-2z95rx39g",
    clientId: "c02",
    clientName: "Fatou Camara",
    cashierId: "m-ndiole",
    cashierName: "Ndiole",
    amountFcfa: 5000,
    reason: "Prise en charge avec 30 minutes de retard",
  },
  {
    id: "rem-0411",
    at: "2026-09-03T12:15:00",
    salonId: "seaplaza",
    rdvId: "RV-1787667600000-0qtafz9td",
    clientId: "c11",
    clientName: "Sokhna Ndiaye",
    cashierId: "m-rokhaya",
    cashierName: "Rokhaya Diallo",
    amountFcfa: 7000,
    reason: "Mèches apportées par la cliente",
  },
];

export const remiseById = (id: string) => remises.find((r) => r.id === id);

export const remiseNotificationId = (id: string) => `notif-remise-${id}`;

export function remiseNotifications(list: Remise[] = remises): AppNotification[] {
  return list.map((r) => ({
    id: remiseNotificationId(r.id),
    category: "paiement",
    tone: "warning",
    title: "Remise accordée",
    body: `${r.clientName} — ${r.reason}`,
    date: r.at,
    read: false,
    href: `/rendez-vous/${r.rdvId}`,
  }));
}
