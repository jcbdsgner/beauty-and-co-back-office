// Données fictives « Stock » — front-end uniquement, aucune API, aucune persistance.
// Indépendant du barrel `@/lib/mock` : importer directement `@/lib/mock/stock`.
//
// Le stock est sorti du parcours « Services » : ici on suit les niveaux par
// produit et par EMPLACEMENT (les salons + une réserve centrale), la
// consommation (ventes au détail + produits absorbés par les recettes de
// prestation), et on projette la date de rupture.
//
// Deux niveaux d'alerte :
//   1. un salon passe sous son seuil → réappro salon (transfert depuis la
//      réserve, ou commande) ;
//   2. le total entreprise (réserve + tous les salons) passe sous le seuil
//      entreprise → commande fournisseur.
//
// L'historique de mouvements est synthétisé au chargement à partir d'un taux de
// consommation hebdomadaire par produit / salon (pas de saisie ligne à ligne).
// Les niveaux courants (`productStock`) sont, eux, posés à la main pour tenir
// des cas de démonstration (produits tendus, produit jamais inventorié,
// consommation nulle sur un produit encore présent dans une recette, réserve
// pleine face à des salons courts…).

import {
  salons,
  salonName,
  frShortDate,
  groupThousands,
  type SalonId,
  type SalonScope,
} from "./beautyandco";
import { products, prestationSeeds, type Product } from "./services";
import type { AppNotification } from "./notifications";

export { frShortDate };

/* ------------------------------------------------------------------ */
/* Repères temporels                                                   */
/* ------------------------------------------------------------------ */

const TODAY_ISO = "2026-09-03";
const DAY_MS = 86_400_000;
const TODAY_MS = new Date(`${TODAY_ISO}T00:00:00`).getTime();

const SALON_IDS: SalonId[] = salons.map((s) => s.id);

const tms = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Hash déterministe d'une chaîne → [0, 1) (variation reproductible des seeds).
const pseudo = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

// Arrondi à un conditionnement « commandable » (multiple de 5, minimum 5).
const roundPack = (n: number) => Math.max(5, Math.ceil(n / 5) * 5);

/* ------------------------------------------------------------------ */
/* Emplacements — les salons + la réserve centrale                     */
/* ------------------------------------------------------------------ */

export type StockLocation = SalonId | "reserve";

export const RESERVE = "reserve" as const;

// Réserve d'abord, puis les salons.
export const STOCK_LOCATIONS: StockLocation[] = [RESERVE, ...SALON_IDS];

export const isReserve = (loc: StockLocation): loc is "reserve" => loc === RESERVE;

export const locationName = (loc: StockLocation) =>
  isReserve(loc) ? "Réserve centrale" : salonName(loc);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type MovementReason =
  | "sale"
  | "recipe"
  | "restock"
  | "transfer"
  | "adjust"
  | "inventory";

export const MOVEMENT_REASON_LABELS: Record<MovementReason, string> = {
  sale: "Vente au détail",
  recipe: "Prestation",
  restock: "Réception fournisseur",
  transfer: "Transfert",
  adjust: "Ajustement",
  inventory: "Inventaire",
};

export const movementReasonLabel = (r: MovementReason) => MOVEMENT_REASON_LABELS[r];

export type StockMovement = {
  id: string;
  productId: string;
  location: StockLocation;
  date: string; // ISO yyyy-mm-dd
  qty: number; // > 0 entrée, < 0 sortie
  reason: MovementReason;
  note?: string;
};

export type ProductStock = {
  productId: string;
  location: StockLocation;
  onHand: number | null; // null = jamais inventorié
  min: number; // seuil propre à l'emplacement (seuil salon ; 0 pour la réserve)
  leadDays: number; // délai de réappro fournisseur (pertinent surtout pour la réserve)
};

/* ------------------------------------------------------------------ */
/* Seeds — taux de consommation + niveau courant par produit / lieu    */
/* ------------------------------------------------------------------ */

type LocationStockSeed = {
  onHand: number | null;
  weekly: number; // consommation « vraie » (unités / semaine) — 0 pour la réserve
  manual?: number; // estimation manuelle pour le modèle de projection « manual »
};

type StockSeed = {
  productId: string;
  min: number; // seuil par salon
  companyMin: number; // seuil entreprise (total réserve + salons)
  leadDays: number;
  weeksHistory: number; // longueur de l'historique synthétisé
  seasonalPct: number; // facteur « même période l'an dernier » (100 = neutre)
  byLocation: Partial<Record<StockLocation, LocationStockSeed>>;
};

