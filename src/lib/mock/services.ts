// Données « Services » — catalogue réel Beauty & Co (repris de point-de-vente/lib/data/menu.ts),
// front-end uniquement : aucune API, aucune persistance ici, l'édition reste en mémoire de session.
// Indépendant du barrel `@/lib/mock` : importer directement `@/lib/mock/services`.
//
// Un seul parcours regroupe ce qui était éclaté sur quatre écrans :
//
//   Service (catégorie) ─┬─ Prestations (facturables : prix + durée)
//                        │      └─ Recette (produits consommés → déduits du stock
//                        │         automatiquement à la fin de la visite)
//                        └─ Questions (fiche d'accueil remplie à la réservation)
//
// « Sans catégorie » = éléments orphelins (`serviceId === null`), à rattacher.
//
// Catégories : les 7 catégories réelles du catalogue point-de-vente (Mini&Co · Hair et
// Mini&Co · Spa sont fusionnées ici en un seul service « Mini & Co »). « Brows / Lashes »
// (prestations fictives) a été retiré : absent du catalogue réel.
//
// Produits : le catalogue de consommables était fictif ; il est remplacé par le vrai
// catalogue Kérastase (soin capillaire, consommé par les prestations Coiffure) + les
// boissons du bar (vendues au détail, cf. `@/lib/mock/stock`). Les prestations hors
// Coiffure n'ont pas de recette : aucune donnée réelle de consommation n'existe pour
// elles côté point-de-vente.

import { fcfa, salonName, salons, type SalonId, type SalonScope } from "./beautyandco";
import { membersForPrestation } from "./staff";

export { fcfa };

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const serviceSalons: { id: SalonId; name: string }[] = salons.map((s) => ({
  id: s.id,
  name: s.name,
}));

export type QuestionType = "oui-non" | "choix-multiple" | "texte";

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "oui-non", label: "Oui / Non" },
  { value: "choix-multiple", label: "Choix multiple" },
  { value: "texte", label: "Texte libre" },
];

export const questionTypeLabel = (t: QuestionType) =>
  QUESTION_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;

// Mode de réservation d'une prestation : la cliente choisit-elle sa praticienne,
// ou prend-elle la première disponible ?
export type ReservationMode = "named" | "any" | "both";

export const RESERVATION_MODE_OPTIONS: { value: ReservationMode; label: string }[] = [
  { value: "named", label: "Avec choix de la praticienne" },
  { value: "any", label: "Première praticienne disponible" },
  { value: "both", label: "Les deux — la cliente choisit" },
];

export const reservationModeLabel = (m: ReservationMode) =>
  RESERVATION_MODE_OPTIONS.find((o) => o.value === m)!.label;

// Vignette d'un service : icône de catégorie reprise du site vitrine b&co
// (mêmes pictogrammes qu'à la réservation en ligne — pas d'upload d'image
// dans cette démo front-end). Le composant est résolu côté UI, voir
// `SERVICE_ICONS` dans `@/components/back-office/services/serviceIcons`.
export type ServiceIconKey =
  | "coiffure"
  | "manucure-pedicure"
  | "onglerie"
  | "spa"
  | "visage"
  | "epilation"
  | "mini";

export const SERVICE_ICON_OPTIONS: { value: ServiceIconKey; label: string }[] = [
  { value: "coiffure", label: "Coiffure" },
  { value: "manucure-pedicure", label: "Manucure & pédicure" },
  { value: "onglerie", label: "Onglerie" },
  { value: "spa", label: "Spa" },
  { value: "visage", label: "Soin du visage" },
  { value: "epilation", label: "Épilation" },
  { value: "mini", label: "Mini & Co" },
];

// Produits consommables (côté stock) : catalogue réel Kérastase (soin capillaire,
// utilisé dans les recettes des prestations Coiffure) + boissons du bar (vendues
// au détail, sans recette). `image` = photo produit réelle (sert de défaut à la
// fiche Stock, remplaçable par une photo de session).
// `priceFcfa` : prix de vente au détail — renseigné seulement pour les boissons
// du bar (vendues telles quelles pendant une visite, cf. extras de rendez-vous
// dans `@/lib/mock/rendezvous`). Aucune donnée de prix retail réelle n'existe
// pour les produits Kérastase (catalogue de consommation, pas de vente au
// détail dans ce projet) — laissé `undefined` pour eux.
export type Product = {
  id: string;
  name: string;
  defaultUnit: RecipeUnit;
  image?: string;
  priceFcfa?: number;
};

export type RecipeUnit = "g" | "ml" | "cl" | "pièce" | "dose" | "application";

export const RECIPE_UNIT_OPTIONS: { value: RecipeUnit; label: string }[] = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "cl", label: "cl" },
  { value: "pièce", label: "pièce" },
  { value: "dose", label: "dose" },
  { value: "application", label: "application" },
];

