// Données fictives — modèles d'email Beauty & Co. Front-end uniquement, aucune API,
// aucune persistance : l'écran édite tout en mémoire de session.
// Volontairement indépendant du barrel `@/lib/mock` : importer directement ce fichier
// (`@/lib/mock/emails`).

/* ------------------------------------------------------------------ */
/* Lien du site + automatisations d'envoi                              */
/* ------------------------------------------------------------------ */

export type DelayUnit = "hours" | "days";

export const DELAY_UNIT_OPTIONS: { value: DelayUnit; label: string }[] = [
  { value: "hours", label: "heures" },
  { value: "days", label: "jours" },
];

export const delayUnitLabel = (u: DelayUnit) =>
  DELAY_UNIT_OPTIONS.find((o) => o.value === u)?.label ?? u;

// Une règle d'envoi minuté : activée ou non, délai + unité.
export type ReminderRule = { enabled: boolean; value: number; unit: DelayUnit };

export type EmailAutomation = {
  reminder1: ReminderRule; // 1er rappel avant le RDV
  reminder2: ReminderRule; // 2e rappel avant le RDV
  thankYou: ReminderRule; // email « merci pour votre visite » après le RDV
};

// Lien utilisé par le bouton « site web » au bas de tous les emails clients.
export const defaultSiteLink = "https://linktr.ee/beautyandco";

export const defaultAutomation: EmailAutomation = {
  reminder1: { enabled: true, value: 1, unit: "days" },
  reminder2: { enabled: true, value: 1, unit: "hours" },
  thankYou: { enabled: true, value: 1, unit: "days" },
};

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
  // Quand l'email part — libellé lisible, non modifiable pour les modèles système.
  trigger: string;
};

// Déclencheur par défaut d'un modèle personnalisé nouvellement créé.
export const CUSTOM_TRIGGER = "Envoi manuel depuis la fiche cliente.";

export const defaultTemplates: EmailTemplate[] = [
  {
    id: "confirmation",
    name: "Confirmation de rendez-vous",
    kind: "system",
    trigger: "Envoyé dès qu'une cliente réserve un rendez-vous.",
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
    trigger: "Envoyé avant le rendez-vous, selon les délais réglés ci-dessus.",
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
    trigger: "Envoyé quand la date ou l'heure d'un rendez-vous change.",
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
    trigger: "Envoyé quand un rendez-vous est annulé.",
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
    trigger: "Envoyé après le rendez-vous, selon le délai réglé ci-dessus.",
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
    trigger: "Envoyé à la création d'une fiche cliente.",
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
    trigger: "Envoi programmé le mois de l'anniversaire de la cliente.",
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
    trigger: "Envoi manuel depuis la fiche cliente.",
    subject: "Vous nous manquez — Beauty & Co",
    body: `Bonjour {{cliente}},

Cela fait un moment que nous ne vous avons pas vue chez Beauty & Co — {{salon}}.

Nous aimerions beaucoup vous retrouver : prenez rendez-vous quand vous le souhaitez sur {{lien_site}}.

À très bientôt,
L'équipe Beauty & Co`,
  },
];
