// Données fictives — packs prépayés Beauty & Co. Front-end uniquement : aucune
// API, aucune persistance, l'écran /fidelite édite ces valeurs en mémoire de
// session. Indépendant du barrel `@/lib/mock` : importer directement
// `@/lib/mock/packs`.
//
// Vocabulaire contractuel (docs/backoffice-spec.md du projet b&co) :
//
//   Pack = ensemble FIXE de prestations prépayées, à consommer prestation par
//          prestation sur plusieurs visites futures. N'EXPIRE JAMAIS. Le stock de
//          prestations se vide et ne se recharge pas (≠ Forfait).
//          Prix = −20 % vs la somme à l'unité, arrondi au multiple de 500
//          (`priceOverrideFcfa` permet à la propriétaire de forcer un prix).
//
// Différence clé Pack vs Forfait : le pack est un achat unique qui se vide ;
// le forfait est un engagement récurrent qui se recharge à chaque cycle.
//
// Les `prestationIds` référencent le catalogue réel `@/lib/mock/services`.

import { prestationSeeds } from "./services";

/* ------------------------------------------------------------------ Type */

export type Pack = {
  id: string;
  label: string;
  image?: string;
  video?: string;
  description: string;
  prestationIds: string[];
  // Prix forcé par la propriétaire ; `null` = prix dérivé (formule −20 %).
  priceOverrideFcfa: number | null;
};

/* ---------------------------------------------------------------- Constantes */

export const PACK_DISCOUNT = 0.8; // −20 %
export const PACK_ROUND_TO = 500; // arrondi au multiple de 500 FCFA

/* ------------------------------------------------------------------ Seeds */

// 4 packs (spec §2.3). `priceOverrideFcfa: null` → prix dérivé.
export const packSeeds: Pack[] = [
  {
    id: "eclat-express",
    label: "Pack Éclat Express",
    description: "Brushing, vernis simple mains et épilation des sourcils.",
    prestationIds: [
      "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire",
      "manucure-pedicure-vernis-simple-mains-classique-et-halal",
      "epilation-epilation-sourcils",
    ],
    priceOverrideFcfa: null,
  },
  {
    id: "cocooning-duo",
    label: "Pack Cocooning Duo",
    description: "Soin du dos et réflexologie plantaire.",
    prestationIds: ["spa-soin-du-dos", "spa-reflexology"],
    priceOverrideFcfa: null,
  },
  {
    id: "beaute-des-mains",
    label: "Pack Beauté des Mains",
    description: "Manucure spa express, pédicure spa et remplissage gel.",
    prestationIds: [
      "manucure-pedicure-manucure-spa-express",
      "manucure-pedicure-pedicure-me-spa",
      "onglerie-remplissage-gel",
    ],
    priceOverrideFcfa: null,
  },
  {
    id: "glow-total",
    label: "Pack Glow Total",
    description:
      "Soin du visage éclat, pack épilations complètes et manucure russe.",
    prestationIds: [
      "soin-du-visage-glow-me-facial",
      "epilation-pack-epilations-completes",
      "manucure-pedicure-manucure-russe-sans-vernis-sans-gel",
    ],
    priceOverrideFcfa: null,
  },
];

/* ------------------------------------------------------------------ Helpers */

export type PackPrestation = {
  id: string;
  label: string;
  priceFcfa: number;
  durationMin: number;
  missing: boolean;
};

// Résout les ids d'un pack → nom + prix + durée à l'unité.
export const getPackPrestations = (pack: Pack): PackPrestation[] =>
  pack.prestationIds.map((id) => {
    const p = prestationSeeds.find((x) => x.id === id);
    return {
      id,
      label: p?.name ?? id,
      priceFcfa: p?.priceFcfa ?? 0,
      durationMin: p?.durationMin ?? 0,
      missing: !p,
    };
  });

// Somme des prix à l'unité des prestations du pack.
export const getPackIndividualTotal = (pack: Pack): number =>
  getPackPrestations(pack).reduce((sum, p) => sum + p.priceFcfa, 0);

// Prix packagé : override si défini, sinon −20 % arrondi au multiple de 500
// (spec §3.2 / invariant §5).
export const getPackPrice = (pack: Pack): number => {
  if (pack.priceOverrideFcfa != null) return pack.priceOverrideFcfa;
  const total = getPackIndividualTotal(pack);
  return Math.round((total * PACK_DISCOUNT) / PACK_ROUND_TO) * PACK_ROUND_TO;
};

// Économie réalisée vs achat à l'unité.
export const getPackSavings = (pack: Pack): number =>
  Math.max(0, getPackIndividualTotal(pack) - getPackPrice(pack));

let seq = 0;
export const newPackId = () => `pack-${Date.now().toString(36)}-${seq++}`;