// `weekly` mélange des unités hétérogènes (ml, pièces…) : le stock est compté
// « en unités » de façon lâche, comme le reste des fixtures. Les niveaux courants
// sont dérivés du total réel `stock` de point-de-vente/lib/data/menu.ts (`PRODUITS`),
// réparti entre réserve / Almadies / Sea Plaza (répartition inventée — point-de-vente
// ne suit qu'un total, sans détail par emplacement) ; `weekly` / `min` / `companyMin`
// sont également inventés pour que les projections et seuils restent fonctionnels.
// Kérastase = produit importé (leadDays 21) ; boissons = réappro local (leadDays 4).
const STOCK_SEEDS: StockSeed[] = [
  {
    productId: "nutritive-8hmns-serum-90ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 7, weekly: 0 },
      almadies: { onHand: 8, weekly: 1.2 },
      seaplaza: { onHand: 3, weekly: 0.8 },
    },
  },
  {
    productId: "nutritive-bain-riche-250ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 16, weekly: 0 },
      almadies: { onHand: 29, weekly: 3.4 },
      seaplaza: { onHand: 10, weekly: 2.2 },
    },
  },
  {
    productId: "nutritive-bain-satin-250ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 13, weekly: 1.9 },
      seaplaza: { onHand: 5, weekly: 1.2 },
    },
  },
  {
    productId: "nutritive-lait-vital-200ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 0, weekly: 0 },
      seaplaza: { onHand: 1, weekly: 0 },
    },
  },
  {
    productId: "nutritive-masque-riche-200ml", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 14, weekly: 0 },
      almadies: { onHand: 18, weekly: 3 },
      seaplaza: { onHand: 6, weekly: 2 },
    },
  },
  {
    productId: "nutritive-masque-intense-200ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 4, weekly: 0 },
      almadies: { onHand: 5, weekly: 0.7 },
      seaplaza: { onHand: 2, weekly: 0.5 },
    },
  },
  {
    productId: "nutritive-nectar-therm-150ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 17, weekly: 0 },
      almadies: { onHand: 23, weekly: 4.5 },
      seaplaza: { onHand: 8, weekly: 3 },
    },
  },
  {
    productId: "nutritive-scalp-serum-90ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 7, weekly: 0 },
      almadies: { onHand: 10, weekly: 1.7 },
      seaplaza: { onHand: 4, weekly: 1.1 },
    },
  },
  {
    productId: "nutritive-soin-150ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 20, weekly: 0 },
      almadies: { onHand: 28, weekly: 4 },
      seaplaza: { onHand: 10, weekly: 2.6 },
    },
  },
  {
    productId: "genesis-bain-riche-250ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 1, weekly: 0 },
      almadies: { onHand: 2, weekly: 0.7 },
      seaplaza: { onHand: 1, weekly: 0.5 },
    },
  },
  {
    productId: "genesis-cure-90ml", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 14, weekly: 0 },
      almadies: { onHand: 20, weekly: 2.9 },
      seaplaza: { onHand: 7, weekly: 1.9 },
    },
  },
  {
    productId: "genesis-fluide-150ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 4, weekly: 0 },
      almadies: { onHand: 8, weekly: 1.2 },
      seaplaza: { onHand: 2, weekly: 0.8 },
    },
  },
  {
    productId: "genesis-masque-200ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 15, weekly: 0 },
      almadies: { onHand: 27, weekly: 3.9 },
      seaplaza: { onHand: 9, weekly: 2.6 },
    },
  },
  {
    productId: "gloss-absolu-bain-250ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 0, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "k-gloss-absolu-bain-riche-250ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 13, weekly: 0 },
      almadies: { onHand: 16, weekly: 1.9 },
      seaplaza: { onHand: 5, weekly: 1.3 },
    },
  },
  {
    productId: "k-gloss-absolu-fondant-250ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 2, weekly: 0 },
      almadies: { onHand: 3, weekly: 0.5 },
      seaplaza: { onHand: 2, weekly: 0.3 },
    },
  },
  {
    productId: "k-gloss-absolu-cream-250ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 16, weekly: 0 },
      almadies: { onHand: 21, weekly: 3.1 },
      seaplaza: { onHand: 7, weekly: 2.1 },
    },
  },
  {
    productId: "k-gloss-absolu-hair-mist-30ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 5, weekly: 0 },
      almadies: { onHand: 9, weekly: 1.2 },
      seaplaza: { onHand: 3, weekly: 0.8 },
    },
  },
  {
    productId: "k-gloss-absolu-masque-nutritive-200ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 17, weekly: 0 },
      almadies: { onHand: 27, weekly: 3.1 },
      seaplaza: { onHand: 10, weekly: 2.1 },
    },
  },
  {
    productId: "k-gloss-absolu-oil-45ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 9, weekly: 0 },
      almadies: { onHand: 14, weekly: 1.4 },
      seaplaza: { onHand: 4, weekly: 0.9 },
    },
  },
  {
    productId: "k-gloss-absolu-spray-190ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 0, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "k-symbiose-bain-creme-250ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 4, weekly: 0 },
      almadies: { onHand: 5, weekly: 0.5 },
      seaplaza: { onHand: 1, weekly: 0.4 },
    },
  },
  {
    productId: "k-symbiose-bain-purete-250ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 14, weekly: 0 },
      almadies: { onHand: 24, weekly: 2.8 },
      seaplaza: { onHand: 9, weekly: 1.9 },
    },
  },
  {
    productId: "k-symbiose-fondant-hydra-200ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 6, weekly: 0 },
      almadies: { onHand: 11, weekly: 2.1 },
      seaplaza: { onHand: 3, weekly: 1.4 },
    },
  },
  {
    productId: "k-symbiose-masque-200ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 18, weekly: 0 },
      almadies: { onHand: 29, weekly: 4.4 },
      seaplaza: { onHand: 10, weekly: 2.9 },
    },
  },
  {
    productId: "k-symbiose-micropeel-200ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 9, weekly: 0 },
      almadies: { onHand: 16, weekly: 3 },
      seaplaza: { onHand: 5, weekly: 2 },
    },
  },
  {
    productId: "k-symbiose-serum-90ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 1, weekly: 0 },
      almadies: { onHand: 1, weekly: 0 },
      seaplaza: { onHand: 1, weekly: 0 },
    },
  },
  {
    productId: "k-chroma-absolu-bain-lim-us-250ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 4, weekly: 0 },
      almadies: { onHand: 7, weekly: 0.9 },
      seaplaza: { onHand: 2, weekly: 0.6 },
    },
  },
  {
    productId: "k-chroma-absolu-bain-opa-us-250ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 17, weekly: 0 },
      almadies: { onHand: 24, weekly: 4.5 },
      seaplaza: { onHand: 9, weekly: 3 },
    },
  },
  {
    productId: "k-chroma-absolu-fluide-250ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 8, weekly: 0 },
      almadies: { onHand: 11, weekly: 2.1 },
      seaplaza: { onHand: 4, weekly: 1.4 },
    },
  },
  {
    productId: "k-chroma-absolu-fondant-200ml", min: 12, companyMin: 28, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 22, weekly: 0 },
      almadies: { onHand: 28, weekly: 3.5 },
      seaplaza: { onHand: 10, weekly: 2.3 },
    },
  },
  {
    productId: "k-chroma-absolu-leave-in-150ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 9, weekly: 0 },
      almadies: { onHand: 18, weekly: 1.9 },
      seaplaza: { onHand: 6, weekly: 1.3 },
    },
  },
  {
    productId: "k-chroma-absolu-mask-reco-200ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 2, weekly: 0 },
      almadies: { onHand: 3, weekly: 0.4 },
      seaplaza: { onHand: 1, weekly: 0.3 },
    },
  },
  {
    productId: "k-chroma-oil-75ml", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 12, weekly: 0 },
      almadies: { onHand: 23, weekly: 2.8 },
      seaplaza: { onHand: 8, weekly: 1.9 },
    },
  },
  {
    productId: "k-chroma-oil", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 5, weekly: 0 },
      almadies: { onHand: 8, weekly: 1.5 },
      seaplaza: { onHand: 3, weekly: 1 },
    },
  },
  {
    productId: "k-blond-absolu-night-serum-90ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 8, weekly: 0 },
      almadies: { onHand: 13, weekly: 2 },
      seaplaza: { onHand: 5, weekly: 1.3 },
    },
  },
  {
    productId: "k-blond-oil-75ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 0, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "k-blond-oil-75ml-2", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 12, weekly: 0 },
      almadies: { onHand: 18, weekly: 2.5 },
      seaplaza: { onHand: 6, weekly: 1.7 },
    },
  },
  {
    productId: "ker-blond-bain-uviolet-250ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 3, weekly: 0 },
      almadies: { onHand: 5, weekly: 0.7 },
      seaplaza: { onHand: 1, weekly: 0.5 },
    },
  },
  {
    productId: "ker-blond-cicaflash-250ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 13, weekly: 0 },
      almadies: { onHand: 25, weekly: 3 },
      seaplaza: { onHand: 8, weekly: 2 },
    },
  },
  {
    productId: "ker-blond-cicaplasme-150ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 6, weekly: 0 },
      almadies: { onHand: 10, weekly: 1.2 },
      seaplaza: { onHand: 3, weekly: 0.8 },
    },
  },
  {
    productId: "ker-blond-masque-ultravio", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 19, weekly: 0 },
      almadies: { onHand: 28, weekly: 3.6 },
      seaplaza: { onHand: 9, weekly: 2.4 },
    },
  },
  {
    productId: "k-chrono-oil-75ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 1, weekly: 0 },
      almadies: { onHand: 1, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "k-chrono-oil-75ml-2", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 14, weekly: 0 },
      almadies: { onHand: 19, weekly: 3.2 },
      seaplaza: { onHand: 6, weekly: 2.1 },
    },
  },
  {
    productId: "k-chrono-bain-250ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 4, weekly: 0 },
      almadies: { onHand: 6, weekly: 1.3 },
      seaplaza: { onHand: 2, weekly: 0.9 },
    },
  },
  {
    productId: "k-chrono-masque-200ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 19, weekly: 0 },
      almadies: { onHand: 23, weekly: 3.4 },
      seaplaza: { onHand: 7, weekly: 2.3 },
    },
  },
  {
    productId: "k-chrono-pre-shampoing-200ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 7, weekly: 0 },
      almadies: { onHand: 11, weekly: 1.6 },
      seaplaza: { onHand: 4, weekly: 1.1 },
    },
  },
  {
    productId: "ks-chrono-thermique-150ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 19, weekly: 0 },
      almadies: { onHand: 30, weekly: 5.4 },
      seaplaza: { onHand: 10, weekly: 3.6 },
    },
  },
  {
    productId: "k-chrono-bain-250ml-2", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 16, weekly: 2.5 },
      seaplaza: { onHand: 6, weekly: 1.7 },
    },
  },
  {
    productId: "ker-res-masque-force-archi-200ml", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 13, weekly: 0 },
      almadies: { onHand: 22, weekly: 2.2 },
      seaplaza: { onHand: 7, weekly: 1.4 },
    },
  },
  {
    productId: "ker-resist-bain-force-archi-250m", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 5, weekly: 0 },
      almadies: { onHand: 8, weekly: 1.4 },
      seaplaza: { onHand: 2, weekly: 0.9 },
    },
  },
  {
    productId: "ker-resisr-ciment-anti-usure-200ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 17, weekly: 0 },
      almadies: { onHand: 26, weekly: 4.6 },
      seaplaza: { onHand: 9, weekly: 3.1 },
    },
  },
  {
    productId: "ker-res-serum-therapiste-2-15ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 0, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "ker-res-serum-bain-therapiste-250ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 11, weekly: 0 },
      almadies: { onHand: 18, weekly: 2.3 },
      seaplaza: { onHand: 6, weekly: 1.5 },
    },
  },
  {
    productId: "bain-nourissant-curl-250ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 16, weekly: 0 },
      almadies: { onHand: 21, weekly: 3.1 },
      seaplaza: { onHand: 8, weekly: 2.1 },
    },
  },
  {
    productId: "creme-curl-150ml", min: 3, companyMin: 7, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 5, weekly: 0 },
      almadies: { onHand: 10, weekly: 1.3 },
      seaplaza: { onHand: 3, weekly: 0.9 },
    },
  },
  {
    productId: "gelee-curl-150ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 17, weekly: 0 },
      almadies: { onHand: 29, weekly: 5.1 },
      seaplaza: { onHand: 9, weekly: 3.4 },
    },
  },
  {
    productId: "curl-huile-50ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 13, weekly: 1.9 },
      seaplaza: { onHand: 5, weekly: 1.3 },
    },
  },
  {
    productId: "lotion-refresher-curl-190ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 1, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "masque-curl-200ml", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 12, weekly: 0 },
      almadies: { onHand: 19, weekly: 3.7 },
      seaplaza: { onHand: 7, weekly: 2.5 },
    },
  },
  {
    productId: "k-alpha-bain-renovateur-250ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 16, weekly: 0 },
      almadies: { onHand: 24, weekly: 2.8 },
      seaplaza: { onHand: 8, weekly: 1.9 },
    },
  },
  {
    productId: "k-alpha-fondant-fluidity-200ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 7, weekly: 0 },
      almadies: { onHand: 11, weekly: 2.1 },
      seaplaza: { onHand: 3, weekly: 1.4 },
    },
  },
  {
    productId: "k-alpha-huile-lumiere-30ml", min: 11, companyMin: 25, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 21, weekly: 0 },
      almadies: { onHand: 27, weekly: 3.7 },
      seaplaza: { onHand: 10, weekly: 2.5 },
    },
  },
  {
    productId: "k-alpha-lotion-jelly-250ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 15, weekly: 2.7 },
      seaplaza: { onHand: 6, weekly: 1.8 },
    },
  },
  {
    productId: "k-alpha-masque-fill-force-200ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 1, weekly: 0 },
      almadies: { onHand: 2, weekly: 0.5 },
      seaplaza: { onHand: 1, weekly: 0.4 },
    },
  },
  {
    productId: "k-alpha-serum-fondamental-90ml", min: 8, companyMin: 18, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 15, weekly: 0 },
      almadies: { onHand: 19, weekly: 3.8 },
      seaplaza: { onHand: 7, weekly: 2.6 },
    },
  },
  {
    productId: "k-elixir-oil-75ml", min: 9, companyMin: 21, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 17, weekly: 0 },
      almadies: { onHand: 25, weekly: 3 },
      seaplaza: { onHand: 9, weekly: 2 },
    },
  },
  {
    productId: "k-elixir-oil-30ml", min: 5, companyMin: 12, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 9, weekly: 0 },
      almadies: { onHand: 12, weekly: 2 },
      seaplaza: { onHand: 3, weekly: 1.3 },
    },
  },
  {
    productId: "ker-elixir-ult-bain-250ml", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 0, weekly: 0 },
      almadies: { onHand: 0, weekly: 0 },
      seaplaza: { onHand: 0, weekly: 0 },
    },
  },
  {
    productId: "ker-elixir-ult-masque-200ml", min: 6, companyMin: 14, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 18, weekly: 3 },
      seaplaza: { onHand: 6, weekly: 2 },
    },
  },
  {
    productId: "boisson-pure-glow", min: 12, companyMin: 28, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 12, weekly: 0 },
      almadies: { onHand: 15, weekly: 6 },
      seaplaza: { onHand: 5, weekly: 4 },
    },
  },
  {
    productId: "boisson-dragon-mystic", min: 11, companyMin: 25, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 14, weekly: 5.2 },
      seaplaza: { onHand: 4, weekly: 3.5 },
    },
  },
  {
    productId: "boisson-pause-tropical", min: 9, companyMin: 21, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 8, weekly: 0 },
      almadies: { onHand: 12, weekly: 3.6 },
      seaplaza: { onHand: 4, weekly: 2.4 },
    },
  },
  {
    productId: "boisson-eclat-matcha", min: 12, companyMin: 28, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 15, weekly: 4.1 },
      seaplaza: { onHand: 5, weekly: 2.8 },
    },
  },
  {
    productId: "boisson-ice-coffee-caramel", min: 11, companyMin: 25, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 9, weekly: 0 },
      almadies: { onHand: 13, weekly: 3.5 },
      seaplaza: { onHand: 4, weekly: 2.3 },
    },
  },
  {
    productId: "boisson-soin-glace-ice-tea", min: 14, companyMin: 32, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 10, weekly: 0 },
      almadies: { onHand: 19, weekly: 5.6 },
      seaplaza: { onHand: 6, weekly: 3.8 },
    },
  },
  {
    productId: "boisson-pretty-latte", min: 9, companyMin: 21, leadDays: 4, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 6, weekly: 0 },
      almadies: { onHand: 12, weekly: 4 },
      seaplaza: { onHand: 4, weekly: 2.7 },
    },
  },
  // Autres marques + accessoires — vendus au détail, sans recette (pas de gamme
  // Kérastase). Faible rotation, petites quantités : onHand aligné sur le total
  // `stock` de point-de-vente/lib/data/menu.ts (PRODUITS), réparti réserve/salons.
  {
    productId: "antiseptique-saryna-keys", min: 3, companyMin: 8, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 8, weekly: 0 },
      almadies: { onHand: 10, weekly: 1.4 },
      seaplaza: { onHand: 6, weekly: 0.9 },
    },
  },
  {
    productId: "damage-repair-oil-saryna-keys", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 6, weekly: 0 },
      almadies: { onHand: 7, weekly: 0.6 },
      seaplaza: { onHand: 3, weekly: 0.3 },
    },
  },
  {
    productId: "nefertiti-kinky-straight", min: 1, companyMin: 2, leadDays: 28, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 3, weekly: 0 },
      almadies: { onHand: 1, weekly: 0.15 },
      seaplaza: { onHand: 1, weekly: 0.1 },
    },
  },
  // Démonstration du cas « jamais inventorié » : jamais compté à Sea Plaza
  // (produit rare, arrivé récemment au catalogue) → locationOnHand null,
  // badge « Niveau inconnu » sur ce salon dans la liste Stock.
  {
    productId: "hd-lace-frontal-nefertiti-kinky-straight", min: 1, companyMin: 2, leadDays: 28, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 2, weekly: 0 },
      almadies: { onHand: 1, weekly: 0.1 },
      seaplaza: { onHand: null, weekly: 0 },
    },
  },
  {
    productId: "ready-made-ponytail-beccy-wave", min: 1, companyMin: 2, leadDays: 28, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 2, weekly: 0 },
      almadies: { onHand: 1, weekly: 0.1 },
      seaplaza: { onHand: 1, weekly: 0.05 },
    },
  },
  {
    productId: "becky-wave-raw-hair", min: 1, companyMin: 3, leadDays: 28, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 3, weekly: 0 },
      almadies: { onHand: 2, weekly: 0.2 },
      seaplaza: { onHand: 1, weekly: 0.1 },
    },
  },
  {
    productId: "correcteur-fluide-swiss-perfection-haute-couvrance", min: 2, companyMin: 5, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 5, weekly: 0 },
      almadies: { onHand: 6, weekly: 0.5 },
      seaplaza: { onHand: 3, weekly: 0.3 },
    },
  },
  {
    productId: "peigne-bijou-eclat-de-mariee-finition-or-rose", min: 2, companyMin: 4, leadDays: 21, weeksHistory: 8, seasonalPct: 100,
    byLocation: {
      reserve: { onHand: 5, weekly: 0 },
      almadies: { onHand: 3, weekly: 0.15 },
      seaplaza: { onHand: 2, weekly: 0.1 },
    },
  },
];

