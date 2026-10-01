// Livraison des cartes cadeaux (2026-10-01) — quartiers desservis et prix de
// la livraison par quartier, réglés dans Réglages › Livraison. Une carte
// cadeau achetée en ligne peut être livrée à la bénéficiaire : la cliente
// choisit son quartier, le prix réglé ici s'ajoute à sa commande.
// Indépendant du barrel : importer directement `@/lib/mock/livraison`.

export type DeliveryZone = {
  id: string;
  name: string; // quartier, ex. « Almadies »
  priceFcfa: number; // 0 = livraison offerte
};

export const deliveryZoneSeeds: DeliveryZone[] = [
  { id: "dz-almadies", name: "Almadies", priceFcfa: 1500 },
  { id: "dz-ngor", name: "Ngor", priceFcfa: 1500 },
  { id: "dz-ouakam", name: "Ouakam", priceFcfa: 2000 },
  { id: "dz-mermoz", name: "Mermoz", priceFcfa: 2000 },
  { id: "dz-sacre-coeur", name: "Sacré-Cœur", priceFcfa: 2000 },
  { id: "dz-point-e", name: "Point E", priceFcfa: 2500 },
  { id: "dz-fann", name: "Fann", priceFcfa: 2500 },
  { id: "dz-plateau", name: "Plateau", priceFcfa: 3000 },
  { id: "dz-parcelles", name: "Parcelles Assainies", priceFcfa: 3000 },
];

let seq = 0;
export const newDeliveryZoneId = () => `dz-${Date.now()}-${seq++}`;

// Comparaison de noms de quartier sans casse ni accents (doublons).
export const foldZoneName = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
