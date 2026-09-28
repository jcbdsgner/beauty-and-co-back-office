// Données fictives — modèles d'email Beauty & Co. Front-end uniquement, aucune API,
// aucune persistance : l'écran édite tout en mémoire de session.
// Volontairement indépendant du barrel `@/lib/mock` : importer directement ce fichier
// (`@/lib/mock/emails`).

/* ------------------------------------------------------------------ */
/* Lien du site                                                        */
/* ------------------------------------------------------------------ */

// Lien utilisé par le bouton « site web » au bas de tous les emails clients.
export const defaultSiteLink = "https://linktr.ee/beautyandco";

/* ------------------------------------------------------------------ */
/* Envoi automatique d'un modèle                                       */
/* ------------------------------------------------------------------ */
// Chaque modèle (hors emails transactionnels à déclencheur fixe) porte son
// propre réglage d'envoi : manuel, ou automatique à l'occasion d'un
// événement, N heures / jours / semaines / mois avant ou après (2026-09-28).

export type EmailEvent = "rendez-vous" | "anniversaire" | "achat-produit" | "carte-cadeau" | "abonnement";

type EventMeta = {
  label: string; // menu « À l'occasion de »
  ref: string; // « 2 jours avant le rendez-vous »
  at: string; // délai nul : « Au moment du rendez-vous »
};

export const EMAIL_EVENTS: Record<EmailEvent, EventMeta> = {
  "rendez-vous": { label: "Un rendez-vous", ref: "le rendez-vous", at: "Au moment du rendez-vous" },
  anniversaire: { label: "Un anniversaire", ref: "l'anniversaire de la cliente", at: "Le jour de l'anniversaire de la cliente" },
  "achat-produit": { label: "Un achat de produit", ref: "l'achat d'un produit", at: "Dès l'achat d'un produit" },
  "carte-cadeau": { label: "Un achat de carte cadeau", ref: "l'achat d'une carte cadeau", at: "Dès l'achat d'une carte cadeau" },
  abonnement: { label: "Une souscription à un abonnement", ref: "la souscription à un abonnement", at: "Dès la souscription à un abonnement" },
};

export const EMAIL_EVENT_OPTIONS = (Object.keys(EMAIL_EVENTS) as EmailEvent[]).map((value) => ({
  value,
  label: EMAIL_EVENTS[value].label,
}));

export type DelayUnit = "hours" | "days" | "weeks" | "months";

const UNIT_WORDS: Record<DelayUnit, [string, string]> = {
  hours: ["heure", "heures"],
  days: ["jour", "jours"],
  weeks: ["semaine", "semaines"],
  months: ["mois", "mois"],
};

export const DELAY_UNIT_OPTIONS: { value: DelayUnit; label: string }[] = (
  Object.keys(UNIT_WORDS) as DelayUnit[]
).map((value) => ({ value, label: UNIT_WORDS[value][1] }));

export const unitWord = (u: DelayUnit, n: number) => UNIT_WORDS[u][n > 1 ? 1 : 0];

export type SendDirection = "before" | "after";

export const DIRECTION_OPTIONS: { value: SendDirection; label: string }[] = [
  { value: "before", label: "avant" },
  { value: "after", label: "après" },
];

export const DELAY_MAX = 99;

export type EmailSend = {
  auto: boolean; // false = envoi manuel ; le reste est gardé pour une réactivation
  event: EmailEvent;
  value: number; // 0 = au moment même
  unit: DelayUnit;
  direction: SendDirection;
};

export const DEFAULT_SEND: EmailSend = {
  auto: false,
  event: "rendez-vous",
  value: 1,
  unit: "days",
  direction: "before",
};

export const MANUAL_SEND_LABEL = "Envoi manuel depuis la fiche cliente";

// « 2 jours avant le rendez-vous », « Dès l'achat d'un produit »…
export function sendLabel(send: EmailSend): string {
  if (!send.auto) return MANUAL_SEND_LABEL;
  const ev = EMAIL_EVENTS[send.event];
  if (send.value === 0) return ev.at;
  const dir = send.direction === "before" ? "avant" : "après";
  return `${send.value} ${unitWord(send.unit, send.value)} ${dir} ${ev.ref}`;
}

// Un achat ne s'anticipe pas : un email « avant » un achat ne peut partir
// qu'à une date d'achat déjà connue — on le signale sans l'interdire.
export const isPurchaseEvent = (e: EmailEvent) =>
  e === "achat-produit" || e === "carte-cadeau" || e === "abonnement";

/* ------------------------------------------------------------------ */
/* Variables insérables dans un modèle                                 */
/* ------------------------------------------------------------------ */