const seedOf = (productId: string) => STOCK_SEEDS.find((s) => s.productId === productId);

/* ------------------------------------------------------------------ */
/* Niveaux courants                                                    */
/* ------------------------------------------------------------------ */

export const productStock: ProductStock[] = STOCK_SEEDS.flatMap((seed) =>
  STOCK_LOCATIONS.filter((loc) => seed.byLocation[loc]).map((loc) => ({
    productId: seed.productId,
    location: loc,
    onHand: seed.byLocation[loc]!.onHand,
    min: isReserve(loc) ? 0 : seed.min,
    leadDays: seed.leadDays,
  })),
);

const stockOf = (productId: string, location: StockLocation) =>
  productStock.find((s) => s.productId === productId && s.location === location) ?? null;

// Emplacements réellement suivis pour un produit (au moins une ligne `productStock`).
export const productLocations = (productId: string): StockLocation[] =>
  STOCK_LOCATIONS.filter((loc) =>
    productStock.some((s) => s.productId === productId && s.location === loc),
  );

export const leadDaysFor = (productId: string) => {
  const cells = productStock.filter((s) => s.productId === productId);
  return cells.length ? Math.max(...cells.map((c) => c.leadDays)) : 7;
};

/* ------------------------------------------------------------------ */
/* Historique de mouvements — synthétisé au chargement                 */
/* ------------------------------------------------------------------ */

