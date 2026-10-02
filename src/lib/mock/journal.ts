// Données fictives « Journal d'activité » — front-end uniquement, aucune API,
// aucune persistance. Indépendant du barrel `@/lib/mock` : importer directement
// `@/lib/mock/journal`, comme `rendezvous.ts` / `staff.ts` / `notifications.ts`.
//
// Le journal répertorie ce que l'ÉQUIPE a fait dans les salons : encaissements,
// remises, rendez-vous déplacés, inventaires, décisions RH… Chaque entrée est
// datée, rattachée à une personne et au rôle sous lequel elle a agi (une même
// personne peut être manager ET caisse — c'est le rôle de l'action qui compte).
// La propriétaire s'en sert pour superviser : « qu'a fait mon équipe pendant que
// je n'étais pas là, et rien d'anormal ? ».
//
// Ce module n'importe RIEN de `staff.ts` : le nom de l'auteur est dénormalisé
// dans chaque entrée (une collaboratrice qui a quitté l'équipe reste lisible
// dans l'historique).

import { inScope, type SalonId, type SalonScope } from "./beautyandco";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

// Le rôle sous lequel l'action a été effectuée — c'est l'axe de filtrage
// principal de l'écran (« actions manager / caisse / praticienne »).
export type ActorRole = "manager" | "caisse" | "praticienne";

// Domaine touché — sert à l'icône et au libellé secondaire de la ligne.
export type JournalDomain =
  | "rendez-vous"
  | "paiement"
  | "client"
  | "equipe"
  | "stock"
  | "parametres";

// `info` = geste courant · `notable` = à connaître (remise, absence, inventaire,
// décision RH) · `sensitive` = à surveiller (remboursement, annulation
// d'encaissement, changement de tarif, annulation tardive).
export type JournalTone = "info" | "notable" | "sensitive";

export type JournalEntry = {
  id: string;
  at: string; // ISO 8601 local — monde mock ancré au 2026-09-03
  actorId: string; // cf. `@/lib/mock/staff` (dénormalisé, voir en-tête)
  actorName: string; // « Rokhaya Diallo »
  actorRole: ActorRole;
  salonId: SalonId;
  domain: JournalDomain;
  action: string; // « a encaissé un paiement »
  detail: string; // « Fatou Camara — 45.000 FCFA, espèces »
  tone: JournalTone;
  href?: string; // page existante concernée (facultatif)
};

/* ------------------------------------------------------------------ */
/* Libellés                                                           */
/* ------------------------------------------------------------------ */

// Singulier — pour la pastille de rôle sur une ligne.
export const ACTOR_ROLE_LABELS: Record<ActorRole, string> = {
  manager: "Manager",
  caisse: "Caisse",
  praticienne: "Praticienne",
};

// Pour le filtre (une catégorie = toutes les actions de ce rôle).
export const ACTOR_ROLE_FILTER_LABELS: Record<ActorRole, string> = {
  manager: "Manager",
  caisse: "Caisse",
  praticienne: "Praticiennes",
};

// Ordre d'affichage du filtre ; « manager » en tête = vue par défaut.
export const ACTOR_ROLES: ActorRole[] = ["manager", "caisse", "praticienne"];

export const DOMAIN_LABELS: Record<JournalDomain, string> = {
  "rendez-vous": "Rendez-vous",
  paiement: "Encaissement",
  client: "Fiche cliente",
  equipe: "Équipe",
  stock: "Stock",
  parametres: "Paramètres",
};

/* ------------------------------------------------------------------ */
/* Repère temporel figé (aligné sur beautyandco / notifications)       */
/* ------------------------------------------------------------------ */

export const JOURNAL_TODAY = "2026-09-03";
const DAY_MS = 86_400_000;

