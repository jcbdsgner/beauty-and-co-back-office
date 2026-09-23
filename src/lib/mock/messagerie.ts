// Données fictives Messagerie BeautyAndCo — front-end uniquement, aucune API,
// aucune persistance. Volontairement indépendant du barrel `@/lib/mock` :
// importer directement ce fichier (`@/lib/mock/messagerie`).

import { salonName, type SalonId } from "./beautyandco";

export { salonName };

/* ------------------------------------------------------------------ */
/* Canaux                                                              */
/* ------------------------------------------------------------------ */

export type Channel = "call" | "sms" | "whatsapp" | "chat";
export type WritableChannel = Exclude<Channel, "call">;
export type ChannelFilter = Channel | "all";

export const channelLabel: Record<Channel, string> = {
  call: "Appel",
  sms: "SMS",
  whatsapp: "WhatsApp",
  chat: "Chat",
};

export const channelFilters: { value: ChannelFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "call", label: "Appels" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "chat", label: "Chat" },
];

/* ------------------------------------------------------------------ */
/* Événements d'un fil                                                 */
/* ------------------------------------------------------------------ */

export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export const messageStatusLabel: Record<MessageStatus, string> = {
  sent: "Envoyé",
  delivered: "Distribué",
  read: "Lu",
  failed: "Échec de l'envoi",
};

export type CallEvent = {
  kind: "call";
  id: string;
  direction: "in" | "out";
  at: string; // ISO local, ex. « 2026-09-03T11:47 »
  durationSec: number; // 0 = non décroché
  outcome: "answered" | "missed";
};

export type MessageEvent = {
  kind: "message";
  id: string;
  channel: WritableChannel;
  direction: "in" | "out";
  at: string;
  text?: string;
  attachment?: { type: "image"; name: string };
  status?: MessageStatus; // sortants uniquement
};

export type ThreadEvent = CallEvent | MessageEvent;

export type Conversation = {
  id: string;
  name: string; // « » si numéro inconnu
  phone: string; // format lisible
  salon: SalonId;
  channels: Channel[]; // canaux présents dans le fil (filtres + pastille)
  events: ThreadEvent[]; // ordre chronologique croissant
  clientId?: string; // référence vers `@/lib/mock/beautyandco::clients()` si le fil est celui d'une cliente connue
};

/* ------------------------------------------------------------------ */
/* État simulé du service                                              */
/* ------------------------------------------------------------------ */

// Repère temporel figé pour la démo (cf. `today` dans beautyandco.ts).
export const NOW = new Date("2026-09-03T13:20:00");

// Panne opérateur simulée : l'envoi de SMS sortants est momentanément coupé.
// Sert à montrer le repli « Répondez par WhatsApp » dans le compositeur.
export const smsOutboundAvailable = false;

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */

