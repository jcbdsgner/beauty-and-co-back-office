// Données fictives — forfaits d'abonnement Beauty & Co. Front-end uniquement :
// aucune API, aucune persistance, l'écran /fidelite édite ces valeurs en mémoire
// de session. Indépendant du barrel `@/lib/mock` : importer directement
// `@/lib/mock/forfaits`.
//
// Vocabulaire contractuel (docs/backoffice-spec.md du projet b&co) :
//
//   Forfait      = le plan : liste FIXE de prestations, renouvelée à chaque cycle.
//                  Prix LIBRE, décidé par le salon — jamais dérivé de la somme des
//                  prestations. Chaque prestation listée = 1 fois par cycle.
//   Cycle        = période de renouvellement (`cycleDays` pilote tous les calculs
//                  de date ; `cycleLabel` n'est que l'affichage).
//   Abonnement   = l'engagement d'une cliente envers un Forfait (cf.
//                  `@/lib/mock/abonnements`).
//
// Les `prestationIds` référencent le catalogue réel `@/lib/mock/services`.

import { prestationSeeds, serviceSeeds } from "./services";

/* ------------------------------------------------------------------ Type */

export type Forfait = {
  id: string;
  label: string;
  image?: string; // facultatif — l'UI dégrade proprement sans visuel
  video?: string; // fond animé de la card côté site client ; inutilisé ici
  description: string;
  priceFcfa: number; // ENTIER FCFA, valeur LIBRE — jamais dérivée des prestations
  cycleLabel: string; // « Mensuel », « Toutes les 6 semaines »
  cycleDays: number; // ENTIER — pilote tous les calculs d'échéance
  prestationIds: string[]; // réfs `@/lib/mock/services`, jamais dupliquées
};

/* ------------------------------------------------------------- Presets cycle */

// Pour le formulaire : préréglages courants + « Personnalisé » (saisie libre du
// nombre de jours).
export const CYCLE_PRESETS: { label: string; days: number | null }[] = [
  { label: "Mensuel", days: 30 },
  { label: "Toutes les 6 semaines", days: 42 },
  { label: "Trimestriel", days: 90 },
  { label: "Personnalisé", days: null },
];

/* ------------------------------------------------------------------ Seeds */

// 3 forfaits (spec §2.2). Les prestationIds existent dans `prestationSeeds`.
export const forfaitSeeds: Forfait[] = [
  {
    id: "eclat-mensuel",
    label: "Abonnement Éclat Mensuel",
    description:
      "Le rituel beauté du mois : un brushing, un soin du visage éclat et une " +
      "manucure classique, renouvelés chaque mois.",
    priceFcfa: 65_000,
    cycleLabel: "Mensuel",
    cycleDays: 30,
    prestationIds: [
      "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire",
      "soin-du-visage-glow-me-facial",
      "manucure-pedicure-vernis-simple-mains-classique-et-halal",
    ],
  },
  {
    id: "detente-spa",
    label: "Abonnement Détente Spa",
    description:
      "Une parenthèse spa chaque mois : soin du dos et réflexologie plantaire.",
    priceFcfa: 90_000,
    cycleLabel: "Mensuel",
    cycleDays: 30,
    prestationIds: ["spa-soin-du-dos", "spa-reflexology"],
  },
  {
    id: "mains-et-pieds",
    label: "Abonnement Mains & Pieds",
    description:
      "L'entretien complet mains et pieds toutes les six semaines : jelly " +
      "pédicure, manucure spa express et remplissage gel.",
    priceFcfa: 55_000,
    cycleLabel: "Toutes les 6 semaines",
    cycleDays: 42,
    prestationIds: [
      "manucure-pedicure-jelly-pedicure",
      "manucure-pedicure-manucure-spa-express",
      "onglerie-remplissage-gel",
    ],
  },
];

/* ------------------------------------------------------------------ Helpers */

const serviceLabel = (serviceId: string | null) =>
  serviceSeeds.find((s) => s.id === serviceId)?.name ?? "Sans catégorie";

export type ForfaitPrestation = {
  id: string;
  label: string;
  categoryLabel: string;
  missing: boolean; // id qui ne résout plus dans le catalogue
};

// Résout les ids d'un forfait → nom + catégorie. AUCUN prix ni durée : sur un
// forfait, seuls comptent le nom et la catégorie (spec §2.2).
export const getForfaitPrestations = (forfait: Forfait): ForfaitPrestation[] =>
  forfait.prestationIds.map((id) => {
    const p = prestationSeeds.find((x) => x.id === id);
    return {
      id,
      label: p?.name ?? id,
      categoryLabel: p ? serviceLabel(p.serviceId) : "—",
      missing: !p,
    };
  });

let seq = 0;
export const newForfaitId = () => `forfait-${Date.now().toString(36)}-${seq++}`;