export const products: Product[] = [
  { id: "nutritive-8hmns-serum-90ml", name: "Nutritive 8HMNS Serum 90ml", defaultUnit: "ml", image: "/images/produits/nutritive-8hmns-serum-90ml.jpg" },
  { id: "nutritive-bain-riche-250ml", name: "Nutritive Bain Riche 250ml", defaultUnit: "ml", image: "/images/produits/nutritive-bain-riche-250ml.jpg" },
  { id: "nutritive-bain-satin-250ml", name: "Nutritive Bain Satin 250ml", defaultUnit: "ml", image: "/images/produits/nutritive-bain-satin-250ml.jpg" },
  { id: "nutritive-lait-vital-200ml", name: "Nutritive Lait Vital 200ml", defaultUnit: "ml", image: "/images/produits/nutritive-lait-vital-200ml.jpg" },
  { id: "nutritive-masque-riche-200ml", name: "Nutritive Masque Riche 200ml", defaultUnit: "ml", image: "/images/produits/nutritive-masque-riche-200ml.jpg" },
  { id: "nutritive-masque-intense-200ml", name: "Nutritive Masque Intense 200ml", defaultUnit: "ml", image: "/images/produits/nutritive-masque-intense-200ml.jpg" },
  { id: "nutritive-nectar-therm-150ml", name: "Nutritive Nectar Therm 150ml", defaultUnit: "ml", image: "/images/produits/nutritive-nectar-therm-150ml.jpg" },
  { id: "nutritive-scalp-serum-90ml", name: "Nutritive Scalp Serum 90ml", defaultUnit: "ml", image: "/images/produits/nutritive-scalp-serum-90ml.jpg" },
  { id: "nutritive-soin-150ml", name: "Nutritive Soin 150ml", defaultUnit: "ml", image: "/images/produits/nutritive-soin-150ml.jpg" },
  { id: "genesis-bain-riche-250ml", name: "Genesis Bain Riche 250ml", defaultUnit: "ml", image: "/images/produits/genesis-bain-riche-250ml.jpg" },
  { id: "genesis-cure-90ml", name: "Genesis Cure 90ml", defaultUnit: "ml", image: "/images/produits/genesis-cure-90ml.jpg" },
  { id: "genesis-fluide-150ml", name: "Genesis Fluide 150ml", defaultUnit: "ml", image: "/images/produits/genesis-fluide-150ml.jpg" },
  { id: "genesis-masque-200ml", name: "Genesis Masque 200ml", defaultUnit: "ml", image: "/images/produits/genesis-masque-200ml.jpg" },
  { id: "gloss-absolu-bain-250ml", name: "Gloss Absolu Bain 250ml", defaultUnit: "ml", image: "/images/produits/gloss-absolu-bain-250ml.jpg" },
  { id: "k-gloss-absolu-bain-riche-250ml", name: "K Gloss Absolu Bain Riche 250ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-bain-riche-250ml.jpg" },
  { id: "k-gloss-absolu-fondant-250ml", name: "K Gloss Absolu Fondant 250ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-fondant-250ml.jpg" },
  { id: "k-gloss-absolu-cream-250ml", name: "K Gloss Absolu Cream 250ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-cream-250ml.jpg" },
  { id: "k-gloss-absolu-hair-mist-30ml", name: "K Gloss Absolu Hair Mist 30ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-hair-mist-30ml.jpg" },
  { id: "k-gloss-absolu-masque-nutritive-200ml", name: "K Gloss Absolu Masque Nutritive 200ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-masque-nutritive-200ml.jpg" },
  { id: "k-gloss-absolu-oil-45ml", name: "K Gloss Absolu Oil 45ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-oil-45ml.jpg" },
  { id: "k-gloss-absolu-spray-190ml", name: "K Gloss Absolu Spray 190ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-spray-190ml.jpg" },
  { id: "k-symbiose-bain-creme-250ml", name: "K Symbiose Bain Creme 250ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-bain-creme-250ml.jpg" },
  { id: "k-symbiose-bain-purete-250ml", name: "K Symbiose Bain Pureté 250ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-bain-purete-250ml.jpg" },
  { id: "k-symbiose-fondant-hydra-200ml", name: "K Symbiose Fondant Hydra 200ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-fondant-hydra-200ml.jpg" },
  { id: "k-symbiose-masque-200ml", name: "K Symbiose Masque 200ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-masque-200ml.jpg" },
  { id: "k-symbiose-micropeel-200ml", name: "K Symbiose Micropeel 200ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-micropeel-200ml.jpg" },
  { id: "k-symbiose-serum-90ml", name: "K Symbiose Serum 90ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-serum-90ml.jpg" },
  { id: "k-chroma-absolu-bain-lim-us-250ml", name: "K Chroma Absolu Bain Lim US 250ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-bain-lim-us-250ml.jpg" },
  { id: "k-chroma-absolu-bain-opa-us-250ml", name: "K Chroma Absolu Bain OPA US 250ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-bain-opa-us-250ml.jpg" },
  { id: "k-chroma-absolu-fluide-250ml", name: "K Chroma Absolu Fluide 250ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-fluide-250ml.jpg" },
  { id: "k-chroma-absolu-fondant-200ml", name: "K Chroma Absolu Fondant 200ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-fondant-200ml.jpg" },
  { id: "k-chroma-absolu-leave-in-150ml", name: "K Chroma Absolu Leave In 150ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-leave-in-150ml.jpg" },
  { id: "k-chroma-absolu-mask-reco-200ml", name: "K Chroma Absolu Mask Reco 200ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-mask-reco-200ml.jpg" },
  { id: "k-chroma-oil-75ml", name: "K Chroma Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-chroma-oil-75ml.jpg" },
  { id: "k-chroma-oil", name: "K Chroma Oil", defaultUnit: "application" },
  { id: "k-blond-absolu-night-serum-90ml", name: "K Blond Absolu Night Serum 90ml", defaultUnit: "ml", image: "/images/produits/k-blond-absolu-night-serum-90ml.jpg" },
  { id: "k-blond-oil-75ml", name: "K Blond Oil 75ml", defaultUnit: "ml" },
  { id: "k-blond-oil-75ml-2", name: "K Blond Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-blond-oil-75ml-2.jpg" },
  { id: "ker-blond-bain-uviolet-250ml", name: "Ker Blond Bain Uviolet 250ml", defaultUnit: "ml", image: "/images/produits/ker-blond-bain-uviolet-250ml.jpg" },
  { id: "ker-blond-cicaflash-250ml", name: "Ker Blond Cicaflash 250ml", defaultUnit: "ml", image: "/images/produits/ker-blond-cicaflash-250ml.jpg" },
  { id: "ker-blond-cicaplasme-150ml", name: "Ker Blond Cicaplasme 150ml", defaultUnit: "ml", image: "/images/produits/ker-blond-cicaplasme-150ml.jpg" },
  { id: "ker-blond-masque-ultravio", name: "Ker Blond Masque Ultravio", defaultUnit: "application", image: "/images/produits/ker-blond-masque-ultravio.jpg" },
  { id: "k-chrono-oil-75ml", name: "K Chrono Oil 75ml", defaultUnit: "ml" },
  { id: "k-chrono-oil-75ml-2", name: "K Chrono Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-chrono-oil-75ml-2.jpg" },
  { id: "k-chrono-bain-250ml", name: "K Chrono Bain 250ml", defaultUnit: "ml", image: "/images/produits/k-chrono-bain-250ml.jpg" },
  { id: "k-chrono-masque-200ml", name: "K Chrono Masque 200ml", defaultUnit: "ml", image: "/images/produits/k-chrono-masque-200ml.jpg" },
  { id: "k-chrono-pre-shampoing-200ml", name: "K Chrono Pre Shampoing 200ml", defaultUnit: "ml", image: "/images/produits/k-chrono-pre-shampoing-200ml.jpg" },
  { id: "ks-chrono-thermique-150ml", name: "KS Chrono Thermique 150ml", defaultUnit: "ml", image: "/images/produits/ks-chrono-thermique-150ml.jpg" },
  { id: "k-chrono-bain-250ml-2", name: "K Chrono Bain 250ml", defaultUnit: "ml", image: "/images/produits/k-chrono-bain-250ml-2.jpg" },
  { id: "ker-res-masque-force-archi-200ml", name: "Ker Res Masque Force Archi 200ml", defaultUnit: "ml", image: "/images/produits/ker-res-masque-force-archi-200ml.jpg" },
  { id: "ker-resist-bain-force-archi-250m", name: "Ker Resist Bain Force Archi 250m", defaultUnit: "application", image: "/images/produits/ker-resist-bain-force-archi-250m.jpg" },
  { id: "ker-resisr-ciment-anti-usure-200ml", name: "Ker Resisr Ciment Anti Usure 200ml", defaultUnit: "ml", image: "/images/produits/ker-resisr-ciment-anti-usure-200ml.jpg" },
  { id: "ker-res-serum-therapiste-2-15ml", name: "Ker Res Serum Therapiste 2*15ml", defaultUnit: "ml", image: "/images/produits/ker-res-serum-therapiste-2-15ml.jpg" },
  { id: "ker-res-serum-bain-therapiste-250ml", name: "Ker Res Serum Bain Therapiste 250ml", defaultUnit: "ml", image: "/images/produits/ker-res-serum-bain-therapiste-250ml.jpg" },
  { id: "bain-nourissant-curl-250ml", name: "Bain Nourissant Curl 250ml", defaultUnit: "ml", image: "/images/produits/bain-nourissant-curl-250ml.jpg" },
  { id: "creme-curl-150ml", name: "Creme Curl 150ml", defaultUnit: "ml", image: "/images/produits/creme-curl-150ml.jpg" },
  { id: "gelee-curl-150ml", name: "Gelee Curl 150ml", defaultUnit: "ml", image: "/images/produits/gelee-curl-150ml.jpg" },
  { id: "curl-huile-50ml", name: "Curl Huile 50ml", defaultUnit: "ml", image: "/images/produits/curl-huile-50ml.jpg" },
  { id: "lotion-refresher-curl-190ml", name: "Lotion Refresher Curl 190ml", defaultUnit: "ml", image: "/images/produits/lotion-refresher-curl-190ml.jpg" },
  { id: "masque-curl-200ml", name: "Masque Curl 200ml", defaultUnit: "ml", image: "/images/produits/masque-curl-200ml.jpg" },
  { id: "k-alpha-bain-renovateur-250ml", name: "K Alpha Bain Renovateur 250ml", defaultUnit: "ml", image: "/images/produits/k-alpha-bain-renovateur-250ml.jpg" },
  { id: "k-alpha-fondant-fluidity-200ml", name: "K Alpha Fondant Fluidity 200ml", defaultUnit: "ml", image: "/images/produits/k-alpha-fondant-fluidity-200ml.jpg" },
  { id: "k-alpha-huile-lumiere-30ml", name: "K Alpha Huile Lumiere 30ml", defaultUnit: "ml", image: "/images/produits/k-alpha-huile-lumiere-30ml.jpg" },
  { id: "k-alpha-lotion-jelly-250ml", name: "K Alpha Lotion Jelly 250ml", defaultUnit: "ml", image: "/images/produits/k-alpha-lotion-jelly-250ml.jpg" },
  { id: "k-alpha-masque-fill-force-200ml", name: "K Alpha Masque Fill Force 200ml", defaultUnit: "ml", image: "/images/produits/k-alpha-masque-fill-force-200ml.jpg" },
  { id: "k-alpha-serum-fondamental-90ml", name: "K Alpha Serum Fondamental 90ml", defaultUnit: "ml", image: "/images/produits/k-alpha-serum-fondamental-90ml.jpg" },
  { id: "k-elixir-oil-75ml", name: "K Elixir Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-elixir-oil-75ml.jpg" },
  { id: "k-elixir-oil-30ml", name: "K Elixir Oil 30ml", defaultUnit: "ml", image: "/images/produits/k-elixir-oil-30ml.jpg" },
  { id: "ker-elixir-ult-bain-250ml", name: "Ker Elixir ULT Bain 250ml", defaultUnit: "ml", image: "/images/produits/ker-elixir-ult-bain-250ml.jpg" },
  { id: "ker-elixir-ult-masque-200ml", name: "Ker Elixir ULT Masque 200ml", defaultUnit: "ml", image: "/images/produits/ker-elixir-ult-masque-200ml.jpg" },
  // Boissons — bar Beauty & Co (données b&co lib/data/bar-beauty.ts), vendues au détail (pas de recette).
  // Prix retail plausibles (aucune donnée de prix réelle n'existe côté point-de-vente).
  { id: "boisson-pure-glow", name: "Pure Glow", defaultUnit: "pièce", image: "/images/boissons/pure-glow.jpg", priceFcfa: 2500 },
  { id: "boisson-dragon-mystic", name: "Dragon Mystic", defaultUnit: "pièce", image: "/images/boissons/dragon-mystic.jpg", priceFcfa: 3000 },
  { id: "boisson-pause-tropical", name: "Pause Tropical", defaultUnit: "pièce", image: "/images/boissons/pause-tropical.jpg", priceFcfa: 2500 },
  { id: "boisson-eclat-matcha", name: "L'Éclat Matcha", defaultUnit: "pièce", image: "/images/boissons/eclat-matcha.jpg", priceFcfa: 3000 },
  { id: "boisson-ice-coffee-caramel", name: "Ice Coffee Caramel", defaultUnit: "pièce", image: "/images/boissons/ice-coffee-caramel.jpg", priceFcfa: 2500 },
  { id: "boisson-soin-glace-ice-tea", name: "Soin Glacé Ice Tea", defaultUnit: "pièce", image: "/images/boissons/soin-glace-ice-tea.jpg", priceFcfa: 2000 },
  { id: "boisson-pretty-latte", name: "Pretty Latte", defaultUnit: "pièce", priceFcfa: 2500 },
  // Autres marques + accessoires — vendus au détail, sans recette (repris de
  // point-de-vente/lib/data/menu.ts, catégories Saryna Keys / Nefertiti / Beccy
  // Wave / Autres — absents de la synchronisation initiale du 2026-09-04).
  { id: "antiseptique-saryna-keys", name: "Antisceptique Saryna Keys", defaultUnit: "pièce", image: "/images/produits/antiseptique-saryna-keys.jpg" },
  { id: "damage-repair-oil-saryna-keys", name: "Damage Repair Oil Saryna Keys", defaultUnit: "pièce", image: "/images/produits/damage-repair-oil-saryna-keys.jpg" },
  { id: "nefertiti-kinky-straight", name: "Nefertiti Kinky Straight", defaultUnit: "pièce", image: "/images/produits/nefertiti-kinky-straight.jpg" },
  { id: "hd-lace-frontal-nefertiti-kinky-straight", name: "HD Lace Frontal Nefertiti Kinky Straight", defaultUnit: "pièce", image: "/images/produits/hd-lace-frontal-nefertiti-kinky-straight.jpg" },
  { id: "ready-made-ponytail-beccy-wave", name: "Ready Made Ponytail Beccy Wave", defaultUnit: "pièce", image: "/images/produits/ready-made-ponytail-beccy-wave.jpg" },
  { id: "becky-wave-raw-hair", name: "Becky Wave Raw Hair", defaultUnit: "pièce", image: "/images/produits/becky-wave-raw-hair.jpg" },
  { id: "correcteur-fluide-swiss-perfection-haute-couvrance", name: "Correcteur Fluide « Swiss Perfection » – Haute Couvrance", defaultUnit: "pièce", image: "/images/produits/correcteur-fluide-swiss-perfection-haute-couvrance.jpg" },
  { id: "peigne-bijou-eclat-de-mariee-finition-or-rose", name: "Peigne Bijou « Éclat de Mariée » – Finition Or Rose", defaultUnit: "pièce", image: "/images/produits/peigne-bijou-eclat-de-mariee-finition-or-rose.jpg" },
];