export const conversations: Conversation[] = [
  {
    id: "c-awa",
    name: "Awa Diop",
    phone: "+221 77 123 45 67",
    salon: "almadies",
    clientId: "c01",
    channels: ["whatsapp", "call"],
    events: [
      { kind: "call", id: "awa-1", direction: "in", at: "2026-08-28T10:12", durationSec: 95, outcome: "answered" },
      {
        kind: "message",
        id: "awa-2",
        channel: "whatsapp",
        direction: "out",
        at: "2026-08-28T10:21",
        text: "Bonjour Awa, comme convenu je vous ai réservé la coupe & brushing samedi à 10h aux Almadies. À très vite !",
        status: "read",
      },
      {
        kind: "message",
        id: "awa-3",
        channel: "whatsapp",
        direction: "in",
        at: "2026-09-03T12:58",
        text: "Bonjour, un imprévu samedi matin : pourriez-vous décaler mon rendez-vous à 14h ? Merci beaucoup 🙏",
      },
    ],
  },
  {
    id: "c-aicha",
    name: "Aïcha Ba",
    phone: "+221 76 402 19 88",
    salon: "almadies",
    clientId: "c04",
    channels: ["sms"],
    events: [
      {
        kind: "message",
        id: "aicha-1",
        channel: "sms",
        direction: "in",
        at: "2026-09-03T09:30",
        text: "Bonjour, est-ce que vous faites la pose de cils au salon des Almadies ?",
      },
      {
        kind: "message",
        id: "aicha-2",
        channel: "sms",
        direction: "out",
        at: "2026-09-03T09:34",
        text: "Oui Aïcha, la pose de cils est disponible aux Almadies à partir de 20.000 FCFA.",
        status: "failed",
      },
    ],
  },
  {
    id: "c-inconnu",
    name: "",
    phone: "+221 78 640 11 74",
    salon: "seaplaza",
    channels: ["call"],
    events: [
      { kind: "call", id: "inc-1", direction: "in", at: "2026-09-03T09:02", durationSec: 0, outcome: "missed" },
      { kind: "call", id: "inc-2", direction: "in", at: "2026-09-03T11:47", durationSec: 0, outcome: "missed" },
    ],
  },
  {
    id: "c-sokhna",
    name: "Sokhna Mbaye",
    phone: "+221 77 401 88 52",
    salon: "seaplaza",
    channels: ["chat"],
    events: [
      {
        kind: "message",
        id: "sok-1",
        channel: "chat",
        direction: "in",
        at: "2026-09-03T10:05",
        text: "Bonjour, combien coûte un balayage sur cheveux longs à Sea Plaza ?",
      },
      {
        kind: "message",
        id: "sok-2",
        channel: "chat",
        direction: "out",
        at: "2026-09-03T10:21",
        text: "Bonjour Sokhna, le balayage démarre à 35.000 FCFA et varie selon la longueur et la densité. Souhaitez-vous que je vous réserve un diagnostic gratuit ?",
        status: "read",
      },
      {
        kind: "message",
        id: "sok-3",
        channel: "chat",
        direction: "in",
        at: "2026-09-03T10:26",
        text: "Je vais réfléchir et je reviens vers vous, merci !",
      },
    ],
  },
  {
    id: "c-marieme",
    name: "Marième Sow",
    phone: "+221 76 555 21 09",
    salon: "almadies",
    clientId: "c03",
    channels: ["whatsapp"],
    events: [
      {
        kind: "message",
        id: "mar-1",
        channel: "whatsapp",
        direction: "out",
        at: "2026-09-02T09:15",
        text: "Bonjour Marième, votre rendez-vous manucure de demain 12h aux Almadies est bien confirmé.",
        status: "read",
      },
      {
        kind: "message",
        id: "mar-2",
        channel: "whatsapp",
        direction: "in",
        at: "2026-09-02T09:40",
        text: "Parfait, merci ! Je vous envoie le modèle que je voudrais.",
      },
      {
        kind: "message",
        id: "mar-3",
        channel: "whatsapp",
        direction: "in",
        at: "2026-09-02T09:41",
        attachment: { type: "image", name: "modele-nail-art.jpg" },
      },
    ],
  },
  {
    id: "c-fatou",
    name: "Fatou Ndiaye",
    phone: "+221 77 908 33 21",
    salon: "seaplaza",
    channels: ["sms", "call"],
    events: [
      {
        kind: "message",
        id: "fat-1",
        channel: "sms",
        direction: "out",
        at: "2026-09-01T08:00",
        text: "BeautyAndCo — rappel : coloration le 2 sept. à 10h30, Sea Plaza. Répondez OUI pour confirmer.",
        status: "delivered",
      },
      { kind: "message", id: "fat-2", channel: "sms", direction: "in", at: "2026-09-01T08:12", text: "OUI" },
      { kind: "call", id: "fat-3", direction: "out", at: "2026-09-01T16:05", durationSec: 42, outcome: "answered" },
    ],
  },
  {
    id: "c-ndeye",
    name: "Ndèye Fall",
    phone: "+221 76 220 47 63",
    salon: "almadies",
    channels: ["call", "whatsapp"],
    events: [
      { kind: "call", id: "nde-1", direction: "in", at: "2026-08-30T16:30", durationSec: 205, outcome: "answered" },
      {
        kind: "message",
        id: "nde-2",
        channel: "whatsapp",
        direction: "out",
        at: "2026-08-30T16:48",
        text: "Bonjour Ndèye, suite à votre appel je vous ai réservé le balayage samedi à 15h30. Belle journée !",
        status: "read",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Dérivés d'une conversation                                          */
/* ------------------------------------------------------------------ */

export const displayName = (c: Conversation) => c.name || "Numéro inconnu";

export const initials = (name: string) =>
  name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("")
    : "?";

// Fil rattaché à une cliente connue — aligné sur `conversationByClientId` de
// point-de-vente (`lib/data/conversations.ts`) : lien fiche cliente → messagerie,
// absent jusqu'ici côté back-office (audit de parité 2026-09-22).
export const conversationByClientId = (clientId: string): Conversation | undefined =>
  conversations.find((c) => c.clientId === clientId);

export const lastEvent = (c: Conversation) => c.events[c.events.length - 1];

export const lastChannelOf = (c: Conversation): Channel => {
  const e = lastEvent(c);
  return e.kind === "call" ? "call" : e.channel;
};

export const writableChannels = (c: Conversation): WritableChannel[] =>
  c.channels.filter((ch): ch is WritableChannel => ch !== "call");

// Dernier message entrant sans réponse → la conversation attend une action.
export const needsReply = (c: Conversation) => {
  const e = lastEvent(c);
  return e.kind === "message" && e.direction === "in";
};

export const missedCall = (c: Conversation) => {
  const e = lastEvent(c);
  return e.kind === "call" && e.outcome === "missed";
};

export const failedOutbound = (c: Conversation) => {
  const e = lastEvent(c);
  return e.kind === "message" && e.direction === "out" && e.status === "failed";
};

export const previewText = (c: Conversation): string => {
  const e = lastEvent(c);
  if (e.kind === "call") {
    if (e.outcome === "missed") return e.direction === "in" ? "Appel manqué" : "Appel non abouti";
    const dur = formatDuration(e.durationSec);
    return `Appel ${e.direction === "in" ? "reçu" : "passé"}${dur ? ` · ${dur}` : ""}`;
  }
  const body = e.attachment ? "Photo" : (e.text ?? "");
  return e.direction === "out" ? `Vous : ${body}` : body;
};

/* ------------------------------------------------------------------ */
/* Formatage des dates / durées                                        */
/* ------------------------------------------------------------------ */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Horodatage court affiché à droite d'une conversation dans la liste.
export const formatListStamp = (at: string) => {
  const d = new Date(at);
  const diff = dayDiff(NOW, d);
  if (diff <= 0) return formatClock(at);
  if (diff === 1) return "hier";
  if (diff < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
};

// Heure d'un événement dans le fil.
export const formatClock = (at: string) =>
  new Date(at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Séparateur de journée dans le fil.
export const formatDaySeparator = (at: string) => {
  const d = new Date(at);
  const diff = dayDiff(NOW, d);
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return cap(
    d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(d.getFullYear() !== NOW.getFullYear() ? { year: "numeric" } : {}),
    }),
  );
};

export function formatDuration(sec: number): string | null {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (!m) return `${s} s`;
  return s ? `${m} min ${s} s` : `${m} min`;
}

// Regroupe les événements d'un fil par journée, dans l'ordre.
export function groupEventsByDay(events: ThreadEvent[]) {
  const groups: { key: string; label: string; events: ThreadEvent[] }[] = [];
  for (const e of events) {
    const key = new Date(e.at).toDateString();
    const current = groups[groups.length - 1];
    if (current && current.key === key) current.events.push(e);
    else groups.push({ key, label: formatDaySeparator(e.at), events: [e] });
  }
  return groups;
}
