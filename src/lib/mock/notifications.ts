// Données fictives « Notifications » — front-end uniquement, aucune API, aucune
// persistance. Volontairement indépendant du barrel `@/lib/mock` : importer
// directement ce fichier (`@/lib/mock/notifications`), comme `rendezvous.ts` /
// `staff.ts`.
//
// Ce module ne connaît que les notifications « système » (rendez-vous, paiement,
// stock, avis). Les demandes de l'équipe (avance, congé) sont produites par
// `@/lib/mock/rh` (`requestNotifications`) et concaténées côté contexte
// (`src/context/NotificationsContext.tsx`) — jamais ici, pour éviter un cycle
// d'imports.

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationCategory =
  | "rendez-vous"
  | "paiement"
  | "stock"
  | "avis"
  | "equipe";

// `category` = taxonomie (d'où vient la notif) ; `tone` = présentation. Une
// annulation reste dans la catégorie « rendez-vous » mais porte un ton
// « warning ».
export type NotificationTone = "info" | "success" | "warning" | "error";

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string; // « Demande de congé »
  body: string; // « Coumba Faye — 3 jours, 15–17 sept. »
  date: string; // ISO 8601 (monde mock ancré au 2026-09-03)
  read: boolean;
  tone: NotificationTone;
  href: string; // destination existante, JAMAIS vide
};

/* ------------------------------------------------------------------ */
/* Libellés                                                           */
/* ------------------------------------------------------------------ */

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  "rendez-vous": "Rendez-vous",
  paiement: "Paiements",
  stock: "Stock",
  avis: "Avis clients",
  equipe: "Équipe",
};

// Pastille de couleur par ton — repris du motif déjà utilisé dans le header.
export const TONE_DOT: Record<NotificationTone, string> = {
  info: "bg-blue-light-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};

/* ------------------------------------------------------------------ */
/* Seeds — cohérents avec les fixtures beautyandco / rendezvous / stock */
/* Chaque href pointe vers un id qui existe réellement :               */
/*   rdv-2409, rdv-2375, rdv-2410 ∈ SEEDS de rendezvous.ts             */
/*   p-majirel ∈ productStock de stock.ts                              */
/* ------------------------------------------------------------------ */

export const notifications: AppNotification[] = [
  {
    id: "notif-rdv-2409",
    category: "rendez-vous",
    title: "Nouveau rendez-vous en ligne",
    body: "Sokhna Mbaye — Pose vernis semi-permanent, Sea Plaza · aujourd'hui à 15:00",
    date: "2026-09-03T08:12:00",
    read: false,
    tone: "info",
    href: "/rendez-vous/rdv-2409",
  },
  {
    id: "notif-paiement-2410",
    category: "paiement",
    title: "Paiement encaissé",
    body: "Fatou Ndiaye — 45.000 FCFA · Almadies",
    date: "2026-09-03T07:40:00",
    read: false,
    tone: "success",
    href: "/rendez-vous/rdv-2410",
  },
  {
    id: "notif-stock-majirel",
    category: "stock",
    title: "Stock bas",
    body: "Teinture Majirel 6.0 — 4 unités en stock, sous le seuil de réapprovisionnement",
    date: "2026-09-02T17:05:00",
    read: false,
    tone: "warning",
    href: "/stock?produit=p-majirel",
  },
  {
    id: "notif-rdv-2375",
    category: "rendez-vous",
    title: "Rendez-vous annulé",
    body: "Nafi Camara a annulé sa coloration complète (Almadies) moins de 24 h avant",
    date: "2026-09-02T09:30:00",
    read: true,
    tone: "warning",
    href: "/rendez-vous/rdv-2375",
  },
  {
    id: "notif-avis-yacine",
    category: "avis",
    title: "Nouvel avis client",
    body: "Yacine Thiam — 5/5, Sea Plaza : « Rien à redire. »",
    date: "2026-09-01T18:20:00",
    read: true,
    tone: "success",
    href: "/satisfaction",
  },
];

/* ------------------------------------------------------------------ */
/* Dérivés                                                            */
/* ------------------------------------------------------------------ */

export const unreadCount = (list: AppNotification[]): number =>
  list.reduce((n, item) => (item.read ? n : n + 1), 0);

// Repère « aujourd'hui » figé, cohérent avec beautyandco (« mardi 3 septembre »).
const TODAY_ISO = "2026-09-03";
const DAY_MS = 86_400_000;

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// « Aujourd'hui » / « Hier » / « 1 sept. » (sans année : les notifs sont récentes).
function dayLabel(iso: string): string {
  const day = iso.slice(0, 10);
  if (day === TODAY_ISO) return "Aujourd'hui";
  const diff = Math.round(
    (new Date(`${TODAY_ISO}T12:00:00`).getTime() - new Date(`${day}T12:00:00`).getTime()) / DAY_MS,
  );
  if (diff === 1) return "Hier";
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

// Liste chronologique (plus récent d'abord) découpée en tranches de jour, l'ordre
// des tranches suivant l'ordre des notifications.
export function groupByDay(
  list: AppNotification[],
): { label: string; items: AppNotification[] }[] {
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const item of sorted) {
    const label = dayLabel(item.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
