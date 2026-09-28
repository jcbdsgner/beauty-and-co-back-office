// Données fictives « Autorisations par rôle » — front-end uniquement, aucune API,
// aucune persistance. Indépendant du barrel : importer directement
// `@/lib/mock/autorisations`.
//
// Sokhna délègue l'exploitation courante (stock, planning, affectation des
// praticiennes aux rendez-vous…) mais garde la main sur ce qui touche aux marges
// — les prix des prestations, les recettes de consommation, les paramètres de
// paiement. Cet écran règle, PAR RÔLE (`StaffRole` : praticienne / caisse /
// manager), ce que chaque rôle a le droit de faire.
//
// Un membre qui cumule plusieurs rôles (ex. Rokhaya = manager + caisse) cumule
// leurs autorisations (union — cf. `capabilitiesForRoles`).
//
// La propriétaire, elle, a toujours tout : elle n'est pas un membre à rôle, ces
// réglages ne concernent que les comptes qu'elle invite.

import { ROLE_LABELS, type StaffRole } from "./staff";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Capability =
  | "rdv.view"
  | "rdv.edit"
  | "rdv.assign"
  | "paiement.encaisser"
  | "paiement.remise"
  | "paiement.remiseLibre"
  | "client.view"
  | "client.edit"
  | "planning.edit"
  | "rh.decide"
  | "equipe.access"
  | "services.edit"
  | "services.pricing"
  | "services.recipe"
  | "stock.adjust"
  | "stock.transfer"
  | "stock.reorder"
  | "reports.view"
  | "journal.view"
  | "config.fidelite"
  | "config.emails"
  | "config.salons"
  | "config.paiement";

export type CapabilityDef = {
  id: Capability;
  label: string;
  hint?: string;
  // Action « sensible » (touche à l'argent, aux droits, à la config) : pastille
  // discrète dans la matrice.
  sensitive?: boolean;
  // Prérequis : cocher cette autorisation coche aussi son prérequis ; décocher
  // le prérequis décoche ses dérivés (cf. `applyCapability`).
  requires?: Capability;
};

export type CapabilityGroup = {
  id: string;
  label: string;
  capabilities: CapabilityDef[];
};

// Politique d'un rôle : chaque autorisation → accordée ou non.
export type RolePolicy = Record<Capability, boolean>;

// L'ensemble des politiques, une par rôle.
export type Autorisations = Record<StaffRole, RolePolicy>;

