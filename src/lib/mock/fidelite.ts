// Données fictives — programme de fidélité Beauty & Co. Front-end uniquement,
// aucune API, aucune persistance : l'écran /fidelite édite ces valeurs en mémoire
// de session. Volontairement indépendant du barrel `@/lib/mock` : importer
// directement ce fichier (`@/lib/mock/fidelite`).

import { fcfa, groupThousands } from "./beautyandco";
import { prestationSeeds, productName } from "./services";

/* ------------------------------------------------------------------ Réglages */

export type AccrualBasis = "visit" | "amount";
export type Rounding = "down" | "up" | "nearest";

export type LoyaltySettings = {
  enabled: boolean; // Programme activé
  basis: AccrualBasis; // Base d'accumulation
  rounding: Rounding; // Arrondi des points
  pointsPerVisit: number; // Points crédités par visite (base « Par visite »)
  fcfaPerPoint: number; // Montant pour 1 point (base « Par montant dépensé »)
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
};

/* -------------------------------------------------------------------- Paliers */
/* Carte de fidélité : un palier atteint selon le total de points cumulé.      */

export type LoyaltyTier = {
  id: string;
  name: string; // « Silver », « Gold », « Platinum », « VIP »…
  minPoints: number; // seuil d'entrée dans le palier
  // Teinte métallique du badge, celle des paliers de point-de-vente
  // (`--pos-tier-*`, `Badge` variantes silver/gold/platinum/vip). Absente pour
  // un palier créé par la propriétaire → badge neutre.
  badge?: "silver" | "gold" | "platinum" | "vip";
};

// Les 4 paliers de point-de-vente (`ClientTier` / `TIER_LABEL` : Silver, Gold,
// Platinum, VIP — 2026-09-27, remplace Argent/Or/VIP) : mêmes libellés et
// mêmes badges que la caisse. Le back-office définit en plus le seuil de chaque
// palier, que point-de-vente ne connaît pas.
export const defaultTiers: LoyaltyTier[] = [
  { id: "tier-silver", name: "Silver", minPoints: 200, badge: "silver" },
  { id: "tier-gold", name: "Gold", minPoints: 500, badge: "gold" },
  { id: "tier-platinum", name: "Platinum", minPoints: 1000, badge: "platinum" },
  { id: "tier-vip", name: "VIP", minPoints: 2000, badge: "vip" },
];

/* ---------------------------------------------------------------- Récompenses */

export type RewardType = "fixed" | "percent" | "service" | "product";

export type LoyaltyReward = {
  id: string;
  name: string;
  costPoints: number; // coût en points
  type: RewardType;
  value: number; // FCFA (remise fixe) ou pourcentage (remise en %) ; 0 si offert
  // Prestation (id catalogue) ou produit (id produit) offert — types
  // « service » / « product » uniquement.
  itemId?: string;
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

// Résumé lisible de ce que vaut une récompense, selon son type.
export const rewardValueLabel = (r: LoyaltyReward) => {
  switch (r.type) {
    case "fixed":
      return `Remise de ${fcfa(r.value)}`;
    case "percent":
      return `Remise de ${r.value} %`;
    case "service": {
      const name = prestationSeeds.find((p) => p.id === r.itemId)?.name;
      return name ? `Offert : ${name}` : "Prestation offerte";
    }
    case "product":
      return r.itemId ? `Offert : ${productName(r.itemId)}` : "Produit offert";
  }
};