export const TEMPLATE_VARIABLES: { token: string; label: string }[] = [
  { token: "{{cliente}}", label: "Nom de la cliente" },
  { token: "{{salon}}", label: "Nom du salon" },
  { token: "{{date}}", label: "Date du rendez-vous" },
  { token: "{{heure}}", label: "Heure du rendez-vous" },
  { token: "{{prestation}}", label: "Prestation réservée" },
  { token: "{{praticienne}}", label: "Praticienne" },
  { token: "{{lien_site}}", label: "Lien du site" },
];

/* ------------------------------------------------------------------ */
/* Modèles                                                             */
/* ------------------------------------------------------------------ */

export type EmailTemplateKind = "system" | "custom";

export const templateKindLabel = (k: EmailTemplateKind) =>
  k === "system" ? "Système" : "Personnalisé";

export type EmailTemplate = {
  id: string;
  name: string;
  kind: EmailTemplateKind;
  subject: string;
  body: string;
  // Email transactionnel : part sur une action précise (réservation,
  // annulation…), déclencheur figé. Sinon, l'envoi se règle via `send`.
  fixedTrigger?: string;
  /** Rubrique de la liste pour un email transactionnel (ex. « Rendez-vous »). */
  fixedGroup?: string;
  send: EmailSend;
};

// Libellé d'envoi d'un modèle, quel que soit son type.
export const templateSendLabel = (t: EmailTemplate) =>
  t.fixedTrigger ?? sendLabel(t.send);

// Rubriques de la liste des modèles : une par occasion, dans l'ordre de la
// vie d'une cliente, puis les envois manuels.
export const EVENT_GROUP_LABEL: Record<EmailEvent, string> = {
  "rendez-vous": "Rendez-vous",
  anniversaire: "Anniversaire",
  "achat-produit": "Achat de produit",
  "carte-cadeau": "Carte cadeau",
  abonnement: "Abonnement",
};
export const MANUAL_GROUP = "Envoi manuel";
const GROUP_ORDER = ["Nouvelle cliente", ...Object.values(EVENT_GROUP_LABEL), MANUAL_GROUP];

const UNIT_HOURS: Record<DelayUnit, number> = { hours: 1, days: 24, weeks: 168, months: 720 };
// Décalage signé par rapport à l'événement, pour trier « 1 jour avant »
// avant « 2 heures avant » avant « 1 jour après ».
const offsetHours = (s: EmailSend) =>
  s.value * UNIT_HOURS[s.unit] * (s.direction === "before" ? -1 : 1);

export function groupTemplates(templates: EmailTemplate[]): { label: string; items: EmailTemplate[] }[] {
  const groupOf = (t: EmailTemplate) =>
    t.fixedTrigger ? (t.fixedGroup ?? "Rendez-vous") : t.send.auto ? EVENT_GROUP_LABEL[t.send.event] : MANUAL_GROUP;
  return GROUP_ORDER.map((label) => ({
    label,
    items: templates
      .filter((t) => groupOf(t) === label)
      // transactionnels d'abord (ordre des seeds), puis par moment d'envoi
      .sort((a, b) =>
        a.fixedTrigger || b.fixedTrigger
          ? Number(Boolean(b.fixedTrigger)) - Number(Boolean(a.fixedTrigger))
          : offsetHours(a.send) - offsetHours(b.send),
      ),
  })).filter((g) => g.items.length > 0);
}

export const isAutomatic = (t: EmailTemplate) => Boolean(t.fixedTrigger) || t.send.auto;