/* ------------------------------------------------------------------ */
/* Catalogue des autorisations — 7 domaines                           */
/* ------------------------------------------------------------------ */

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    id: "rendez-vous",
    label: "Rendez-vous",
    capabilities: [
      { id: "rdv.view", label: "Voir tous les rendez-vous" },
      {
        id: "rdv.edit",
        label: "Créer, modifier ou annuler un rendez-vous",
        requires: "rdv.view",
      },
      {
        id: "rdv.assign",
        label: "Changer la praticienne d’un rendez-vous",
        requires: "rdv.view",
      },
    ],
  },
  {
    id: "encaissements",
    label: "Encaissements",
    capabilities: [
      { id: "paiement.encaisser", label: "Encaisser une visite" },
      { id: "paiement.remise", label: "Accorder une remise plafonnée" },
      {
        id: "paiement.remiseLibre",
        label: "Accorder une remise sans plafond",
        sensitive: true,
        requires: "paiement.remise",
      },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    capabilities: [
      { id: "client.view", label: "Consulter les fiches clientes" },
      {
        id: "client.edit",
        label: "Modifier ou supprimer une fiche cliente",
        requires: "client.view",
      },
    ],
  },
  {
    id: "equipe",
    label: "Équipe & planning",
    capabilities: [
      { id: "planning.edit", label: "Modifier le planning (absences, remplacements)" },
      {
        id: "rh.decide",
        label: "Décider des demandes d'avance et de congé",
        sensitive: true,
      },
      {
        id: "equipe.access",
        label: "Gérer les accès et les rôles de l'équipe",
        sensitive: true,
      },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    capabilities: [
      {
        id: "services.edit",
        label: "Modifier les prestations (durée, description, questions)",
      },
      {
        id: "services.pricing",
        label: "Modifier les prix des prestations",
        sensitive: true,
        requires: "services.edit",
      },
      {
        id: "services.recipe",
        label: "Modifier les recettes de consommation",
        sensitive: true,
        requires: "services.edit",
      },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    capabilities: [
      { id: "stock.adjust", label: "Ajuster le stock et saisir un inventaire" },
      {
        id: "stock.transfer",
        label: "Transférer entre la réserve et les salons",
        requires: "stock.adjust",
      },
      {
        id: "stock.reorder",
        label: "Modifier les seuils et passer commande",
        requires: "stock.adjust",
      },
    ],
  },
  {
    id: "pilotage",
    label: "Pilotage & configuration",
    capabilities: [
      { id: "reports.view", label: "Générer et exporter des rapports" },
      { id: "journal.view", label: "Consulter le journal d'activité" },
      { id: "config.fidelite", label: "Programme de fidélité" },
      { id: "config.emails", label: "Modèles d'email" },
      {
        id: "config.salons",
        label: "Salons (horaires, postes, fermetures)",
        sensitive: true,
      },
      {
        id: "config.paiement",
        label: "Paramètres de paiement",
        sensitive: true,
      },
    ],
  },
];

export const ALL_CAPABILITIES: Capability[] = CAPABILITY_GROUPS.flatMap((g) =>
  g.capabilities.map((c) => c.id),
);

const CAPABILITY_DEFS: Record<Capability, CapabilityDef> = Object.fromEntries(
  CAPABILITY_GROUPS.flatMap((g) => g.capabilities).map((c) => [c.id, c]),
) as Record<Capability, CapabilityDef>;

// Dérivés directs d'une autorisation (l'inverse de `requires`).
const DEPENDENTS: Record<Capability, Capability[]> = Object.fromEntries(
  ALL_CAPABILITIES.map((id) => [
    id,
    ALL_CAPABILITIES.filter((other) => CAPABILITY_DEFS[other].requires === id),
  ]),
) as Record<Capability, Capability[]>;

/* ------------------------------------------------------------------ */
/* Presets par défaut                                                 */
/* ------------------------------------------------------------------ */

const policyFrom = (granted: Capability[]): RolePolicy =>
  Object.fromEntries(
    ALL_CAPABILITIES.map((id) => [id, granted.includes(id)]),
  ) as RolePolicy;

// Manager : tout, sauf ce qui touche aux marges et au paiement.
const MANAGER_EXCLUDES: Capability[] = [
  "paiement.remiseLibre",
  "services.pricing",
  "services.recipe",
  "config.paiement",
];

export const defaultAutorisations: Autorisations = {
  // Praticienne : consultation seule. Beaucoup n'ont même pas de compte.
  praticienne: policyFrom(["rdv.view", "client.view"]),
  // Caisse : opérationnelle sur la journée et l'encaissement, pas sur la
  // structure (prix, recettes, RH, config).
  caisse: policyFrom([
    "rdv.view",
    "rdv.edit",
    "rdv.assign",
    "paiement.encaisser",
    "paiement.remise",
    "client.view",
    "client.edit",
    "stock.adjust",
    "journal.view",
  ]),
  // Ménage : aucun accès à la plateforme (hors matrice, cf. `ROLE_COLUMNS`).
  menage: policyFrom([]),
  // Manager : pilote l'exploitation.
  manager: policyFrom(
    ALL_CAPABILITIES.filter((id) => !MANAGER_EXCLUDES.includes(id)),
  ),
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export const roleCan = (
  role: StaffRole,
  cap: Capability,
  a: Autorisations,
): boolean => a[role]?.[cap] ?? false;

// Union des autorisations de plusieurs rôles.
export const capabilitiesForRoles = (
  roles: StaffRole[],
  a: Autorisations,
): Set<Capability> => {
  const set = new Set<Capability>();
  for (const role of roles) {
    for (const cap of ALL_CAPABILITIES) {
      if (a[role]?.[cap]) set.add(cap);
    }
  }
  return set;
};

export const roleGrantedCount = (role: StaffRole, a: Autorisations): number =>
  ALL_CAPABILITIES.reduce((n, cap) => n + (a[role]?.[cap] ? 1 : 0), 0);

export const roleDiffersFromDefault = (
  role: StaffRole,
  a: Autorisations,
): boolean =>
  ALL_CAPABILITIES.some(
    (cap) => (a[role]?.[cap] ?? false) !== defaultAutorisations[role][cap],
  );

// Applique une modification à une politique en propageant la cascade `requires` :
// - accorder une autorisation accorde aussi tous ses prérequis (récursif) ;
// - retirer une autorisation retire aussi tous ses dérivés (récursif).
export const applyCapability = (
  policy: RolePolicy,
  cap: Capability,
  value: boolean,
): RolePolicy => {
  const next = { ...policy };
  const walk = (id: Capability) => {
    if (next[id] === value) return;
    next[id] = value;
    if (value) {
      const req = CAPABILITY_DEFS[id].requires;
      if (req) walk(req);
    } else {
      for (const dep of DEPENDENTS[id]) walk(dep);
    }
  };
  walk(cap);
  return next;
};

export const roleLabel = (role: StaffRole) => ROLE_LABELS[role];

// Rôles dans l'ordre d'affichage de la matrice — le ménage n'y figure pas :
// il n'a jamais accès à la plateforme.
export const ROLE_COLUMNS: StaffRole[] = ["praticienne", "caisse", "manager"];