export const productName = (id: string) =>
  products.find((p) => p.id === id)?.name ?? "Produit inconnu";

export const productPrice = (id: string) => products.find((p) => p.id === id)?.priceFcfa ?? 0;

// Extras de rendez-vous (boissons/produits pré-commandés, cf. `@/lib/mock/rendezvous`) :
// "boisson" = un des 7 produits du bar ci-dessus, "produit" = le reste du catalogue.
export const productKind = (id: string): "produit" | "boisson" =>
  id.startsWith("boisson-") ? "boisson" : "produit";

// Boissons du bar, seules à porter un prix de vente au détail — alimentent le
// sélecteur d'extras de `rendezvous/BookingDialog.tsx` (un produit Kérastase
// n'a pas de prix retail connu, cf. commentaire sur `Product.priceFcfa`).
export const sellableExtras = products.filter((p) => productKind(p.id) === "boisson");

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RecipeItem = {
  id: string;
  productId: string;
  qty: number;
  unit: RecipeUnit;
};

export type Prestation = {
  id: string;
  serviceId: string | null; // null = sans catégorie
  name: string;
  priceFcfa: number;
  durationMin: number;
  active: boolean;
  recipe: RecipeItem[];
  // Salons où la prestation est proposée — sous-ensemble des `salonIds` du service
  // parent. `[]` = héritée de tous les salons du parent (aucune restriction).
  salonIds: SalonId[];
  reservationMode: ReservationMode;
  // Prestation réalisable à deux praticiennes simultanément (temps de chaise
  // divisé) — repris du principe de point-de-vente (`twoPractitionersEligible`),
  // activé ici sur quelques prestations longues à rallonges/extensions où deux
  // mains en simultané sont plausibles.
  twoPractitioners?: boolean;
};