export const defaultTemplates: EmailTemplate[] = [
  {
    id: "confirmation",
    name: "Confirmation de rendez-vous",
    kind: "system",
    fixedTrigger: "Dès qu'une cliente réserve un rendez-vous",
    fixedGroup: "Rendez-vous",
    send: DEFAULT_SEND,
    subject: "Confirmation de votre rendez-vous — Beauty & Co",
    body: `Bonjour {{cliente}},

Votre rendez-vous chez Beauty & Co — {{salon}} est confirmé.

Prestation : {{prestation}}
Date : {{date}} à {{heure}}
Avec : {{praticienne}}

En cas d'empêchement, prévenez-nous au plus tôt afin de libérer le créneau pour une autre cliente.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "rappel",
    name: "Rappel de rendez-vous",
    kind: "system",
    send: { auto: true, event: "rendez-vous", value: 1, unit: "days", direction: "before" },
    subject: "Rappel : votre rendez-vous du {{date}} — Beauty & Co",
    body: `Bonjour {{cliente}},

Petit rappel de votre rendez-vous chez Beauty & Co — {{salon}}.

Prestation : {{prestation}}
Date : {{date}} à {{heure}}
Avec : {{praticienne}}

Si vous ne pouvez pas venir, merci de nous prévenir dès que possible.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "modification",
    name: "Modification de rendez-vous",
    kind: "system",
    fixedTrigger: "Dès que la date ou l'heure d'un rendez-vous change",
    fixedGroup: "Rendez-vous",
    send: DEFAULT_SEND,
    subject: "Votre rendez-vous a été modifié — Beauty & Co",
    body: `Bonjour {{cliente}},

Votre rendez-vous chez Beauty & Co — {{salon}} a été modifié.

Nouvelle date : {{date}} à {{heure}}
Prestation : {{prestation}}
Avec : {{praticienne}}

Si ce nouveau créneau ne vous convient pas, contactez-nous et nous trouverons une autre solution.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "annulation",
    name: "Annulation de rendez-vous",
    kind: "system",
    fixedTrigger: "Dès qu'un rendez-vous est annulé",
    fixedGroup: "Rendez-vous",
    send: DEFAULT_SEND,
    subject: "Annulation de votre rendez-vous — Beauty & Co",
    body: `Bonjour {{cliente}},

Votre rendez-vous du {{date}} à {{heure}} chez Beauty & Co — {{salon}} a bien été annulé.

Nous serons ravies de vous accueillir à une prochaine occasion : réservez à tout moment depuis {{lien_site}}.

À bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "remerciement",
    name: "Merci pour votre visite",
    kind: "system",
    send: { auto: true, event: "rendez-vous", value: 1, unit: "days", direction: "after" },
    subject: "Merci pour votre visite — Beauty & Co",
    body: `Bonjour {{cliente}},

Merci d'être passée chez Beauty & Co — {{salon}}. Nous espérons que votre {{prestation}} vous plaît.

Un avis nous aiderait beaucoup, et votre prochaine visite se réserve dès maintenant sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "bienvenue",
    name: "Bienvenue",
    kind: "system",
    fixedTrigger: "Dès la création d'une fiche cliente",
    fixedGroup: "Nouvelle cliente",
    send: DEFAULT_SEND,
    subject: "Bienvenue chez Beauty & Co",
    body: `Bonjour {{cliente}},

Bienvenue chez Beauty & Co. Votre fiche est créée : vous pouvez désormais réserver vos rendez-vous en ligne, suivre vos points de fidélité et retrouver l'historique de vos visites.

Réservez quand vous voulez sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "anniversaire",
    name: "Offre anniversaire",
    kind: "custom",
    send: { auto: true, event: "anniversaire", value: 0, unit: "days", direction: "before" },
    subject: "Un cadeau pour votre anniversaire — Beauty & Co",
    body: `Bonjour {{cliente}},

Toute l'équipe Beauty & Co vous souhaite un très joyeux anniversaire.

Pour l'occasion, profitez d'une attention offerte sur votre prochaine visite ce mois-ci. Réservez sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "relance",
    name: "Relance clientes",
    kind: "custom",
    send: DEFAULT_SEND,
    subject: "Vous nous manquez — Beauty & Co",
    body: `Bonjour {{cliente}},

Cela fait un moment que nous ne vous avons pas vue chez Beauty & Co — {{salon}}.

Nous aimerions beaucoup vous retrouver : prenez rendez-vous quand vous le souhaitez sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "rappel-jour-meme",
    name: "Rappel le jour même",
    kind: "system",
    send: { auto: true, event: "rendez-vous", value: 2, unit: "hours", direction: "before" },
    subject: "À tout à l'heure chez Beauty & Co",
    body: `Bonjour {{cliente}},

Nous vous attendons aujourd'hui à {{heure}} chez Beauty & Co — {{salon}} pour votre {{prestation}}.

À tout à l'heure,
L'équipe Beauty & Co`,
  },
  {
    id: "conseils-produit",
    name: "Conseils d'utilisation",
    kind: "custom",
    send: { auto: true, event: "achat-produit", value: 1, unit: "weeks", direction: "after" },
    subject: "Tirer le meilleur de votre produit — Beauty & Co",
    body: `Bonjour {{cliente}},

Vous utilisez votre nouveau produit depuis une semaine : nos praticiennes répondent volontiers à vos questions sur son utilisation.

Pour aller plus loin, associez-le à un soin en salon, à réserver sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "carte-cadeau",
    name: "Merci pour votre carte cadeau",
    kind: "custom",
    send: { auto: true, event: "carte-cadeau", value: 0, unit: "hours", direction: "after" },
    subject: "Votre carte cadeau Beauty & Co",
    body: `Bonjour {{cliente}},

Merci d'avoir offert une carte cadeau Beauty & Co. Elle est valable dans tous nos salons, sur toutes les prestations.

À très bientôt,
L'équipe Beauty & Co`,
  },
  {
    id: "abonnement-bienvenue",
    name: "Bienvenue dans votre abonnement",
    kind: "custom",
    send: { auto: true, event: "abonnement", value: 1, unit: "days", direction: "after" },
    subject: "Votre abonnement Beauty & Co est actif",
    body: `Bonjour {{cliente}},

Votre abonnement est actif : vos prestations incluses sont disponibles dès maintenant. Réservez-les sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
];