let mseq = 0;
const mkMov = (
  productId: string,
  location: StockLocation,
  dayMs: number,
  qty: number,
  reason: MovementReason,
  note?: string,
): StockMovement => ({
  id: `sm-${mseq++}`,
  productId,
  location,
  date: isoOf(dayMs),
  qty,
  reason,
  ...(note ? { note } : {}),
});

function buildMovements(): StockMovement[] {
  const out: StockMovement[] = [];
  for (const seed of STOCK_SEEDS) {
    const reserveSeed = seed.byLocation.reserve;
    const reserveTracked = !!reserveSeed && reserveSeed.onHand !== null;

    for (const salonId of SALON_IDS) {
      const sc = seed.byLocation[salonId];
      if (!sc || sc.onHand === null) continue;
      const { weekly } = sc;
      const cadence = weekly > 0 ? Math.max(2, Math.round((seed.min * 1.5) / weekly)) : 0;

      for (let w = seed.weeksHistory; w >= 1; w--) {
        const anchor = TODAY_MS - w * 7 * DAY_MS;
        if (weekly > 0) {
          const wob = 0.85 + 0.3 * pseudo(`${seed.productId}${salonId}${w}`);
          const total = weekly * wob;
          const sale = Math.round(total * 0.55);
          const rec = Math.round(total * 0.45);
          if (sale > 0) out.push(mkMov(seed.productId, salonId, anchor + 2 * DAY_MS, -sale, "sale"));
          if (rec > 0) out.push(mkMov(seed.productId, salonId, anchor + 4 * DAY_MS, -rec, "recipe"));
        }
        if (cadence > 0 && w % cadence === 0) {
          const pack = roundPack(weekly * cadence + seed.min * 0.5);
          if (reserveTracked) {
            // Réappro salon = transfert depuis la réserve (2 lignes).
            out.push(
              mkMov(seed.productId, "reserve", anchor + DAY_MS, -pack, "transfer", `Transfert vers ${salonName(salonId)}`),
            );
            out.push(
              mkMov(seed.productId, salonId, anchor + DAY_MS, pack, "transfer", "Transfert depuis la réserve"),
            );
          } else {
            out.push(
              mkMov(seed.productId, salonId, anchor + DAY_MS, pack, "restock", "Réception fournisseur"),
            );
          }
        }
      }
    }

    // Réceptions fournisseur dans la réserve : plus grosses, moins fréquentes.
    if (reserveTracked) {
      const salonWeekly = SALON_IDS.reduce(
        (s, id) => s + (seed.byLocation[id]?.weekly ?? 0),
        0,
      );
      const rCadence = salonWeekly > 0 ? Math.max(3, Math.round((seed.companyMin * 1.2) / salonWeekly)) : 0;
      for (let w = seed.weeksHistory; w >= 1; w--) {
        if (rCadence > 0 && w % rCadence === 0) {
          const anchor = TODAY_MS - w * 7 * DAY_MS;
          const pack = roundPack(salonWeekly * rCadence + seed.companyMin * 0.4);
          out.push(mkMov(seed.productId, "reserve", anchor, pack, "restock", "Réception fournisseur"));
        }
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export const stockMovements: StockMovement[] = buildMovements();

// Identifiant pour un mouvement ajouté en mémoire de session (formulaire « Ajuster » / « Transférer »).
export const newMovementId = () => `sm-user-${Date.now().toString(36)}-${mseq++}`;

/* ------------------------------------------------------------------ */
/* Niveaux dérivés (base + mouvements de session)                      */
/* ------------------------------------------------------------------ */

const sessionEffect = (
  productId: string,
  location: StockLocation,
  extra: StockMovement[],
) =>
  extra
    .filter((m) => m.productId === productId && m.location === location)
    .reduce((s, m) => s + m.qty, 0);

// Niveau d'un emplacement. null = jamais inventorié.
export function locationOnHand(
  productId: string,
  location: StockLocation,
  extra: StockMovement[] = [],
): number | null {
  const base = stockOf(productId, location);
  if (!base || base.onHand === null) return null;
  return base.onHand + sessionEffect(productId, location, extra);
}

export const reserveOnHand = (productId: string, extra: StockMovement[] = []) =>
  locationOnHand(productId, RESERVE, extra);

// Total entreprise = réserve + tous les salons. null si aucun emplacement inventorié.
export function companyOnHand(
  productId: string,
  extra: StockMovement[] = [],
): number | null {
  const vals = productLocations(productId).map((l) => locationOnHand(productId, l, extra));
  if (vals.every((v) => v === null)) return null;
  return vals.reduce((s: number, v) => s + (v ?? 0), 0);
}

/* ------------------------------------------------------------------ */
/* Consommation                                                        */
/* ------------------------------------------------------------------ */

const scopeLocations = (scope: SalonScope): StockLocation[] =>
  scope === "all" ? [...SALON_IDS] : [scope];

// Moyenne des sorties hebdomadaires (ventes + prestations, hors transferts) sur
// `weeks` dernières semaines, pour le périmètre demandé (les salons du scope).
export function weeklyConsumption(productId: string, scope: SalonScope, weeks = 4): number {
  const locs = scopeLocations(scope);
  const since = TODAY_MS - weeks * 7 * DAY_MS;
  const out = [...stockMovements]
    .filter(
      (m) =>
        m.productId === productId &&
        locs.includes(m.location) &&
        m.reason !== "transfer" &&
        m.qty < 0 &&
        tms(m.date) >= since,
    )
    .reduce((s, m) => s - m.qty, 0);
  return Math.round((out / weeks) * 10) / 10;
}

// Jours de couverture au rythme actuel. null = non calculable (conso nulle).
export function coverageDays(onHand: number, weekly: number): number | null {
  return weekly > 0 ? Math.round((onHand / weekly) * 7) : null;
}

export type CoverageTone = "error" | "warning" | "ok" | "none";

export const coverageTone = (days: number | null): CoverageTone =>
  days === null ? "none" : days < 7 ? "error" : days < 14 ? "warning" : "ok";

export const usedInRecipe = (productId: string) =>
  prestationSeeds.some((p) => p.recipe.some((r) => r.productId === productId));

// Prestations dont la recette prélève ce produit — liste complète, avec la
// quantité par visite. Pour la fiche produit (section « Utilisé dans… »).
export type PrestationUse = {
  id: string;
  name: string;
  serviceId: string | null;
  qty: number;
  unit: string;
};

export function prestationsUsing(productId: string): PrestationUse[] {
  return prestationSeeds
    .map((p): PrestationUse | null => {
      const items = p.recipe.filter((r) => r.productId === productId);
      if (items.length === 0) return null;
      return {
        id: p.id,
        name: p.name,
        serviceId: p.serviceId,
        qty: items.reduce((s, r) => s + r.qty, 0),
        unit: items[0].unit,
      };
    })
    .filter((x): x is PrestationUse => x !== null)
    .sort((a, b) => b.qty - a.qty);
}

// Fréquence indicative d'une prestation (pondère sa part dans la consommation) :
// dérivée de sa durée — les prestations courtes reviennent plus souvent dans
// l'agenda que les prestations longues.
const freq = (durationMin: number) => Math.max(1, Math.min(10, Math.round(180 / durationMin)));

export type ConsumptionBreakdown = {
  sales: number; // unités sorties « vente au détail »
  recipe: number; // unités absorbées par les prestations
  topPrestations: { name: string; pct: number }[];
};

export function consumptionBreakdown(
  productId: string,
  scope: SalonScope,
  weeks = 8,
): ConsumptionBreakdown {
  const locs = scopeLocations(scope);
  const since = TODAY_MS - weeks * 7 * DAY_MS;
  const rel = stockMovements.filter(
    (m) =>
      m.productId === productId &&
      locs.includes(m.location) &&
      m.qty < 0 &&
      tms(m.date) >= since,
  );
  const sales = rel.filter((m) => m.reason === "sale").reduce((s, m) => s - m.qty, 0);
  const recipe = rel.filter((m) => m.reason === "recipe").reduce((s, m) => s - m.qty, 0);

  const users = prestationSeeds
    .map((p) => ({
      p,
      qty: p.recipe.filter((r) => r.productId === productId).reduce((s, r) => s + r.qty, 0),
    }))
    .filter((x) => x.qty > 0);
  const wsum = users.reduce((s, x) => s + x.qty * freq(x.p.durationMin), 0);
  const topPrestations = users
    .map((x) => ({
      name: x.p.name,
      pct: wsum > 0 ? Math.round(((x.qty * freq(x.p.durationMin)) / wsum) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return { sales, recipe, topPrestations };
}

/* ------------------------------------------------------------------ */
/* Séries de niveau — sparkline liste + graphe fiche                   */
/* ------------------------------------------------------------------ */

// Niveaux de fin de semaine d'un emplacement, reconstitués en remontant
// l'historique (base + mouvements de session). Ancien → récent.
function levelSeries(
  productId: string,
  location: StockLocation,
  currentOnHand: number,
  weeks = 8,
  extra: StockMovement[] = [],
): number[] {
  const movs = [...stockMovements, ...extra].filter(
    (m) => m.productId === productId && m.location === location,
  );
  let lvl = currentOnHand;
  const marks: number[] = [];
  for (let w = 0; w < weeks; w++) {
    const weekEnd = TODAY_MS - w * 7 * DAY_MS;
    const weekStart = weekEnd - 7 * DAY_MS;
    marks.unshift(Math.max(0, Math.round(lvl)));
    const delta = movs
      .filter((m) => {
        const t = tms(m.date);
        return t > weekStart && t <= weekEnd;
      })
      .reduce((s, m) => s + m.qty, 0);
    lvl -= delta;
  }
  return marks;
}

export type LevelHistoryPoint = {
  label: string; // « 3 sept. »
  total: number;
  reserve: number;
  salons: number;
};

// Évolution du stock du produit (réserve + salons) sur `weeks` semaines.
export function levelHistory(
  productId: string,
  extra: StockMovement[] = [],
  weeks = 10,
): LevelHistoryPoint[] {
  const locs = productLocations(productId);
  const perLoc = locs.map((loc) => ({
    loc,
    series: levelSeries(productId, loc, locationOnHand(productId, loc, extra) ?? 0, weeks, extra),
  }));

  const points: LevelHistoryPoint[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekEndMs = TODAY_MS - (weeks - 1 - i) * 7 * DAY_MS;
    let reserve = 0;
    let salonsSum = 0;
    for (const { loc, series } of perLoc) {
      if (isReserve(loc)) reserve += series[i] ?? 0;
      else salonsSum += series[i] ?? 0;
    }
    points.push({
      label: frShortDate(isoOf(weekEndMs)),
      total: reserve + salonsSum,
      reserve,
      salons: salonsSum,
    });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Seuils modifiés en session                                          */
/* ------------------------------------------------------------------ */

export type ThresholdOverride = {
  company: Record<string, number>;
  bySalon: Record<string, Partial<Record<SalonId, number>>>;
};

export const emptyThresholds = (): ThresholdOverride => ({ company: {}, bySalon: {} });

export const seedCompanyMin = (productId: string) => seedOf(productId)?.companyMin ?? 0;
export const seedSalonMin = (productId: string) => seedOf(productId)?.min ?? 0;

export const effectiveCompanyMin = (productId: string, ov?: ThresholdOverride) =>
  ov?.company[productId] ?? seedCompanyMin(productId);

export const effectiveSalonMin = (
  productId: string,
  salon: SalonId,
  ov?: ThresholdOverride,
) => ov?.bySalon[productId]?.[salon] ?? stockOf(productId, salon)?.min ?? seedSalonMin(productId);

/* ------------------------------------------------------------------ */
/* Tableau de suivi                                                    */
/* ------------------------------------------------------------------ */

export type StockStatus = "ok" | "low" | "order";

export type StockRow = {
  product: Product;
  onHand: number | null; // niveau du périmètre actif (entreprise si scope « all », sinon salon)
  reserve: number | null; // réserve centrale (renseigné seulement quand scope === « all »)
  min: number; // seuil du périmètre actif
  weekly: number;
  coverage: number | null; // jours ; null = jamais inventorié ou conso nulle
  spark: number[]; // 8 niveaux de fin de semaine, ancien → récent
  status: StockStatus;
  leadDays: number;
};

type StockRowsOpts = {
  movements?: StockMovement[];
  thresholds?: ThresholdOverride;
};

const rowStatus = (
  onHand: number | null,
  min: number,
  coverage: number | null,
): StockStatus =>
  onHand === null
    ? "ok"
    : onHand < min
      ? "order"
      : coverage !== null && coverage < 14
        ? "low"
        : "ok";

export function stockRows(scope: SalonScope, opts: StockRowsOpts = {}): StockRow[] {
  const extra = opts.movements ?? [];
  const ov = opts.thresholds;

  const rows: StockRow[] = products
    .map((product): StockRow | null => {
      const locs = productLocations(product.id);
      if (locs.length === 0) return null;

      if (scope === "all") {
        const onHand = companyOnHand(product.id, extra);
        const reserve = locs.includes(RESERVE)
          ? locationOnHand(product.id, RESERVE, extra)
          : null;
        const min = effectiveCompanyMin(product.id, ov);
        const weekly = weeklyConsumption(product.id, "all");
        const coverage = onHand === null ? null : coverageDays(onHand, weekly);
        const spark = levelHistory(product.id, extra, 8).map((p) => p.total);
        return {
          product,
          onHand,
          reserve,
          min,
          weekly,
          coverage,
          spark,
          status: rowStatus(onHand, min, coverage),
          leadDays: leadDaysFor(product.id),
        };
      }

      const cell = stockOf(product.id, scope);
      if (!cell) return null;
      const onHand = locationOnHand(product.id, scope, extra);
      const min = effectiveSalonMin(product.id, scope, ov);
      const weekly = weeklyConsumption(product.id, scope);
      const coverage = onHand === null ? null : coverageDays(onHand, weekly);
      const spark = levelSeries(product.id, scope, onHand ?? 0, 8, extra);
      return {
        product,
        onHand,
        reserve: null,
        min,
        weekly,
        coverage,
        spark,
        status: rowStatus(onHand, min, coverage),
        leadDays: cell.leadDays,
      };
    })
    .filter((r): r is StockRow => r !== null);

  // Couverture croissante ; jamais inventorié en tête, conso nulle en bas.
  return rows.sort((a, b) => {
    const au = a.onHand === null;
    const bu = b.onHand === null;
    if (au !== bu) return au ? -1 : 1;
    if (a.coverage === null && b.coverage === null) return 0;
    if (a.coverage === null) return 1;
    if (b.coverage === null) return -1;
    return a.coverage - b.coverage;
  });
}

/* ------------------------------------------------------------------ */
/* Notification « À traiter » — calculée en direct, jamais codée en dur */
/* ------------------------------------------------------------------ */

// Alerte stock pour le tableau de bord (`NotificationsPanel`) : dérivée du
// calcul réel (`stockRows`), jamais d'un seed statique — sinon l'alerte finit
// par ne plus correspondre au catalogue (cf. l'ancienne notif « Teinture
// Majirel », qui pointait vers un produit disparu du catalogue réel). Une
// seule notification agrégée (comme le bandeau de `/stock`), pas une par
// produit : sinon un jour à plusieurs produits sous seuil noierait le rail
// « À traiter ». Lien direct vers la fiche s'il n'y a qu'un seul produit.
export function stockAlertNotifications(): AppNotification[] {
  const toOrder = stockRows("all").filter((r) => r.status === "order");
  if (toOrder.length === 0) return [];

  const [first] = toOrder;
  const title = toOrder.length === 1 ? "Produit à commander" : `${toOrder.length} produits à commander`;
  const body =
    toOrder.length === 1
      ? `${first.product.name} — ${
          first.onHand === 0 ? "en rupture" : `${groupThousands(first.onHand ?? 0)} en stock`
        }, sous le seuil de ${groupThousands(first.min)}`
      : `${toOrder
          .slice(0, 3)
          .map((r) => r.product.name)
          .join(", ")}${toOrder.length > 3 ? "…" : ""} — stock entreprise sous le seuil.`;

  return [
    {
      id: "notif-stock-order",
      category: "stock",
      title,
      body,
      date: `${TODAY_ISO}T07:00:00`,
      read: false,
      tone: "warning",
      href: toOrder.length === 1 ? `/stock?produit=${first.product.id}` : "/stock",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Projection de rupture                                               */
/* ------------------------------------------------------------------ */

export type ProjectionModel = "4w" | "3m" | "lastYear" | "manual";

export const PROJECTION_MODEL_OPTIONS: { value: ProjectionModel; label: string }[] = [
  { value: "4w", label: "4 dernières semaines" },
  { value: "3m", label: "3 derniers mois" },
  { value: "lastYear", label: "Même période l'an dernier" },
  { value: "manual", label: "Estimation manuelle" },
];

export const projectionModelLabel = (m: ProjectionModel) =>
  PROJECTION_MODEL_OPTIONS.find((o) => o.value === m)?.label ?? m;

export type RunoutProjection = {
  runoutDate: string | null; // ISO ; null si conso nulle
  reorderQty: number;
  reorderBy: string | null; // ISO ; null si conso nulle
  reliable: boolean; // false si moins de 4 semaines de données
};

// Projection au niveau entreprise (total réserve + salons vs consommation totale,
// délai fournisseur). `extra` = mouvements de session.
export function projectRunout(
  productId: string,
  model: ProjectionModel,
  extra: StockMovement[] = [],
): RunoutProjection {
  const seed = seedOf(productId);
  const onHand = companyOnHand(productId, extra) ?? 0;
  const leadDays = leadDaysFor(productId);
  const historyWeeks = seed?.weeksHistory ?? 0;

  let weekly: number;
  if (model === "manual") {
    weekly = SALON_IDS.reduce((s, id) => {
      const c = seed?.byLocation[id];
      return s + (c ? (c.manual ?? c.weekly) : 0);
    }, 0);
  } else if (model === "lastYear") {
    weekly = (weeklyConsumption(productId, "all") * (seed?.seasonalPct ?? 100)) / 100;
  } else {
    // "4w" et "3m" partagent la même série synthétique (8–9 semaines).
    weekly = weeklyConsumption(productId, "all", model === "3m" ? 8 : 4);
  }
  weekly = Math.round(weekly * 10) / 10;

  const reliable = historyWeeks >= 4 && weekly > 0;

  if (weekly <= 0) {
    return { runoutDate: null, reorderQty: 0, reorderBy: null, reliable: false };
  }

  const daysLeft = (onHand / weekly) * 7;
  const runoutMs = TODAY_MS + daysLeft * DAY_MS;
  const target = Math.ceil(weekly * 6); // ~6 semaines de couverture
  const reorderQty = roundPack(Math.max(weekly, target - onHand));
  const reorderByMs = Math.max(TODAY_MS, runoutMs - leadDays * DAY_MS);

  return {
    runoutDate: isoOf(runoutMs),
    reorderQty,
    reorderBy: isoOf(reorderByMs),
    reliable,
  };
}

/* ------------------------------------------------------------------ */
/* Formulaire « Ajuster »                                              */
/* ------------------------------------------------------------------ */

export const ADJUST_KINDS: {
  value: Extract<MovementReason, "inventory" | "restock" | "adjust">;
  label: string;
  help: string;
}[] = [
  {
    value: "inventory",
    label: "Inventaire compté",
    help: "Remplace le stock théorique par le nombre réellement compté.",
  },
  {
    value: "restock",
    label: "Réception",
    help: "Ajoute une quantité reçue du fournisseur.",
  },
  {
    value: "adjust",
    label: "Casse ou perte",
    help: "Retire une quantité abîmée, périmée ou perdue.",
  },
];