export type ServiceQuestion = {
  id: string;
  serviceId: string | null; // null = sans catégorie
  label: string;
  type: QuestionType;
  active: boolean;
};

export type Service = {
  id: string;
  name: string;
  icon: ServiceIconKey;
  description: string;
  active: boolean;
  salonIds: SalonId[]; // salons où le service est proposé
};

/* ------------------------------------------------------------------ */
/* Fixtures — catégories réelles (Mini&Co · Hair + Mini&Co · Spa fusionnées)*/
/* ------------------------------------------------------------------ */

export const serviceSeeds: Service[] = [
  {
    id: "s-coiffure",
    name: "Coiffure",
    icon: "coiffure",
    description: "Coupes, brushings, tresses, tissages, lissages et soins capillaires.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
  {
    id: "s-manucure",
    name: "Manucure & pédicure",
    icon: "manucure-pedicure",
    description: "Soin des mains et des pieds, manucure et pédicure.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
  {
    id: "s-onglerie",
    name: "Onglerie",
    icon: "onglerie",
    description: "Capsules, gel, vernis permanent et nail art.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
  {
    id: "s-spa",
    name: "Spa",
    icon: "spa",
    description: "Massages, soins du dos et rituels bien-être.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
  {
    id: "s-visage",
    name: "Soin du visage",
    icon: "visage",
    description: "Nettoyage de peau, soins hydratants et anti-âge.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
  {
    id: "s-epilation",
    name: "Épilation",
    icon: "epilation",
    description: "Épilation à la cire, visage et corps.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
  {
    id: "s-mini",
    name: "Mini & Co",
    icon: "mini",
    description: "L'univers beauté des enfants — coiffure et spa.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
  },
];

// Raccourci de saisie de recette.
const r = (productId: string, qty: number, unit: RecipeUnit): RecipeItem => ({
  id: `ri-${productId}-${qty}${unit}`,
  productId,
  qty,
  unit,
});

// Catalogue réel (107 prestations, repris de point-de-vente/lib/data/menu.ts —
// noms remis en casse titre, prix/durées inchangés). Seule la catégorie Coiffure
// porte une recette (gammes Kérastase plausibles par sous-catégorie) : aucune
// donnée de consommation réelle n'existe pour les autres catégories.
const rawPrestations: Omit<Prestation, "salonIds">[] = [

  // Coiffure
  { id: "coiffure-defrisage-professionnel-beauty-and-co-texlax", serviceId: "s-coiffure", name: "Défrisage Professionnel Beauty And Co / Texlax", priceFcfa: 49000, durationMin: 150, active: true, recipe: [r("ker-resist-bain-force-archi-250m", 40, "ml"), r("ker-res-masque-force-archi-200ml", 20, "g")], reservationMode: "named" },
  { id: "coiffure-hybrid-extensions", serviceId: "s-coiffure", name: "Hybrid Extensions", priceFcfa: 99000, durationMin: 190, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-extensions-tapes-2-paquets-de-cheveux-soit-100-g-18-pouces-coiffage", serviceId: "s-coiffure", name: "Extensions Tapes (2 Paquets de Cheveux Soit 100 G 18 Pouces + Coiffage)", priceFcfa: 249000, durationMin: 150, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-enlever-anneaux", serviceId: "s-coiffure", name: "Enlever Anneaux", priceFcfa: 7000, durationMin: 40, active: true, recipe: [], reservationMode: "any" },
  { id: "coiffure-pose-perruque", serviceId: "s-coiffure", name: "Pose Perruque", priceFcfa: 39000, durationMin: 70, active: true, recipe: [r("k-gloss-absolu-hair-mist-30ml", 8, "ml")], reservationMode: "named" },
  { id: "coiffure-soin-perruque", serviceId: "s-coiffure", name: "Soin Perruque", priceFcfa: 22000, durationMin: 120, active: true, recipe: [r("k-gloss-absolu-hair-mist-30ml", 8, "ml")], reservationMode: "both" },
  { id: "coiffure-supplement-lisseur", serviceId: "s-coiffure", name: "Supplément Lisseur", priceFcfa: 5000, durationMin: 20, active: true, recipe: [], reservationMode: "any" },
  { id: "coiffure-soin-keratine", serviceId: "s-coiffure", name: "Soin Kératine", priceFcfa: 189000, durationMin: 210, active: true, recipe: [r("k-chrono-bain-250ml", 40, "ml"), r("k-chrono-masque-200ml", 25, "g")], reservationMode: "named" },
  { id: "coiffure-supplement-coupe-pointes", serviceId: "s-coiffure", name: "Supplément Coupe Pointes", priceFcfa: 9000, durationMin: 25, active: true, recipe: [], reservationMode: "any" },
  { id: "coiffure-coupe-transformation", serviceId: "s-coiffure", name: "Coupe Transformation", priceFcfa: 36000, durationMin: 40, active: true, recipe: [r("nutritive-bain-riche-250ml", 20, "ml")], reservationMode: "both" },
  { id: "coiffure-tresses-cheveux", serviceId: "s-coiffure", name: "Tresses Cheveux +", priceFcfa: 19000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "coiffure-shampoing-brushing-sur-extensions-tissages-shampoing-inclus-et-obligatoire", serviceId: "s-coiffure", name: "Shampoing Brushing sur Extensions / Tissages (Shampoing Inclus et Obligatoire)", priceFcfa: 31000, durationMin: 100, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "both" },
  { id: "coiffure-soin-croisiere", serviceId: "s-coiffure", name: "Soin Croisière", priceFcfa: 36000, durationMin: 90, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")], reservationMode: "both" },
  { id: "coiffure-extension-aux-fils-2-paquets", serviceId: "s-coiffure", name: "Extension aux Fils 2 Paquets", priceFcfa: 218000, durationMin: 240, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-soin-botox-lissant", serviceId: "s-coiffure", name: "Soin Botox Lissant", priceFcfa: 99000, durationMin: 190, active: true, recipe: [r("k-chrono-bain-250ml", 40, "ml"), r("k-chrono-masque-200ml", 25, "g")], reservationMode: "named" },
  { id: "coiffure-tissage-ouvert", serviceId: "s-coiffure", name: "Tissage Ouvert", priceFcfa: 46000, durationMin: 140, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "named" },
  { id: "coiffure-tissage-rajout", serviceId: "s-coiffure", name: "Tissage Rajout", priceFcfa: 39000, durationMin: 75, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "named" },
  { id: "coiffure-half-up-half-down", serviceId: "s-coiffure", name: "Half Up Half Down", priceFcfa: 49000, durationMin: 120, active: true, recipe: [r("nutritive-nectar-therm-150ml", 8, "ml")], reservationMode: "both" },
  { id: "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire", serviceId: "s-coiffure", name: "Shampoing Brushing (Shampoing Inclus et Obligatoire)", priceFcfa: 23000, durationMin: 60, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "both" },
  { id: "coiffure-extensions-aux-fils-1-paquet", serviceId: "s-coiffure", name: "Extensions aux Fils 1 Paquet", priceFcfa: 129000, durationMin: 240, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-head-spa-ultimate-deep-relaxation", serviceId: "s-coiffure", name: "Head Spa Ultimate Deep Relaxation", priceFcfa: 179000, durationMin: 240, active: true, recipe: [r("k-elixir-oil-75ml", 10, "ml"), r("k-chroma-oil-75ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-extensions-tapes-3-paquets-de-cheveux-soit-150g-18-pouces-coiffage", serviceId: "s-coiffure", name: "Extensions Tapes (3 Paquets de Cheveux Soit 150g 18 Pouces + Coiffage)", priceFcfa: 349000, durationMin: 180, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-defrisage-professionnel-soin-fortifiant-anti-casse", serviceId: "s-coiffure", name: "Défrisage Professionnel + Soin Fortifiant Anti Casse", priceFcfa: 59000, durationMin: 150, active: true, recipe: [r("ker-resist-bain-force-archi-250m", 40, "ml"), r("ker-res-masque-force-archi-200ml", 20, "g")], reservationMode: "named" },
  { id: "coiffure-soin-complet", serviceId: "s-coiffure", name: "Soin Complet", priceFcfa: 46000, durationMin: 130, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")], reservationMode: "both" },
  { id: "coiffure-soin-detox", serviceId: "s-coiffure", name: "Soin Detox", priceFcfa: 46000, durationMin: 140, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")], reservationMode: "both" },
  { id: "coiffure-soin-botox-reparateur-non-lissant", serviceId: "s-coiffure", name: "Soin Botox Réparateur (Non Lissant)", priceFcfa: 86000, durationMin: 150, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")], reservationMode: "named" },
  { id: "coiffure-soin-lissant-tanin", serviceId: "s-coiffure", name: "Soin Lissant Tanin", priceFcfa: 189000, durationMin: 190, active: true, recipe: [r("k-chrono-bain-250ml", 40, "ml"), r("k-chrono-masque-200ml", 25, "g")], reservationMode: "named" },
  { id: "coiffure-silk-press", serviceId: "s-coiffure", name: "Silk Press", priceFcfa: 79000, durationMin: 180, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "named" },
  { id: "coiffure-extensions-anneaux-haute-couture-2-paquets", serviceId: "s-coiffure", name: "Extensions Anneaux Haute Couture 2 Paquets", priceFcfa: 80000, durationMin: 170, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-pose-clips", serviceId: "s-coiffure", name: "Pose Clips", priceFcfa: 37000, durationMin: 60, active: true, recipe: [], reservationMode: "named" },
  { id: "coiffure-ponytail", serviceId: "s-coiffure", name: "Ponytail", priceFcfa: 41000, durationMin: 90, active: true, recipe: [r("nutritive-nectar-therm-150ml", 8, "ml")], reservationMode: "both" },
  { id: "coiffure-supplement-hand-feet-massage-massage-pieds-mains", serviceId: "s-coiffure", name: "Supplément Hand Feet Massage / Massage Pieds-Mains", priceFcfa: 19000, durationMin: 15, active: true, recipe: [], reservationMode: "any" },
  { id: "coiffure-soin-croisiere-head-spa", serviceId: "s-coiffure", name: "Soin Croisière Head Spa", priceFcfa: 84000, durationMin: 120, active: true, recipe: [r("k-elixir-oil-75ml", 10, "ml"), r("k-chroma-oil-75ml", 6, "ml")], reservationMode: "named" },
  { id: "coiffure-pose-u-part-wig", serviceId: "s-coiffure", name: "Pose U-Part Wig", priceFcfa: 37000, durationMin: 70, active: true, recipe: [r("k-gloss-absolu-hair-mist-30ml", 8, "ml")], reservationMode: "named" },
  { id: "coiffure-tissage-versatile", serviceId: "s-coiffure", name: "Tissage Versatile", priceFcfa: 56000, durationMin: 120, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "named" },
  { id: "coiffure-shampoing-sechage", serviceId: "s-coiffure", name: "Shampoing Séchage", priceFcfa: 17000, durationMin: 60, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "both" },
  { id: "coiffure-flip-over-sew-in-tissage-ferme", serviceId: "s-coiffure", name: "Flip Over Sew In (Tissage Fermé)", priceFcfa: 59000, durationMin: 150, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "named" },
  { id: "coiffure-tissage-closure-behind-the-hair-line-new", serviceId: "s-coiffure", name: "Tissage Closure Behind The Hair Line (Nouveau)", priceFcfa: 74900, durationMin: 190, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")], reservationMode: "named" },
  { id: "coiffure-supplement-express-floral-facial-soin-du-visage-relaxant", serviceId: "s-coiffure", name: "Supplément Express Floral Facial / Soin du Visage Relaxant", priceFcfa: 34000, durationMin: 35, active: true, recipe: [], reservationMode: "any" },
  { id: "coiffure-soin-vip", serviceId: "s-coiffure", name: "Soin VIP", priceFcfa: 49000, durationMin: 160, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")], reservationMode: "both" },
  { id: "coiffure-soin-reparateur-olapex-new-in", serviceId: "s-coiffure", name: "Soin Réparateur Olapex (Nouveau)", priceFcfa: 69000, durationMin: 120, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")], reservationMode: "named" },

  // Manucure & pédicure
  { id: "manucure-pedicure-gel-sur-ongle-naturel-gainage", serviceId: "s-manucure", name: "Gel sur Ongle Naturel (Gainage)", priceFcfa: 33000, durationMin: 70, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-supplement-decoration-chrome-cat-eye-baby-boomer", serviceId: "s-manucure", name: "Supplément Décoration (Chrome, Cat Eye, Baby Boomer)", priceFcfa: 7500, durationMin: 20, active: true, recipe: [], reservationMode: "any" },
  { id: "manucure-pedicure-manucure-permanent", serviceId: "s-manucure", name: "Manucure + Permanent", priceFcfa: 32000, durationMin: 80, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-jelly-pedicure", serviceId: "s-manucure", name: "Jelly Pédicure", priceFcfa: 29000, durationMin: 65, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-smooth-pedicure", serviceId: "s-manucure", name: "Smooth Pédicure", priceFcfa: 36000, durationMin: 80, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage", serviceId: "s-manucure", name: "Perfect Manucure Russe + Gel sur Ongles Naturels (Gainage)", priceFcfa: 43000, durationMin: 90, active: true, recipe: [], reservationMode: "named" },
  { id: "manucure-pedicure-manucure-russe-sans-vernis-sans-gel", serviceId: "s-manucure", name: "Manucure Russe (Sans Vernis / Sans Gel)", priceFcfa: 13000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-vernis-simple-mains-classique-et-halal", serviceId: "s-manucure", name: "Vernis Simple Mains (Classique et Halal)", priceFcfa: 9000, durationMin: 30, active: true, recipe: [], reservationMode: "any" },
  { id: "manucure-pedicure-pedicure-me-spa", serviceId: "s-manucure", name: "Pédicure Me Spa", priceFcfa: 26000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-manucure-spa-express", serviceId: "s-manucure", name: "Manucure Spa Express", priceFcfa: 16000, durationMin: 45, active: true, recipe: [], reservationMode: "any" },
  { id: "manucure-pedicure-pedicure-permanent", serviceId: "s-manucure", name: "Pédicure Permanent", priceFcfa: 36000, durationMin: 80, active: true, recipe: [], reservationMode: "both" },
  { id: "manucure-pedicure-perfect-pedicure-russe-permanent", serviceId: "s-manucure", name: "Perfect Pédicure Russe + Permanent", priceFcfa: 39000, durationMin: 80, active: true, recipe: [], reservationMode: "named" },
  { id: "manucure-pedicure-luxury-perfect-pedicure", serviceId: "s-manucure", name: "Luxury Perfect Pédicure", priceFcfa: 39000, durationMin: 90, active: true, recipe: [], reservationMode: "named" },
  { id: "manucure-pedicure-luxury-perfect-manucure-spa", serviceId: "s-manucure", name: "Luxury Perfect Manucure Spa", priceFcfa: 32000, durationMin: 70, active: true, recipe: [], reservationMode: "named" },

  // Onglerie
  { id: "onglerie-vernis-permanent-pieds", serviceId: "s-onglerie", name: "Vernis Permanent Pieds", priceFcfa: 13000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-polygel-extensions", serviceId: "s-onglerie", name: "Polygel Extensions", priceFcfa: 45000, durationMin: 120, active: true, recipe: [], reservationMode: "named" },
  { id: "onglerie-reparation-ongle-1-doigt", serviceId: "s-onglerie", name: "Réparation Ongle (1 Doigt)", priceFcfa: 3500, durationMin: 20, active: true, recipe: [], reservationMode: "any" },
  { id: "onglerie-depose-gel-gel-a-enlever", serviceId: "s-onglerie", name: "Dépose Gel (Gel à Enlever)", priceFcfa: 8000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-gel-x", serviceId: "s-onglerie", name: "Gel X", priceFcfa: 36000, durationMin: 80, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-capsules-permanents-mains", serviceId: "s-onglerie", name: "Capsules Permanents Mains", priceFcfa: 21000, durationMin: 50, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-capsules-gel-pieds", serviceId: "s-onglerie", name: "Capsules Gel Pieds", priceFcfa: 23000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-vernis-permanent-mains", serviceId: "s-onglerie", name: "Vernis Permanent Mains", priceFcfa: 17000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-remplissage-gel", serviceId: "s-onglerie", name: "Remplissage Gel", priceFcfa: 27000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "onglerie-supplement-french", serviceId: "s-onglerie", name: "Supplément French", priceFcfa: 7500, durationMin: 30, active: true, recipe: [], reservationMode: "any" },
  { id: "onglerie-supplement-decoration-chrome-cat-eye-baby-boomer", serviceId: "s-onglerie", name: "Supplément Décoration (Chrome, Cat Eye, Baby Boomer)", priceFcfa: 10000, durationMin: 30, active: true, recipe: [], reservationMode: "any" },

  // Spa
  { id: "spa-soin-du-dos", serviceId: "s-spa", name: "Soin du Dos", priceFcfa: 65000, durationMin: 90, active: true, recipe: [], reservationMode: "named" },
  { id: "spa-hot-stone-pierres-chaudes", serviceId: "s-spa", name: "Hot Stone - Pierres Chaudes", priceFcfa: 59000, durationMin: 60, active: true, recipe: [], reservationMode: "named" },
  { id: "spa-reflexology", serviceId: "s-spa", name: "Reflexology", priceFcfa: 49000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-relax-me-time", serviceId: "s-spa", name: "Relax Me Time", priceFcfa: 60000, durationMin: 80, active: true, recipe: [], reservationMode: "named" },
  { id: "spa-energissant-sportif", serviceId: "s-spa", name: "Energissant Sportif", priceFcfa: 49000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-black-relief-dos", serviceId: "s-spa", name: "Black Relief Dos", priceFcfa: 29000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-de-stress-relaxant", serviceId: "s-spa", name: "De Stress Relaxant", priceFcfa: 45000, durationMin: 55, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-deep-tonique", serviceId: "s-spa", name: "Deep Tonique", priceFcfa: 49000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-steam-time", serviceId: "s-spa", name: "Steam Time", priceFcfa: 40000, durationMin: 50, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-express-head-neck-shoulder", serviceId: "s-spa", name: "Express Head Neck Shoulder", priceFcfa: 29000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "spa-magic-vip-rituel-repair-and-reset", serviceId: "s-spa", name: "Magic VIP Rituel Repair And Reset", priceFcfa: 140000, durationMin: 190, active: true, recipe: [], reservationMode: "named" },
  { id: "spa-pure-delice", serviceId: "s-spa", name: "Pure Delice", priceFcfa: 90000, durationMin: 130, active: true, recipe: [], reservationMode: "named" },

  // Soin du visage
  { id: "soin-du-visage-golden-vip-facial", serviceId: "s-visage", name: "Golden VIP Facial", priceFcfa: 80000, durationMin: 90, active: true, recipe: [], reservationMode: "named" },
  { id: "soin-du-visage-face-lift-and-glow-raffermissant-lift-et-glow", serviceId: "s-visage", name: "Face Lift and Glow - Raffermissant Lift et Glow", priceFcfa: 59000, durationMin: 70, active: true, recipe: [], reservationMode: "named" },
  { id: "soin-du-visage-glow-me-facial", serviceId: "s-visage", name: "Glow Me Facial", priceFcfa: 49000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "soin-du-visage-acne-treatment", serviceId: "s-visage", name: "Acne Treatment", priceFcfa: 49000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "soin-du-visage-hydrate-me-and-restore", serviceId: "s-visage", name: "Hydrate Me and Restore", priceFcfa: 54000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "soin-du-visage-hydrafacial-deep-clean", serviceId: "s-visage", name: "Hydrafacial Deep Clean", priceFcfa: 55000, durationMin: 75, active: true, recipe: [], reservationMode: "named" },
  { id: "soin-du-visage-detox-me-facial", serviceId: "s-visage", name: "Detox Me Facial", priceFcfa: 45000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },

  // Épilation
  { id: "epilation-epilation-menton", serviceId: "s-epilation", name: "Épilation Menton", priceFcfa: 6000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-pack-epilations-completes", serviceId: "s-epilation", name: "Pack Épilations Complètes", priceFcfa: 45000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-bras", serviceId: "s-epilation", name: "Épilation Bras", priceFcfa: 9000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-jambes-completes", serviceId: "s-epilation", name: "Épilation Jambes Complètes", priceFcfa: 14000, durationMin: 45, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-maillot-integral", serviceId: "s-epilation", name: "Épilation Maillot Intégral", priceFcfa: 17000, durationMin: 45, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-demi-jambes", serviceId: "s-epilation", name: "Épilation Demi-Jambes", priceFcfa: 11000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-duvet-ventre", serviceId: "s-epilation", name: "Épilation Duvet / Ventre", priceFcfa: 7000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-maillot-bresilien", serviceId: "s-epilation", name: "Épilation Maillot Brésilien", priceFcfa: 12000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-aisselles", serviceId: "s-epilation", name: "Épilation Aisselles", priceFcfa: 7000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-epilation-sourcils", serviceId: "s-epilation", name: "Épilation Sourcils", priceFcfa: 7000, durationMin: 15, active: true, recipe: [], reservationMode: "any" },
  { id: "epilation-soin-vagifacial", serviceId: "s-epilation", name: "Soin Vagifacial", priceFcfa: 34000, durationMin: 35, active: true, recipe: [], reservationMode: "both" },
  { id: "epilation-soin-vagifacial-maillot-integral", serviceId: "s-epilation", name: "Soin Vagifacial + Maillot Intégral", priceFcfa: 49000, durationMin: 60, active: true, recipe: [], reservationMode: "both" },

  // Mini & Co
  { id: "mini-co-mini-hair-treat-mini-co", serviceId: "s-mini", name: "Mini Hair Treat (Mini&Co)", priceFcfa: 28000, durationMin: 90, active: true, recipe: [], reservationMode: "both" },
  { id: "mini-co-mini-hair-treat-braids-mini-co", serviceId: "s-mini", name: "Mini Hair Treat + Braids (Mini&Co)", priceFcfa: 46000, durationMin: 180, active: true, recipe: [], reservationMode: "both" },
  { id: "mini-co-supplement-coiffure-enfant", serviceId: "s-mini", name: "Supplément Coiffure Enfant", priceFcfa: 10000, durationMin: 50, active: true, recipe: [], reservationMode: "any" },
  { id: "mini-co-definition-boucles-enfant", serviceId: "s-mini", name: "Définition Boucles Enfant", priceFcfa: 9000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "mini-co-defaire-tresses-enfant", serviceId: "s-mini", name: "Défaire Tresses Enfant", priceFcfa: 5000, durationMin: 45, active: true, recipe: [], reservationMode: "both" },
  { id: "mini-co-coupe-pointes-enfants-mini-co", serviceId: "s-mini", name: "Coupe Pointes Enfants (Mini&Co)", priceFcfa: 9000, durationMin: 25, active: true, recipe: [], reservationMode: "both" },
  { id: "mini-co-supplement-brushing-enfant", serviceId: "s-mini", name: "Supplément Brushing Enfant", priceFcfa: 9000, durationMin: 60, active: true, recipe: [], reservationMode: "any" },
  { id: "mini-co-supplements-tresses-enfants-mini-and-co", serviceId: "s-mini", name: "Suppléments Tresses Enfants Mini&Co", priceFcfa: 19000, durationMin: 60, active: true, recipe: [], reservationMode: "any" },
  { id: "mini-co-mini-jely-manucure", serviceId: "s-mini", name: "Mini Jelly Manucure", priceFcfa: 12000, durationMin: 30, active: true, recipe: [], reservationMode: "both" },
  { id: "mini-co-mini-cutie-pedicure", serviceId: "s-mini", name: "Mini Cutie Pédicure", priceFcfa: 15000, durationMin: 35, active: true, recipe: [], reservationMode: "both" },
];

// Prestations éligibles « à deux praticiennes » — rallonges/extensions longues
// où un travail à deux mains en simultané est plausible (même esprit que le
// seed « Tissage Versatile » de point-de-vente, temps de chaise divisé par 2).
const TWO_PRACTITIONER_IDS = new Set([
  "coiffure-hybrid-extensions",
  "coiffure-extensions-tapes-2-paquets-de-cheveux-soit-100-g-18-pouces-coiffage",
  "coiffure-extensions-tapes-3-paquets-de-cheveux-soit-150g-18-pouces-coiffage",
  "coiffure-extension-aux-fils-2-paquets",
  "coiffure-extensions-aux-fils-1-paquet",
  "coiffure-extensions-anneaux-haute-couture-2-paquets",
  "coiffure-tissage-versatile",
  "coiffure-head-spa-ultimate-deep-relaxation",
]);

// `salonIds: []` = héritée du service parent (aucune restriction propre à la
// prestation) — le catalogue réel ne distingue pas les prestations par salon.
export const prestationSeeds: Prestation[] = rawPrestations.map((p) => ({
  ...p,
  salonIds: [],
  twoPractitioners: TWO_PRACTITIONER_IDS.has(p.id),
}));

export const questionSeeds: ServiceQuestion[] = [
  { id: "q-gel-retirer", serviceId: "s-manucure", label: "Avez-vous un vernis permanent ou un gel à retirer ?", type: "oui-non", active: true },
  { id: "q-tresses-retirer", serviceId: "s-coiffure", label: "Avez-vous des tresses à retirer ?", type: "oui-non", active: true },
  { id: "q-allergie", serviceId: "s-manucure", label: "Êtes-vous allergique à certains produits ? (à préciser dans la note interne)", type: "oui-non", active: true },
  { id: "q-asthme", serviceId: "s-spa", label: "Êtes-vous asthmatique ?", type: "oui-non", active: true },
  { id: "q-diabete", serviceId: "s-manucure", label: "Êtes-vous diabétique ?", type: "oui-non", active: true },
  { id: "q-type-cheveux", serviceId: "s-coiffure", label: "Quel est votre type de cheveux ?", type: "choix-multiple", active: false },
  { id: "q-type-peau", serviceId: "s-visage", label: "Quel type de peau avez-vous ? (sensible, grasse ou mixte)", type: "texte", active: true },
  { id: "q-chaleur", serviceId: "s-spa", label: "Supportez-vous la chaleur ?", type: "oui-non", active: true },
  { id: "q-voile", serviceId: "s-coiffure", label: "Êtes-vous voilée ?", type: "oui-non", active: true },
  { id: "q-rappel", serviceId: null, label: "Souhaitez-vous un rappel la veille du rendez-vous ?", type: "oui-non", active: true },
];

/* ------------------------------------------------------------------ */
/* Helpers d'affichage                                                 */
/* ------------------------------------------------------------------ */

// « 30 min », « 1 h », « 1 h 30 ».
export const durationLabel = (min: number) => {
  if (!Number.isFinite(min) || min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};

// Chaîne de saisie libre (« 17.000 », « 17 000 FCFA ») → entier positif.
export const digitsToInt = (raw: string) => {
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

export const recipeLine = (item: RecipeItem) =>
  `${productName(item.productId)} · ${item.qty} ${item.unit}`;

/* ------------------------------------------------------------------ */
/* Dérivés                                                             */
/* ------------------------------------------------------------------ */

export type ServiceRow = {
  service: Service;
  salonLabels: string[];
  prestationCount: number;
  activePrestationCount: number;
  questionCount: number;
  activeQuestionCount: number;
  // Prestations actives que personne dans l'équipe ne sait réaliser.
  unbookableCount: number;
};

// Une prestation active est « non réservable » si aucune praticienne compétente.
export const isUnbookable = (p: Prestation) =>
  p.active && membersForPrestation(p.id).length === 0;

// Liste des services filtrée par salon (un service apparaît s'il est proposé
// dans le salon sélectionné). Conserve l'ordre du tableau `services`.
export function serviceRows(
  services: Service[],
  prestations: Prestation[],
  questions: ServiceQuestion[],
  scope: SalonScope,
): ServiceRow[] {
  return services
    .filter((s) => scope === "all" || s.salonIds.includes(scope))
    .map((service) => {
      const pres = prestations.filter((p) => p.serviceId === service.id);
      const ques = questions.filter((q) => q.serviceId === service.id);
      return {
        service,
        salonLabels: service.salonIds.map((id) => salonName(id)),
        prestationCount: pres.length,
        activePrestationCount: pres.filter((p) => p.active).length,
        questionCount: ques.length,
        activeQuestionCount: ques.filter((q) => q.active).length,
        unbookableCount: pres.filter(isUnbookable).length,
      };
    });
}

// Prestations réservables dans un salon donné. `salonIds: []` = aucune
// restriction propre → la prestation suit son service parent.
export const prestationsForSalon = (prestations: Prestation[], scope: SalonScope) =>
  scope === "all"
    ? prestations
    : prestations.filter((p) => (p.salonIds.length ? p.salonIds.includes(scope) : true));

export const orphanPrestations = (prestations: Prestation[]) =>
  prestations.filter((p) => p.serviceId === null);

export const orphanQuestions = (questions: ServiceQuestion[]) =>
  questions.filter((q) => q.serviceId === null);

let seq = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;