// yyyy-mm-dd + décalage en jours → yyyy-mm-dd
export const addDaysIso = (iso: string, days: number): string =>
  new Date(new Date(`${iso}T12:00:00`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

/* ------------------------------------------------------------------ */
/* Seeds — ~10 jours d'activité, du 25 août au 3 septembre 2026.       */
/* Références croisées vérifiées : nutritive-bain-riche-250ml,         */
/* k-elixir-oil-30ml ∈ productStock de stock.ts ; m-* ∈ staff.ts ;     */
/* toutes les `href` pointent vers une page réelle.                    */
/* ------------------------------------------------------------------ */

export const journalEntries: JournalEntry[] = [
  /* -------------------------------------------------- Manager (Rokhaya) */
  {
    id: "jn-0301",
    at: "2026-09-03T09:05:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "almadies",
    domain: "equipe",
    action: "a accordé une avance sur salaire",
    detail: "Henry — 50.000 FCFA, à retenir sur la paie de septembre",
    tone: "notable",
    href: "/equipe?membre=m-henry",
  },
  {
    id: "jn-0302",
    at: "2026-09-03T08:40:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "seaplaza",
    domain: "parametres",
    action: "a modifié un tarif",
    detail: "Silk Press : 75.000 → 79.000 FCFA",
    tone: "sensitive",
    href: "/services",
  },
  {
    id: "jn-0290",
    at: "2026-09-02T17:20:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "seaplaza",
    domain: "stock",
    action: "a saisi un inventaire",
    detail: "Nutritive Bain Riche 250ml (Sea Plaza) : comptage 10 unités, écart −3",
    tone: "notable",
    href: "/stock?produit=nutritive-bain-riche-250ml",
  },
  {
    id: "jn-0288",
    at: "2026-09-02T15:10:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "almadies",
    domain: "rendez-vous",
    action: "a réaffecté un rendez-vous",
    detail: "Coupe & brushing de Sokhna Ndiaye — confié à Michelle",
    tone: "info",
    href: "/rendez-vous",
  },
  {
    id: "jn-0280",
    at: "2026-09-01T18:30:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "seaplaza",
    domain: "equipe",
    action: "a accepté une demande de congé",
    detail: "Adja — du 15 au 17 septembre (3 jours)",
    tone: "notable",
    href: "/equipe?membre=m-adja",
  },
  {
    id: "jn-0276",
    at: "2026-09-01T11:00:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "almadies",
    domain: "parametres",
    action: "a programmé une fermeture exceptionnelle",
    detail: "Almadies — 6 octobre, jour férié",
    tone: "info",
    href: "/reglages?section=salons",
  },
  {
    id: "jn-0261",
    at: "2026-08-31T16:45:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "almadies",
    domain: "rendez-vous",
    action: "a annulé un rendez-vous",
    detail: "Nafi Camara — coloration complète, moins de 24 h avant",
    tone: "sensitive",
    href: "/rendez-vous",
  },
  {
    id: "jn-0244",
    at: "2026-08-29T10:15:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "seaplaza",
    domain: "equipe",
    action: "a modifié les horaires habituels",
    detail: "Gnagna — jeudi désormais travaillé (10:00–20:00)",
    tone: "info",
    href: "/equipe/planning",
  },
  {
    id: "jn-0221",
    at: "2026-08-27T14:00:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "almadies",
    domain: "equipe",
    action: "a invité une collaboratrice sur la plateforme",
    detail: "Henry — invitation envoyée par email",
    tone: "info",
    href: "/equipe?membre=m-henry",
  },
  {
    id: "jn-0203",
    at: "2026-08-25T09:30:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "manager",
    salonId: "almadies",
    domain: "parametres",
    action: "a modifié un modèle d'email",
    detail: "Rappel de rendez-vous — délai porté à 48 h avant",
    tone: "info",
    href: "/reglages?section=emails",
  },

  /* --------------------------------------------------- Caisse (Ndiole, Rokhaya) */
  {
    id: "jn-0303",
    at: "2026-09-03T13:25:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a encaissé un paiement",
    detail: "Fatou Camara — 45.000 FCFA, espèces",
    tone: "info",
  },
  {
    id: "jn-0304",
    at: "2026-09-03T12:50:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a appliqué une remise",
    detail: "Fatou Camara — 5.000 FCFA, prise en charge avec 30 minutes de retard",
    href: "/rendez-vous/RV-1787678400000-2z95rx39g",
    tone: "notable",
  },
  {
    id: "jn-0305",
    at: "2026-09-03T10:05:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a encaissé un acompte",
    detail: "Réservation coloration — 10.000 FCFA, Wave",
    tone: "info",
  },
  {
    id: "jn-0292",
    at: "2026-09-02T19:10:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a clôturé la caisse",
    detail: "Almadies — 287.000 FCFA encaissés sur 14 tickets",
    tone: "info",
  },
  {
    id: "jn-0289",
    at: "2026-09-02T16:30:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a remboursé une cliente",
    detail: "Awa Sarr — 15.000 FCFA, prestation écourtée",
    tone: "sensitive",
  },
  {
    id: "jn-0279",
    at: "2026-09-01T15:40:00",
    actorId: "m-rokhaya",
    actorName: "Rokhaya Diallo",
    actorRole: "caisse",
    salonId: "seaplaza",
    domain: "paiement",
    action: "a annulé un encaissement",
    detail: "Erreur de saisie — 30.000 FCFA, ressaisis correctement juste après",
    tone: "sensitive",
  },
  {
    id: "jn-0262",
    at: "2026-08-31T11:20:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "rendez-vous",
    action: "a noté une absence",
    detail: "Penda Ndoye — soin visage, cliente non présentée",
    tone: "notable",
  },
  {
    id: "jn-0231",
    at: "2026-08-28T18:05:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a clôturé la caisse",
    detail: "Almadies — 312.500 FCFA encaissés sur 16 tickets",
    tone: "info",
  },
  {
    id: "jn-0212",
    at: "2026-08-26T13:15:00",
    actorId: "m-ndiole",
    actorName: "Ndiole",
    actorRole: "caisse",
    salonId: "almadies",
    domain: "paiement",
    action: "a encaissé un paiement",
    detail: "Rama Diallo — 30.000 FCFA, carte bancaire",
    tone: "info",
  },

  /* --------------------------------------------- Praticiennes */
  {
    id: "jn-0306",
    at: "2026-09-03T14:30:00",
    actorId: "m-fatou",
    actorName: "Fatou",
    actorRole: "praticienne",
    salonId: "almadies",
    domain: "rendez-vous",
    action: "a terminé une visite",
    detail: "Awa Sarr — coupe & brushing",
    tone: "info",
    href: "/rendez-vous",
  },
  {
    id: "jn-0300",
    at: "2026-09-03T09:15:00",
    actorId: "m-gnagna",
    actorName: "Gnagna",
    actorRole: "praticienne",
    salonId: "seaplaza",
    domain: "rendez-vous",
    action: "a enregistré un rendez-vous",
    detail: "Yacine Wade — soin hydratant, jeudi à 14:00 · pris par téléphone",
    tone: "info",
    href: "/rendez-vous",
  },
  {
    id: "jn-0287",
    at: "2026-09-02T16:00:00",
    actorId: "m-fatou",
    actorName: "Fatou",
    actorRole: "praticienne",
    salonId: "almadies",
    domain: "client",
    action: "a complété une fiche cliente",
    detail: "Awa Sarr — préférence notée : coloration sans ammoniaque",
    tone: "info",
    href: "/clients",
  },
  {
    id: "jn-0284",
    at: "2026-09-02T11:30:00",
    actorId: "m-adja",
    actorName: "Adja",
    actorRole: "praticienne",
    salonId: "seaplaza",
    domain: "rendez-vous",
    action: "a déplacé un rendez-vous",
    detail: "Adama Sarr — de jeudi 10:00 à vendredi 11:00, à la demande de la cliente",
    tone: "info",
    href: "/rendez-vous",
  },
  {
    id: "jn-0278",
    at: "2026-09-01T17:00:00",
    actorId: "m-gnagna",
    actorName: "Gnagna",
    actorRole: "praticienne",
    salonId: "seaplaza",
    domain: "stock",
    action: "a signalé une consommation",
    detail: "K Elixir Oil 30ml — 1 flacon hors recette, brillance supplémentaire en fin de Silk Press",
    tone: "notable",
    href: "/stock?produit=k-elixir-oil-30ml",
  },
  {
    id: "jn-0252",
    at: "2026-08-30T10:00:00",
    actorId: "m-michelle",
    actorName: "Michelle",
    actorRole: "praticienne",
    salonId: "almadies",
    domain: "rendez-vous",
    action: "a bloqué un créneau",
    detail: "Formation coloriste — vendredi 14:00 à 18:00",
    tone: "info",
    href: "/equipe/planning",
  },
  {
    id: "jn-0219",
    at: "2026-08-27T19:00:00",
    actorId: "m-adja",
    actorName: "Adja",
    actorRole: "praticienne",
    salonId: "seaplaza",
    domain: "equipe",
    action: "a déposé une demande de congé",
    detail: "Du 15 au 17 septembre",
    tone: "info",
    href: "/equipe?membre=m-adja",
  },
];

/* ------------------------------------------------------------------ */
/* Dérivés                                                            */
/* ------------------------------------------------------------------ */

// Initiales de l'auteur — dérivées du nom dénormalisé (« Rokhaya Diallo » → RD).
export const actorInitials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

type Range = { from: string; to: string }; // yyyy-mm-dd inclusifs

// Minuscule + sans accent, pour une recherche tolérante (« aida » trouve « Aïda »).
const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Filtre salon + rôle + plage de dates (+ recherche libre), puis tri
// antéchronologique.
export function filterJournal(
  entries: JournalEntry[],
  opts: { salon: SalonScope; role: ActorRole; range: Range; query?: string },
): JournalEntry[] {
  const q = fold((opts.query ?? "").trim());
  return entries
    .filter((e) => inScope(opts.salon, e.salonId))
    .filter((e) => e.actorRole === opts.role)
    .filter((e) => {
      const day = e.at.slice(0, 10);
      return day >= opts.range.from && day <= opts.range.to;
    })
    .filter((e) => {
      if (!q) return true;
      return fold(`${e.actorName} ${e.action} ${e.detail}`).includes(q);
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// « Aujourd'hui » / « Hier » / « mardi 1 sept. » — étiquette de tranche de jour.
const WEEKDAYS_LONG = [
  "dimanche", "lundi", "mardi", "mercredi",
  "jeudi", "vendredi", "samedi",
];

export function journalDayLabel(iso: string): string {
  const day = iso.slice(0, 10);
  if (day === JOURNAL_TODAY) return "Aujourd'hui";
  const diff = Math.round(
    (new Date(`${JOURNAL_TODAY}T12:00:00`).getTime() -
      new Date(`${day}T12:00:00`).getTime()) /
      DAY_MS,
  );
  if (diff === 1) return "Hier";
  const d = new Date(`${day}T12:00:00`);
  const [, m, dd] = day.split("-").map(Number);
  return `${WEEKDAYS_LONG[d.getDay()]} ${dd} ${MONTHS_SHORT[m - 1]}`;
}

// Liste antéchronologique découpée en tranches de jour (ordre des tranches =
// ordre des entrées, déjà triées).
export function groupJournalByDay(
  list: JournalEntry[],
): { label: string; day: string; items: JournalEntry[] }[] {
  const groups: { label: string; day: string; items: JournalEntry[] }[] = [];
  for (const item of list) {
    const day = item.at.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ label: journalDayLabel(day), day, items: [item] });
  }
  return groups;
}

// hh:mm depuis l'ISO local.
export const journalClock = (iso: string) => iso.slice(11, 16);

// jj/mm/aaaa — pour l'affichage d'une plage personnalisée.
export const frDay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
