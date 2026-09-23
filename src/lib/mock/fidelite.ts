// Données fictives — programme de fidélité Beauty & Co. Front-end uniquement,
// aucune API, aucune persistance : l'écran /fidelite édite ces valeurs en mémoire
// de session. Volontairement indépendant du barrel `@/lib/mock` : importer
// directement ce fichier (`@/lib/mock/fidelite`).

import { fcfa, groupThousands } from "./beautyandco";

/* ------------------------------------------------------------------ Réglages */

export type AccrualBasis = "visit" | "amount";
export type Rounding = "down" | "up" | "nearest";

export type LoyaltySettings = {
  enabled: boolean; // Programme activé
  basis: AccrualBasis; // Base d'accumulation
  rounding: Rounding; // Arrondi des points
  pointsPerVisit: number; // Points crédités par visite (base « Par visite »)
  fcfaPerPoint: number; // Montant pour 1 point (base « Par montant dépensé »)
  guestsEligible: boolean; // Clients invités éligibles (sans compte)
  pointsExpire: boolean; // Expiration des points inactifs
  minRedeemBalance: number; // Solde minimum pour échanger une récompense
};

export const ACCRUAL_BASIS_OPTIONS: { value: AccrualBasis; label: string }[] = [
  { value: "visit", label: "Par visite" },
  { value: "amount", label: "Par montant dépensé" },
];

export const ROUNDING_OPTIONS: { value: Rounding; label: string }[] = [
  { value: "down", label: "Inférieur" },
  { value: "up", label: "Supérieur" },
  { value: "nearest", label: "Au plus proche" },
];

// Base d'accumulation par défaut alignée sur la règle réellement appliquée
// côté point-de-vente (`confirmPayment`, `lib/store/app-store.ts`) : 10 points
// par tranche de 1.000 FCFA dépensés, soit 1 point par tranche de 100 FCFA —
// « par montant dépensé », pas « par visite ». Reste un réglage de session
// modifiable depuis l'écran Fidélité, pas une règle figée.
export const defaultSettings: LoyaltySettings = {
  enabled: true,
  basis: "amount",
  rounding: "down",
  pointsPerVisit: 10,
  fcfaPerPoint: 100,
  guestsEligible: true,
  pointsExpire: false,
  minRedeemBalance: 0,
};

/* -------------------------------------------------------------------- Paliers */
/* Carte de fidélité : un multiplicateur de points selon le total cumulé.       */

export type LoyaltyTier = {
  id: string;
  name: string; // « Argent », « Or », « Platine »…
  minPoints: number; // seuil d'entrée dans le palier
  multiplierPct: number; // 150 → ×1,50 · 100 = taux de base
};

// Vocabulaire aligné sur `Cliente.tier` de point-de-vente (`"silver" | "gold" |
// "vip"`, jamais calculé côté point-de-vente — un champ statique de seed) :
// mêmes noms, mais back-office garde son mécanisme de seuils/multiplicateur
// dérivé des points, plus riche que la simple étiquette figée de point-de-vente.
export const defaultTiers: LoyaltyTier[] = [
  { id: "tier-argent", name: "Argent", minPoints: 200, multiplierPct: 150 },
  { id: "tier-or", name: "Or", minPoints: 500, multiplierPct: 200 },
  { id: "tier-vip", name: "VIP", minPoints: 1000, multiplierPct: 250 },
];

/* ---------------------------------------------------------------- Récompenses */

export type RewardType = "fixed" | "percent" | "service" | "product";

export type LoyaltyReward = {
  id: string;
  name: string;
  costPoints: number; // coût en points
  type: RewardType;
  value: number; // FCFA (remise fixe) ou pourcentage (remise en %)
  description?: string;
};

export const REWARD_TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: "fixed", label: "Remise fixe (FCFA)" },
  { value: "percent", label: "Remise en %" },
  { value: "service", label: "Prestation offerte" },
  { value: "product", label: "Produit offert" },
];

export const rewardTypeLabel = (t: RewardType) =>
  REWARD_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;

export const defaultRewards: LoyaltyReward[] = [
  { id: "reward-1000", name: "Réduction 1000 FCFA", costPoints: 5, type: "fixed", value: 1000 },
  { id: "reward-2000", name: "Réduction 2000 FCFA", costPoints: 50, type: "fixed", value: 2000 },
  { id: "reward-10pct", name: "10 % de remise", costPoints: 100, type: "percent", value: 10 },
];

/* -------------------------------------------------------------------- Helpers */

// « 1.250 pts » — les points suivent la règle des milliers (point séparateur).
export const points = (n: number) => `${groupThousands(n)} pts`;

// 150 → « ×1,50 »
export const multiplier = (pct: number) =>
  `×${(pct / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Résumé lisible de ce que vaut une récompense, selon son type.
export const rewardValueLabel = (r: LoyaltyReward) => {
  switch (r.type) {
    case "fixed":
      return `Remise de ${fcfa(r.value)}`;
    case "percent":
      return `Remise de ${r.value} %`;
    case "service":
      return "Prestation offerte";
    case "product":
      return "Produit offert";
  }
};
