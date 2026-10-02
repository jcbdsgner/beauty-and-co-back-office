// Données « Services » — catalogue réel Beauty & Co (repris de point-de-vente/lib/data/menu.ts),
// front-end uniquement : aucune API, aucune persistance ici, l'édition reste en mémoire de session.
// Indépendant du barrel `@/lib/mock` : importer directement `@/lib/mock/services`.
//
// Un seul parcours regroupe ce qui était éclaté sur quatre écrans :
//
//   Service (catégorie) ─┬─ Prestations (facturables : prix + durée)
//                        │      └─ Recette (produits consommés → déduits du stock
//                        │         automatiquement à la fin de la visite)
//                        └─ Questions (obligatoires, posées à la réservation)
//
// Le back-office DÉFINIT ce catalogue ; la réservation en ligne b&co et
// point-de-vente le consomment (`lib/prise-rdv/data/booking-services.ts` et
// `lib/data/menu.ts` côté point-de-vente — 2026-09-27). D'où l'alignement exact
// sur leurs données : catégories, image, sous-catégories, « à deux », questions.
//
// « Sans catégorie » = éléments orphelins (`serviceId === null`), à rattacher.
//
// Catégories : les catégories réelles de la réservation ; Mini & Co est UNE
// catégorie à deux sous-catégories Hair / Spa (2026-09-28, à la demande de la
// propriétaire — la réservation les présente en deux cartes).
// « Brows / Lashes » (prestations fictives) a été retiré : absent du catalogue réel.
//
// Produits : le catalogue de consommables était fictif ; il est remplacé par le vrai
// catalogue Kérastase et marques (consommé par les prestations Coiffure, suivi en
// stock). Les boissons du bar sont une famille à part, sans stock (`Boisson`
// ci-dessous). Les prestations hors
// Coiffure n'ont pas de recette : aucune donnée réelle de consommation n'existe pour
// elles côté point-de-vente.

import {
  WEEKDAYS,
  fcfa,
  inScope,
  salonConfig,
  salonName,
  salons,
  type DayOpening,
  type SalonId,
  type SalonScope,
  type Weekday,
} from "./beautyandco";
import { membersForPrestation } from "./staff";

export { fcfa };

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const serviceSalons: { id: SalonId; name: string }[] = salons.map((s) => ({
  id: s.id,
  name: s.name,
}));

// Questions obligatoires posées à la réservation, par catégorie — même modèle
// que le parcours de réservation b&co que point-de-vente embarque
// (`lib/prise-rdv/data/booking-services.ts`, `CategoryQuestion`) : oui/non, ou
// texte libre avec un texte d'aide. Pas de « choix multiple » (retiré le
// 2026-09-27) : la réservation ne sait pas le poser.
export type QuestionType = "oui-non" | "texte";

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "oui-non", label: "Oui / Non" },
  { value: "texte", label: "Texte libre" },
];

export const questionTypeLabel = (t: QuestionType) =>
  QUESTION_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;


// Image d'une catégorie (2026-09-27) : importée par la propriétaire (dataURL de
// session) ou chemin d'un visuel de `public/` — c'est ce que la réservation en
// ligne affiche (`BookingService.image` côté point-de-vente). Remplace le choix
// parmi 7 pictogrammes prédéfinis, qui n'existait nulle part ailleurs. Les
// catégories seed pointent vers les visuels réels b&co (`public/images/categories/`).

// Produits consommables (côté stock) : catalogue réel Kérastase et marques
// (utilisé dans les recettes des prestations Coiffure, vendu au détail). `image` = photo produit réelle (sert de défaut à la
// fiche Stock, remplaçable par une photo de session).
// `priceFcfa` : prix de vente au détail. Renseigné pour tous les produits
// (2026-09-22, audit de parité point-de-vente — corrige une hypothèse fausse :
// `lib/data/menu.ts::PRODUITS` de point-de-vente porte bien un prix réel sur
// les 78 produits Kérastase/marques) — mais seules les boissons du bar sont
// proposées en extra de rendez-vous (`sellableExtras`).
// Marque (catégorie produit) et gamme, comme `Produit.categoryId` /
// `subcategory` de point-de-vente (ADR 0016) — seule Kérastase a des gammes.
export type ProductBrand = "kerastase" | "saryna-keys" | "nefertiti" | "beccy-wave" | "autres";

export const PRODUCT_BRANDS: { id: ProductBrand; name: string }[] = [
  { id: "kerastase", name: "Kérastase" },
  { id: "saryna-keys", name: "Saryna Keys" },
  { id: "nefertiti", name: "Nefertiti" },
  { id: "beccy-wave", name: "Beccy Wave" },
  { id: "autres", name: "Autres" },
];

export type Product = {
  id: string;
  brand: ProductBrand;
  gamme?: string;
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
  { id: "nutritive-8hmns-serum-90ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive 8HMNS Serum 90ml", defaultUnit: "ml", image: "/images/produits/nutritive-8hmns-serum-90ml.jpg", priceFcfa: 42000 },
  { id: "nutritive-bain-riche-250ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Bain Riche 250ml", defaultUnit: "ml", image: "/images/produits/nutritive-bain-riche-250ml.jpg", priceFcfa: 23000 },
  { id: "nutritive-bain-satin-250ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Bain Satin 250ml", defaultUnit: "ml", image: "/images/produits/nutritive-bain-satin-250ml.jpg", priceFcfa: 23000 },
  { id: "nutritive-lait-vital-200ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Lait Vital 200ml", defaultUnit: "ml", image: "/images/produits/nutritive-lait-vital-200ml.jpg", priceFcfa: 32000 },
  { id: "nutritive-masque-riche-200ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Masque Riche 200ml", defaultUnit: "ml", image: "/images/produits/nutritive-masque-riche-200ml.jpg", priceFcfa: 42000 },
  { id: "nutritive-masque-intense-200ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Masque Intense 200ml", defaultUnit: "ml", image: "/images/produits/nutritive-masque-intense-200ml.jpg", priceFcfa: 42000 },
  { id: "nutritive-nectar-therm-150ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Nectar Therm 150ml", defaultUnit: "ml", image: "/images/produits/nutritive-nectar-therm-150ml.jpg", priceFcfa: 32000 },
  { id: "nutritive-scalp-serum-90ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Scalp Serum 90ml", defaultUnit: "ml", image: "/images/produits/nutritive-scalp-serum-90ml.jpg", priceFcfa: 42000 },
  { id: "nutritive-soin-150ml", brand: "kerastase", gamme: "Nutritive", name: "Nutritive Soin 150ml", defaultUnit: "ml", image: "/images/produits/nutritive-soin-150ml.jpg", priceFcfa: 32000 },
  { id: "genesis-bain-riche-250ml", brand: "kerastase", gamme: "Genesis", name: "Genesis Bain Riche 250ml", defaultUnit: "ml", image: "/images/produits/genesis-bain-riche-250ml.jpg", priceFcfa: 24000 },
  { id: "genesis-cure-90ml", brand: "kerastase", gamme: "Genesis", name: "Genesis Cure 90ml", defaultUnit: "ml", image: "/images/produits/genesis-cure-90ml.jpg", priceFcfa: 42000 },
  { id: "genesis-fluide-150ml", brand: "kerastase", gamme: "Genesis", name: "Genesis Fluide 150ml", defaultUnit: "ml", image: "/images/produits/genesis-fluide-150ml.jpg", priceFcfa: 32000 },
  { id: "genesis-masque-200ml", brand: "kerastase", gamme: "Genesis", name: "Genesis Masque 200ml", defaultUnit: "ml", image: "/images/produits/genesis-masque-200ml.jpg", priceFcfa: 42000 },
  { id: "gloss-absolu-bain-250ml", brand: "kerastase", gamme: "Gloss Absolu", name: "Gloss Absolu Bain 250ml", defaultUnit: "ml", image: "/images/produits/gloss-absolu-bain-250ml.jpg", priceFcfa: 24000 },
  { id: "k-gloss-absolu-bain-riche-250ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Bain Riche 250ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-bain-riche-250ml.jpg", priceFcfa: 24000 },
  { id: "k-gloss-absolu-fondant-250ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Fondant 250ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-fondant-250ml.jpg", priceFcfa: 32000 },
  { id: "k-gloss-absolu-cream-250ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Cream 250ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-cream-250ml.jpg", priceFcfa: 39000 },
  { id: "k-gloss-absolu-hair-mist-30ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Hair Mist 30ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-hair-mist-30ml.jpg", priceFcfa: 32000 },
  { id: "k-gloss-absolu-masque-nutritive-200ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Masque Nutritive 200ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-masque-nutritive-200ml.jpg", priceFcfa: 42000 },
  { id: "k-gloss-absolu-oil-45ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Oil 45ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-oil-45ml.jpg", priceFcfa: 35000 },
  { id: "k-gloss-absolu-spray-190ml", brand: "kerastase", gamme: "Gloss Absolu", name: "K Gloss Absolu Spray 190ml", defaultUnit: "ml", image: "/images/produits/k-gloss-absolu-spray-190ml.jpg", priceFcfa: 33000 },
  { id: "k-symbiose-bain-creme-250ml", brand: "kerastase", gamme: "Symbiose", name: "K Symbiose Bain Creme 250ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-bain-creme-250ml.jpg", priceFcfa: 24000 },
  { id: "k-symbiose-bain-purete-250ml", brand: "kerastase", gamme: "Symbiose", name: "K Symbiose Bain Pureté 250ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-bain-purete-250ml.jpg", priceFcfa: 24000 },
  { id: "k-symbiose-fondant-hydra-200ml", brand: "kerastase", gamme: "Symbiose", name: "K Symbiose Fondant Hydra 200ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-fondant-hydra-200ml.jpg", priceFcfa: 32000 },
  { id: "k-symbiose-masque-200ml", brand: "kerastase", gamme: "Symbiose", name: "K Symbiose Masque 200ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-masque-200ml.jpg", priceFcfa: 42000 },
  { id: "k-symbiose-micropeel-200ml", brand: "kerastase", gamme: "Symbiose", name: "K Symbiose Micropeel 200ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-micropeel-200ml.jpg", priceFcfa: 39000 },
  { id: "k-symbiose-serum-90ml", brand: "kerastase", gamme: "Symbiose", name: "K Symbiose Serum 90ml", defaultUnit: "ml", image: "/images/produits/k-symbiose-serum-90ml.jpg", priceFcfa: 42000 },
  { id: "k-chroma-absolu-bain-lim-us-250ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Absolu Bain Lim US 250ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-bain-lim-us-250ml.jpg", priceFcfa: 23000 },
  { id: "k-chroma-absolu-bain-opa-us-250ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Absolu Bain OPA US 250ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-bain-opa-us-250ml.jpg", priceFcfa: 23000 },
  { id: "k-chroma-absolu-fluide-250ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Absolu Fluide 250ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-fluide-250ml.jpg", priceFcfa: 27000 },
  { id: "k-chroma-absolu-fondant-200ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Absolu Fondant 200ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-fondant-200ml.jpg", priceFcfa: 32000 },
  { id: "k-chroma-absolu-leave-in-150ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Absolu Leave In 150ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-leave-in-150ml.jpg", priceFcfa: 28000 },
  { id: "k-chroma-absolu-mask-reco-200ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Absolu Mask Reco 200ml", defaultUnit: "ml", image: "/images/produits/k-chroma-absolu-mask-reco-200ml.jpg", priceFcfa: 42000 },
  { id: "k-chroma-oil-75ml", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-chroma-oil-75ml.jpg", priceFcfa: 42000 },
  { id: "k-chroma-oil", brand: "kerastase", gamme: "Chroma Absolu", name: "K Chroma Oil", defaultUnit: "application", priceFcfa: 35000 },
  { id: "k-blond-absolu-night-serum-90ml", brand: "kerastase", gamme: "Blond Absolu", name: "K Blond Absolu Night Serum 90ml", defaultUnit: "ml", image: "/images/produits/k-blond-absolu-night-serum-90ml.jpg", priceFcfa: 42000 },
  { id: "k-blond-oil-75ml", brand: "kerastase", gamme: "Blond Absolu", name: "K Blond Oil 75ml", defaultUnit: "ml", priceFcfa: 35000 },
  { id: "k-blond-oil-75ml-2", brand: "kerastase", gamme: "Blond Absolu", name: "K Blond Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-blond-oil-75ml-2.jpg", priceFcfa: 42000 },
  { id: "ker-blond-bain-uviolet-250ml", brand: "kerastase", gamme: "Blond Absolu", name: "Ker Blond Bain Uviolet 250ml", defaultUnit: "ml", image: "/images/produits/ker-blond-bain-uviolet-250ml.jpg", priceFcfa: 24000 },
  { id: "ker-blond-cicaflash-250ml", brand: "kerastase", gamme: "Blond Absolu", name: "Ker Blond Cicaflash 250ml", defaultUnit: "ml", image: "/images/produits/ker-blond-cicaflash-250ml.jpg", priceFcfa: 32000 },
  { id: "ker-blond-cicaplasme-150ml", brand: "kerastase", gamme: "Blond Absolu", name: "Ker Blond Cicaplasme 150ml", defaultUnit: "ml", image: "/images/produits/ker-blond-cicaplasme-150ml.jpg", priceFcfa: 26000 },
  { id: "ker-blond-masque-ultravio", brand: "kerastase", gamme: "Blond Absolu", name: "Ker Blond Masque Ultravio", defaultUnit: "application", image: "/images/produits/ker-blond-masque-ultravio.jpg", priceFcfa: 42000 },
  { id: "k-chrono-oil-75ml", brand: "kerastase", gamme: "Chronologiste", name: "K Chrono Oil 75ml", defaultUnit: "ml", priceFcfa: 51000 },
  { id: "k-chrono-oil-75ml-2", brand: "kerastase", gamme: "Chronologiste", name: "K Chrono Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-chrono-oil-75ml-2.jpg", priceFcfa: 66000 },
  { id: "k-chrono-bain-250ml", brand: "kerastase", gamme: "Chronologiste", name: "K Chrono Bain 250ml", defaultUnit: "ml", image: "/images/produits/k-chrono-bain-250ml.jpg", priceFcfa: 27000 },
  { id: "k-chrono-masque-200ml", brand: "kerastase", gamme: "Chronologiste", name: "K Chrono Masque 200ml", defaultUnit: "ml", image: "/images/produits/k-chrono-masque-200ml.jpg", priceFcfa: 47000 },
  { id: "k-chrono-pre-shampoing-200ml", brand: "kerastase", gamme: "Chronologiste", name: "K Chrono Pre Shampoing 200ml", defaultUnit: "ml", image: "/images/produits/k-chrono-pre-shampoing-200ml.jpg", priceFcfa: 27000 },
  { id: "ks-chrono-thermique-150ml", brand: "kerastase", gamme: "Chronologiste", name: "KS Chrono Thermique 150ml", defaultUnit: "ml", image: "/images/produits/ks-chrono-thermique-150ml.jpg", priceFcfa: 32000 },
  { id: "k-chrono-bain-250ml-2", brand: "kerastase", gamme: "Chronologiste", name: "K Chrono Bain 250ml", defaultUnit: "ml", image: "/images/produits/k-chrono-bain-250ml-2.jpg", priceFcfa: 29000 },
  { id: "ker-res-masque-force-archi-200ml", brand: "kerastase", gamme: "Force", name: "Ker Res Masque Force Archi 200ml", defaultUnit: "ml", image: "/images/produits/ker-res-masque-force-archi-200ml.jpg", priceFcfa: 38000 },
  { id: "ker-resist-bain-force-archi-250m", brand: "kerastase", gamme: "Force", name: "Ker Resist Bain Force Archi 250m", defaultUnit: "application", image: "/images/produits/ker-resist-bain-force-archi-250m.jpg", priceFcfa: 23000 },
  { id: "ker-resisr-ciment-anti-usure-200ml", brand: "kerastase", gamme: "Force", name: "Ker Resisr Ciment Anti Usure 200ml", defaultUnit: "ml", image: "/images/produits/ker-resisr-ciment-anti-usure-200ml.jpg", priceFcfa: 31000 },
  { id: "ker-res-serum-therapiste-2-15ml", brand: "kerastase", gamme: "Thérapiste", name: "Ker Res Serum Therapiste 2*15ml", defaultUnit: "ml", image: "/images/produits/ker-res-serum-therapiste-2-15ml.jpg", priceFcfa: 32000 },
  { id: "ker-res-serum-bain-therapiste-250ml", brand: "kerastase", gamme: "Thérapiste", name: "Ker Res Serum Bain Therapiste 250ml", defaultUnit: "ml", image: "/images/produits/ker-res-serum-bain-therapiste-250ml.jpg", priceFcfa: 24000 },
  { id: "bain-nourissant-curl-250ml", brand: "kerastase", gamme: "Curl Manifesto", name: "Bain Nourissant Curl 250ml", defaultUnit: "ml", image: "/images/produits/bain-nourissant-curl-250ml.jpg", priceFcfa: 24000 },
  { id: "creme-curl-150ml", brand: "kerastase", gamme: "Curl Manifesto", name: "Creme Curl 150ml", defaultUnit: "ml", image: "/images/produits/creme-curl-150ml.jpg", priceFcfa: 32000 },
  { id: "gelee-curl-150ml", brand: "kerastase", gamme: "Curl Manifesto", name: "Gelee Curl 150ml", defaultUnit: "ml", image: "/images/produits/gelee-curl-150ml.jpg", priceFcfa: 32000 },
  { id: "curl-huile-50ml", brand: "kerastase", gamme: "Curl Manifesto", name: "Curl Huile 50ml", defaultUnit: "ml", image: "/images/produits/curl-huile-50ml.jpg", priceFcfa: 41000 },
  { id: "lotion-refresher-curl-190ml", brand: "kerastase", gamme: "Curl Manifesto", name: "Lotion Refresher Curl 190ml", defaultUnit: "ml", image: "/images/produits/lotion-refresher-curl-190ml.jpg", priceFcfa: 33000 },
  { id: "masque-curl-200ml", brand: "kerastase", gamme: "Curl Manifesto", name: "Masque Curl 200ml", defaultUnit: "ml", image: "/images/produits/masque-curl-200ml.jpg", priceFcfa: 41000 },
  { id: "k-alpha-bain-renovateur-250ml", brand: "kerastase", gamme: "Première", name: "K Alpha Bain Renovateur 250ml", defaultUnit: "ml", image: "/images/produits/k-alpha-bain-renovateur-250ml.jpg", priceFcfa: 32000 },
  { id: "k-alpha-fondant-fluidity-200ml", brand: "kerastase", gamme: "Première", name: "K Alpha Fondant Fluidity 200ml", defaultUnit: "ml", image: "/images/produits/k-alpha-fondant-fluidity-200ml.jpg", priceFcfa: 41000 },
  { id: "k-alpha-huile-lumiere-30ml", brand: "kerastase", gamme: "Première", name: "K Alpha Huile Lumiere 30ml", defaultUnit: "ml", image: "/images/produits/k-alpha-huile-lumiere-30ml.jpg", priceFcfa: 41000 },
  { id: "k-alpha-lotion-jelly-250ml", brand: "kerastase", gamme: "Première", name: "K Alpha Lotion Jelly 250ml", defaultUnit: "ml", image: "/images/produits/k-alpha-lotion-jelly-250ml.jpg", priceFcfa: 58000 },
  { id: "k-alpha-masque-fill-force-200ml", brand: "kerastase", gamme: "Première", name: "K Alpha Masque Fill Force 200ml", defaultUnit: "ml", image: "/images/produits/k-alpha-masque-fill-force-200ml.jpg", priceFcfa: 53000 },
  { id: "k-alpha-serum-fondamental-90ml", brand: "kerastase", gamme: "Première", name: "K Alpha Serum Fondamental 90ml", defaultUnit: "ml", image: "/images/produits/k-alpha-serum-fondamental-90ml.jpg", priceFcfa: 48000 },
  { id: "k-elixir-oil-75ml", brand: "kerastase", gamme: "Elixir Ultime", name: "K Elixir Oil 75ml", defaultUnit: "ml", image: "/images/produits/k-elixir-oil-75ml.jpg", priceFcfa: 41000 },
  { id: "k-elixir-oil-30ml", brand: "kerastase", gamme: "Elixir Ultime", name: "K Elixir Oil 30ml", defaultUnit: "ml", image: "/images/produits/k-elixir-oil-30ml.jpg", priceFcfa: 26000 },
  { id: "ker-elixir-ult-bain-250ml", brand: "kerastase", gamme: "Elixir Ultime", name: "Ker Elixir ULT Bain 250ml", defaultUnit: "ml", image: "/images/produits/ker-elixir-ult-bain-250ml.jpg", priceFcfa: 23000 },
  { id: "ker-elixir-ult-masque-200ml", brand: "kerastase", gamme: "Elixir Ultime", name: "Ker Elixir ULT Masque 200ml", defaultUnit: "ml", image: "/images/produits/ker-elixir-ult-masque-200ml.jpg", priceFcfa: 42000 },
  // Boissons — bar Beauty & Co (données b&co lib/data/bar-beauty.ts), vendues au détail (pas de recette).
  // Prix retail plausibles (aucune donnée de prix réelle n'existe côté point-de-vente).
  // Autres marques + accessoires — vendus au détail, sans recette (repris de
  // point-de-vente/lib/data/menu.ts, catégories Saryna Keys / Nefertiti / Beccy
  // Wave / Autres — absents de la synchronisation initiale du 2026-09-04).
  { id: "antiseptique-saryna-keys", brand: "saryna-keys", name: "Antisceptique Saryna Keys", defaultUnit: "pièce", image: "/images/produits/antiseptique-saryna-keys.jpg", priceFcfa: 3000 },
  { id: "damage-repair-oil-saryna-keys", brand: "saryna-keys", name: "Damage Repair Oil Saryna Keys", defaultUnit: "pièce", image: "/images/produits/damage-repair-oil-saryna-keys.jpg", priceFcfa: 30000 },
  { id: "nefertiti-kinky-straight", brand: "nefertiti", name: "Nefertiti Kinky Straight", defaultUnit: "pièce", image: "/images/produits/nefertiti-kinky-straight.jpg", priceFcfa: 125000 },
  { id: "hd-lace-frontal-nefertiti-kinky-straight", brand: "nefertiti", name: "HD Lace Frontal Nefertiti Kinky Straight", defaultUnit: "pièce", image: "/images/produits/hd-lace-frontal-nefertiti-kinky-straight.jpg", priceFcfa: 210000 },
  { id: "ready-made-ponytail-beccy-wave", brand: "beccy-wave", name: "Ready Made Ponytail Beccy Wave", defaultUnit: "pièce", image: "/images/produits/ready-made-ponytail-beccy-wave.jpg", priceFcfa: 125000 },
  { id: "becky-wave-raw-hair", brand: "beccy-wave", name: "Becky Wave Raw Hair", defaultUnit: "pièce", image: "/images/produits/becky-wave-raw-hair.jpg", priceFcfa: 78900 },
  { id: "correcteur-fluide-swiss-perfection-haute-couvrance", brand: "autres", name: "Correcteur Fluide « Swiss Perfection » – Haute Couvrance", defaultUnit: "pièce", image: "/images/produits/correcteur-fluide-swiss-perfection-haute-couvrance.jpg", priceFcfa: 38500 },
  { id: "peigne-bijou-eclat-de-mariee-finition-or-rose", brand: "autres", name: "Peigne Bijou « Éclat de Mariée » – Finition Or Rose", defaultUnit: "pièce", image: "/images/produits/peigne-bijou-eclat-de-mariee-finition-or-rose.jpg", priceFcfa: 26000 },
];

// Résolvent un produit OU une boisson (les extras de rendez-vous mêlent les deux).
export const productName = (id: string) =>
  products.find((p) => p.id === id)?.name ??
  boissonSeeds.find((b) => b.id === id)?.name ??
  "Produit inconnu";

export const productPrice = (id: string) =>
  products.find((p) => p.id === id)?.priceFcfa ?? boissonSeeds.find((b) => b.id === id)?.priceFcfa ?? 0;

// Boissons du Bar Beauty & Co — famille à part, ni prestation ni produit
// (2026-09-27, comme `Boisson` de point-de-vente, ADR 0016 : pas de catégorie,
// **pas de stock** — « un bar ne se compte pas au verre »). Mêmes références,
// prix et compositions que la carte du bar b&co (`lib/data/boissons.ts` de
// point-de-vente, qui les lit sans les éditer : c'est ici qu'elles se
// définissent). Édition dans `/services`, onglet Boissons.
export type Boisson = {
  id: string;
  name: string;
  priceFcfa: number;
  active: boolean;
  image?: string;
  description?: string;
};

export const boissonSeeds: Boisson[] = [
  { id: "boisson-pure-glow", name: "Pure Glow", priceFcfa: 4500, active: true, description: "Collagène, passion, orange amer, ruby grape", image: "/images/boissons/pure-glow.jpg" },
  { id: "boisson-dragon-mystic", name: "Dragon Mystic", priceFcfa: 4500, active: true, description: "Dragon fruit, timer berry, eau pétillante", image: "/images/boissons/dragon-mystic.jpg" },
  { id: "boisson-pause-tropical", name: "Pause Tropical", priceFcfa: 4500, active: true, description: "Magnésium, ananas, menthe, citron", image: "/images/boissons/pause-tropical.jpg" },
  { id: "boisson-eclat-matcha", name: "L'Éclat Matcha", priceFcfa: 4500, active: true, description: "Matcha fraise ou vanille au choix", image: "/images/boissons/eclat-matcha.jpg" },
  { id: "boisson-ice-coffee-caramel", name: "Ice Coffee Caramel", priceFcfa: 4500, active: true, description: "Caramel, expresso, lait au choix", image: "/images/boissons/ice-coffee-caramel.jpg" },
  { id: "boisson-soin-glace-ice-tea", name: "Soin Glacé Ice Tea", priceFcfa: 3500, active: true, description: "Pêche citron", image: "/images/boissons/soin-glace-ice-tea.jpg" },
  { id: "boisson-pretty-latte", name: "Pretty Latte", priceFcfa: 3900, active: true, description: "Lait froid ou chaud au choix et garniture au choix (caramel, vanille, cookies, spéculos)" },
];

// Extras de rendez-vous (boissons/produits pré-commandés, cf. `@/lib/mock/rendezvous`) :
// "boisson" = une boisson du bar, "produit" = un produit du catalogue.
export const productKind = (id: string): "produit" | "boisson" =>
  id.startsWith("boisson-") ? "boisson" : "produit";

// Boissons actives du bar. (La prise de RDV `components/prise-rdv/` lit la
// carte du bar recopiée de point-de-vente, `lib/prise-rdv/data/bar-beauty.ts`.)
export const sellableExtras = boissonSeeds.filter((b) => b.active);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RecipeItem = {
  id: string;
  productId: string;
  qty: number;
  unit: RecipeUnit;
};

// Sous-catégorie d'un service (catégorie) — regroupement optionnel des
// prestations à l'intérieur d'une colonne du tableau Kanban (ex. Coiffure →
// Défrisage / Extensions & tissages / Soins capillaires…). Un service sans
// sous-catégorie affiche ses prestations à plat.
export type Subcategory = {
  id: string;
  name: string;
};

export type Prestation = {
  id: string;
  serviceId: string | null; // null = sans catégorie
  // Sous-catégorie du service parent — n'a de sens que si `serviceId` est non
  // nul et référence une entrée de `Service.subcategories`. `null`/absent =
  // regroupée dans « Autres » (ou à plat si le service n'a pas de
  // sous-catégories).
  subcategoryId?: string | null;
  name: string;
  priceFcfa: number;
  durationMin: number;
  active: boolean;
  recipe: RecipeItem[];
  // Salons où la prestation est proposée — sous-ensemble des `salonIds` du service
  // parent. `[]` = héritée de tous les salons du parent (aucune restriction).
  salonIds: SalonId[];
  // Prestation réalisable à deux praticiennes simultanément (temps de chaise
  // divisé) — repris du principe de point-de-vente (`twoPractitionersEligible`),
  // activé ici sur quelques prestations longues à rallonges/extensions où deux
  // mains en simultané sont plausibles.
  twoPractitioners?: boolean;
  // Jours et horaires où la prestation se réserve (2026-09-28, même grammaire
  // que les heures d'un salon). Absent / `null` = pendant toutes les heures
  // d'ouverture du salon. Toujours recoupé avec l'ouverture du salon : un jour
  // où le salon est fermé reste fermé.
  availability?: PrestationAvailability | null;
  // Périodes où la prestation n'est pas proposée du tout (2026-10-01 — rupture
  // d'un produit, formation, saison…). Bornes ISO incluses ; s'ajoute aux jours
  // de la semaine ci-dessus.
  unavailablePeriods?: PrestationPause[];
  // Prestations qui ne peuvent pas être réservées pour la même personne dans
  // la même visite (2026-10-01). Relation symétrique : `setIncompatibilities`
  // écrit la règle des deux côtés, `incompatiblesOf` la lit des deux côtés.
  incompatibleWith?: string[];
};

export type PrestationAvailability = Record<Weekday, DayOpening>;

/** Période d'indisponibilité d'une prestation. Bornes ISO `yyyy-mm-dd` incluses. */
export type PrestationPause = { id: string; from: string; to: string; reason: string };

export const newPauseId = () => `pp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** La période qui couvre `iso`, s'il y en a une. */
export const pauseOn = (periods: PrestationPause[] | undefined, iso: string): PrestationPause | null =>
  periods?.find((p) => iso >= p.from && iso <= p.to) ?? null;

/** Périodes en cours ou à venir à partir de `fromIso`, triées par date de début. */
export const upcomingPauses = (periods: PrestationPause[] | undefined, fromIso: string): PrestationPause[] =>
  (periods ?? []).filter((p) => p.to >= fromIso).sort((a, b) => a.from.localeCompare(b.from));

const FR_MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const frDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { d, m: FR_MONTHS_SHORT[m - 1], y };
};

/** « 12 oct. 2026 » — sans l'année avec `short`. */
export const pauseDayLabel = (iso: string, short = false) => {
  const { d, m, y } = frDay(iso);
  return short ? `${d} ${m}` : `${d} ${m} ${y}`;
};

/** « le 12 oct. 2026 » / « du 12 au 15 oct. 2026 » / « du 28 sept. au 3 oct. 2026 ». */
export function pauseRangeLabel(p: Pick<PrestationPause, "from" | "to">): string {
  const a = frDay(p.from);
  const b = frDay(p.to);
  if (p.from === p.to) return `le ${a.d} ${a.m} ${a.y}`;
  if (a.y !== b.y) return `du ${a.d} ${a.m} ${a.y} au ${b.d} ${b.m} ${b.y}`;
  if (a.m !== b.m) return `du ${a.d} ${a.m} au ${b.d} ${b.m} ${b.y}`;
  return `du ${a.d} au ${b.d} ${b.m} ${b.y}`;
}

// Point de départ d'un réglage personnalisé : les heures du 1er salon qui la propose.
export const defaultAvailability = (salonId: SalonId): PrestationAvailability => ({ ...salonConfig(salonId).hours });

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const WEEKDAY_BY_JS_DAY: Weekday[] = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
export const weekdayOfIso = (iso: string): Weekday => WEEKDAY_BY_JS_DAY[new Date(`${iso}T00:00:00`).getDay()];

/** La prestation peut-elle se tenir ce jour-là, sur [startMin, endMin[ ? (hors ouverture du salon) */
export function prestationAvailableAt(
  rules: Pick<Prestation, "availability" | "unavailablePeriods"> | null | undefined,
  iso: string,
  startMin: number,
  endMin: number,
): boolean {
  if (pauseOn(rules?.unavailablePeriods, iso)) return false;
  const availability = rules?.availability;
  if (!availability) return true;
  const d = availability[weekdayOfIso(iso)];
  if (d.closed) return false;
  return startMin >= toMin(d.open) && endMin <= toMin(d.close);
}

const SHORT_DAY: Record<Weekday, string> = { lun: "lun", mar: "mar", mer: "mer", jeu: "jeu", ven: "ven", sam: "sam", dim: "dim" };

/** Résumé lisible d'un réglage personnalisé — « Mar, jeu, sam · 10:00–14:00 » ; `null` si aucun. */
export function availabilitySummary(availability: PrestationAvailability | null | undefined): string | null {
  if (!availability) return null;
  const open = WEEKDAYS.filter((w) => !availability[w].closed);
  if (open.length === 0) return "Aucun jour";
  const days = open.map((w) => SHORT_DAY[w]).join(", ");
  const ranges = [
    ...new Set(open.map((w) => {
      const d = availability[w] as Extract<DayOpening, { closed: false }>;
      return `${d.open}–${d.close}`;
    })),
  ];
  const label = days.charAt(0).toUpperCase() + days.slice(1);
  return ranges.length === 1 ? `${label} · ${ranges[0]}` : `${label} · horaires variables`;
}

export type ServiceQuestion = {
  id: string;
  serviceId: string | null; // null = sans catégorie
  label: string;
  type: QuestionType;
  // Texte d'aide du champ, pour une question `texte` (ex. « Précisez votre
  // choix d'huile »).
  placeholder?: string;
  active: boolean;
};

export type Service = {
  id: string;
  name: string;
  // Image affichée à la réservation — chemin `public/` ou dataURL importée ;
  // `null` = pas d'image (vignette à l'initiale).
  image: string | null;
  description: string;
  active: boolean;
  salonIds: SalonId[]; // salons où le service est proposé
  // Sous-catégories éditables, dans l'ordre d'affichage des lanes du Kanban.
  // `[]` = pas de sous-catégorisation, les prestations s'affichent à plat.
  subcategories: Subcategory[];
};

/* ------------------------------------------------------------------ */
/* Fixtures — catégories réelles de la réservation b&co                */
/* ------------------------------------------------------------------ */

// Catégories et sous-catégories = celles du parcours de réservation b&co
// (`booking-services.ts` de point-de-vente, 2026-09-27) : 7 catégories — Mini & Co
// en une seule, sous-catégories Hair / Spa —, et les 11 sous-catégories réelles
// de Coiffure (les autres catégories n'en ont pas). Images = les
// visuels réels de la réservation, copiés dans `public/images/categories/`.
export const serviceSeeds: Service[] = [
  {
    id: "s-coiffure",
    name: "Coiffure",
    image: "/images/categories/service-coiffure.svg",
    description: "Coupes, brushings, tresses, tissages, lissages et soins capillaires.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [
      { id: "sub-coiffure-defrisage", name: "Défrisage" },
      { id: "sub-coiffure-luxury-extensions", name: "Luxury Extensions" },
      { id: "sub-coiffure-perruques", name: "Perruques" },
      { id: "sub-coiffure-brushing", name: "Brushing" },
      { id: "sub-coiffure-lissage", name: "Lissage" },
      { id: "sub-coiffure-coupe", name: "Coupe" },
      { id: "sub-coiffure-tresses", name: "Tresses" },
      { id: "sub-coiffure-nos-rituels-soins", name: "Nos Rituels Soins" },
      { id: "sub-coiffure-tissage", name: "Tissage" },
      { id: "sub-coiffure-coiffure", name: "Coiffure" },
      { id: "sub-coiffure-head-spa", name: "Head Spa" },
    ],
  },
  {
    id: "s-manucure",
    name: "Manucure & pédicure",
    image: "/images/categories/service-manucure-pedicure.svg",
    description: "Soin des mains et des pieds, manucure et pédicure.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [],
  },
  {
    id: "s-onglerie",
    name: "Onglerie",
    image: "/images/categories/icon-onglerie.svg",
    description: "Capsules, gel, vernis permanent et nail art.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [],
  },
  {
    id: "s-spa",
    name: "Spa",
    image: "/images/categories/service-spa.svg",
    description: "Massages, soins du dos et rituels bien-être.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [],
  },
  {
    id: "s-visage",
    name: "Soin du visage",
    image: "/images/categories/service-soin-visage.svg",
    description: "Nettoyage de peau, soins hydratants et anti-âge.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [],
  },
  {
    id: "s-epilation",
    name: "Épilation",
    image: "/images/categories/service-epilation.svg",
    description: "Épilation à la cire, visage et corps.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [],
  },
  {
    id: "s-mini",
    name: "Mini & Co",
    image: "/images/categories/service-coiffure.svg",
    description: "Coiffure, soins et spa des enfants — jours Mini&Co : mardi, mercredi, dimanche.",
    active: true,
    salonIds: ["almadies", "seaplaza"],
    subcategories: [
      { id: "sub-mini-hair", name: "Hair" },
      { id: "sub-mini-spa", name: "Spa" },
    ],
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
  { id: "coiffure-defrisage-professionnel-beauty-and-co-texlax", serviceId: "s-coiffure", name: "Défrisage Professionnel Beauty And Co / Texlax", priceFcfa: 49000, durationMin: 150, active: true, recipe: [r("ker-resist-bain-force-archi-250m", 40, "ml"), r("ker-res-masque-force-archi-200ml", 20, "g")] },
  { id: "coiffure-hybrid-extensions", serviceId: "s-coiffure", name: "Hybrid Extensions", priceFcfa: 99000, durationMin: 190, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")] },
  { id: "coiffure-extensions-tapes-2-paquets-de-cheveux-soit-100-g-18-pouces-coiffage", serviceId: "s-coiffure", name: "Extensions Tapes (2 Paquets de Cheveux Soit 100 G 18 Pouces + Coiffage)", priceFcfa: 249000, durationMin: 150, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")] },
  { id: "coiffure-enlever-anneaux", serviceId: "s-coiffure", name: "Enlever Anneaux", priceFcfa: 7000, durationMin: 40, active: true, recipe: [] },
  { id: "coiffure-pose-perruque", serviceId: "s-coiffure", name: "Pose Perruque", priceFcfa: 39000, durationMin: 70, active: true, recipe: [r("k-gloss-absolu-hair-mist-30ml", 8, "ml")] },
  { id: "coiffure-soin-perruque", serviceId: "s-coiffure", name: "Soin Perruque", priceFcfa: 22000, durationMin: 120, active: true, recipe: [r("k-gloss-absolu-hair-mist-30ml", 8, "ml")] },
  { id: "coiffure-supplement-lisseur", serviceId: "s-coiffure", name: "Supplément Lisseur", priceFcfa: 5000, durationMin: 20, active: true, recipe: [] },
  { id: "coiffure-soin-keratine", serviceId: "s-coiffure", name: "Soin Kératine", priceFcfa: 189000, durationMin: 210, active: true, recipe: [r("k-chrono-bain-250ml", 40, "ml"), r("k-chrono-masque-200ml", 25, "g")] },
  { id: "coiffure-supplement-coupe-pointes", serviceId: "s-coiffure", name: "Supplément Coupe Pointes", priceFcfa: 9000, durationMin: 25, active: true, recipe: [] },
  { id: "coiffure-coupe-transformation", serviceId: "s-coiffure", name: "Coupe Transformation", priceFcfa: 36000, durationMin: 40, active: true, recipe: [r("nutritive-bain-riche-250ml", 20, "ml")] },
  { id: "coiffure-tresses-cheveux", serviceId: "s-coiffure", name: "Tresses Cheveux +", priceFcfa: 19000, durationMin: 60, active: true, recipe: [] },
  { id: "coiffure-shampoing-brushing-sur-extensions-tissages-shampoing-inclus-et-obligatoire", serviceId: "s-coiffure", name: "Shampoing Brushing sur Extensions / Tissages (Shampoing Inclus et Obligatoire)", priceFcfa: 31000, durationMin: 100, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-soin-croisiere", serviceId: "s-coiffure", name: "Soin Croisière", priceFcfa: 36000, durationMin: 90, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")] },
  { id: "coiffure-extension-aux-fils-2-paquets", serviceId: "s-coiffure", name: "Extension aux Fils 2 Paquets", priceFcfa: 218000, durationMin: 240, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")] },
  { id: "coiffure-soin-botox-lissant", serviceId: "s-coiffure", name: "Soin Botox Lissant", priceFcfa: 99000, durationMin: 190, active: true, recipe: [r("k-chrono-bain-250ml", 40, "ml"), r("k-chrono-masque-200ml", 25, "g")] },
  { id: "coiffure-tissage-ouvert", serviceId: "s-coiffure", name: "Tissage Ouvert", priceFcfa: 46000, durationMin: 140, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-tissage-rajout", serviceId: "s-coiffure", name: "Tissage Rajout", priceFcfa: 39000, durationMin: 75, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-half-up-half-down", serviceId: "s-coiffure", name: "Half Up Half Down", priceFcfa: 49000, durationMin: 120, active: true, recipe: [r("nutritive-nectar-therm-150ml", 8, "ml")] },
  { id: "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire", serviceId: "s-coiffure", name: "Shampoing Brushing (Shampoing Inclus et Obligatoire)", priceFcfa: 23000, durationMin: 60, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-extensions-aux-fils-1-paquet", serviceId: "s-coiffure", name: "Extensions aux Fils 1 Paquet", priceFcfa: 129000, durationMin: 240, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")] },
  { id: "coiffure-head-spa-ultimate-deep-relaxation", serviceId: "s-coiffure", name: "Head Spa Ultimate Deep Relaxation", priceFcfa: 179000, durationMin: 240, active: true, recipe: [r("k-elixir-oil-75ml", 10, "ml"), r("k-chroma-oil-75ml", 6, "ml")] },
  { id: "coiffure-extensions-tapes-3-paquets-de-cheveux-soit-150g-18-pouces-coiffage", serviceId: "s-coiffure", name: "Extensions Tapes (3 Paquets de Cheveux Soit 150g 18 Pouces + Coiffage)", priceFcfa: 349000, durationMin: 180, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")] },
  { id: "coiffure-defrisage-professionnel-soin-fortifiant-anti-casse", serviceId: "s-coiffure", name: "Défrisage Professionnel + Soin Fortifiant Anti Casse", priceFcfa: 59000, durationMin: 150, active: true, recipe: [r("ker-resist-bain-force-archi-250m", 40, "ml"), r("ker-res-masque-force-archi-200ml", 20, "g")] },
  { id: "coiffure-soin-complet", serviceId: "s-coiffure", name: "Soin Complet", priceFcfa: 46000, durationMin: 130, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")] },
  { id: "coiffure-soin-detox", serviceId: "s-coiffure", name: "Soin Detox", priceFcfa: 46000, durationMin: 140, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")] },
  { id: "coiffure-soin-botox-reparateur-non-lissant", serviceId: "s-coiffure", name: "Soin Botox Réparateur (Non Lissant)", priceFcfa: 86000, durationMin: 150, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")] },
  { id: "coiffure-soin-lissant-tanin", serviceId: "s-coiffure", name: "Soin Lissant Tanin", priceFcfa: 189000, durationMin: 190, active: true, recipe: [r("k-chrono-bain-250ml", 40, "ml"), r("k-chrono-masque-200ml", 25, "g")] },
  { id: "coiffure-silk-press", serviceId: "s-coiffure", name: "Silk Press", priceFcfa: 79000, durationMin: 180, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-extensions-anneaux-haute-couture-2-paquets", serviceId: "s-coiffure", name: "Extensions Anneaux Haute Couture 2 Paquets", priceFcfa: 80000, durationMin: 170, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml")] },
  { id: "coiffure-pose-clips", serviceId: "s-coiffure", name: "Pose Clips", priceFcfa: 37000, durationMin: 60, active: true, recipe: [] },
  { id: "coiffure-ponytail", serviceId: "s-coiffure", name: "Ponytail", priceFcfa: 41000, durationMin: 90, active: true, recipe: [r("nutritive-nectar-therm-150ml", 8, "ml")] },
  { id: "coiffure-supplement-hand-feet-massage-massage-pieds-mains", serviceId: "s-coiffure", name: "Supplément Hand Feet Massage / Massage Pieds-Mains", priceFcfa: 19000, durationMin: 15, active: true, recipe: [] },
  { id: "coiffure-soin-croisiere-head-spa", serviceId: "s-coiffure", name: "Soin Croisière Head Spa", priceFcfa: 84000, durationMin: 120, active: true, recipe: [r("k-elixir-oil-75ml", 10, "ml"), r("k-chroma-oil-75ml", 6, "ml")] },
  { id: "coiffure-pose-u-part-wig", serviceId: "s-coiffure", name: "Pose U-Part Wig", priceFcfa: 37000, durationMin: 70, active: true, recipe: [r("k-gloss-absolu-hair-mist-30ml", 8, "ml")] },
  { id: "coiffure-tissage-versatile", serviceId: "s-coiffure", name: "Tissage Versatile", priceFcfa: 56000, durationMin: 120, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-shampoing-sechage", serviceId: "s-coiffure", name: "Shampoing Séchage", priceFcfa: 17000, durationMin: 60, active: true, recipe: [r("nutritive-bain-riche-250ml", 30, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-flip-over-sew-in-tissage-ferme", serviceId: "s-coiffure", name: "Flip Over Sew In (Tissage Fermé)", priceFcfa: 59000, durationMin: 150, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-tissage-closure-behind-the-hair-line-new", serviceId: "s-coiffure", name: "Tissage Closure Behind The Hair Line (Nouveau)", priceFcfa: 74900, durationMin: 190, active: true, recipe: [r("nutritive-scalp-serum-90ml", 6, "ml"), r("nutritive-soin-150ml", 10, "ml")] },
  { id: "coiffure-supplement-express-floral-facial-soin-du-visage-relaxant", serviceId: "s-coiffure", name: "Supplément Express Floral Facial / Soin du Visage Relaxant", priceFcfa: 34000, durationMin: 35, active: true, recipe: [] },
  { id: "coiffure-soin-vip", serviceId: "s-coiffure", name: "Soin VIP", priceFcfa: 49000, durationMin: 160, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")] },
  { id: "coiffure-soin-reparateur-olapex-new-in", serviceId: "s-coiffure", name: "Soin Réparateur Olapex (Nouveau)", priceFcfa: 69000, durationMin: 120, active: true, recipe: [r("genesis-bain-riche-250ml", 30, "ml"), r("genesis-masque-200ml", 20, "g")] },

  // Manucure & pédicure
  { id: "manucure-pedicure-gel-sur-ongle-naturel-gainage", serviceId: "s-manucure", name: "Gel sur Ongle Naturel (Gainage)", priceFcfa: 33000, durationMin: 70, active: true, recipe: [] },
  { id: "manucure-pedicure-supplement-decoration-chrome-cat-eye-baby-boomer", serviceId: "s-manucure", name: "Supplément Décoration (Chrome, Cat Eye, Baby Boomer)", priceFcfa: 7500, durationMin: 20, active: true, recipe: [] },
  { id: "manucure-pedicure-manucure-permanent", serviceId: "s-manucure", name: "Manucure + Permanent", priceFcfa: 32000, durationMin: 80, active: true, recipe: [] },
  { id: "manucure-pedicure-jelly-pedicure", serviceId: "s-manucure", name: "Jelly Pédicure", priceFcfa: 29000, durationMin: 65, active: true, recipe: [] },
  { id: "manucure-pedicure-smooth-pedicure", serviceId: "s-manucure", name: "Smooth Pédicure", priceFcfa: 36000, durationMin: 80, active: true, recipe: [] },
  { id: "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage", serviceId: "s-manucure", name: "Perfect Manucure Russe + Gel sur Ongles Naturels (Gainage)", priceFcfa: 43000, durationMin: 90, active: true, recipe: [] },
  { id: "manucure-pedicure-manucure-russe-sans-vernis-sans-gel", serviceId: "s-manucure", name: "Manucure Russe (Sans Vernis / Sans Gel)", priceFcfa: 13000, durationMin: 30, active: true, recipe: [] },
  { id: "manucure-pedicure-vernis-simple-mains-classique-et-halal", serviceId: "s-manucure", name: "Vernis Simple Mains (Classique et Halal)", priceFcfa: 9000, durationMin: 30, active: true, recipe: [] },
  { id: "manucure-pedicure-pedicure-me-spa", serviceId: "s-manucure", name: "Pédicure Me Spa", priceFcfa: 26000, durationMin: 60, active: true, recipe: [] },
  { id: "manucure-pedicure-manucure-spa-express", serviceId: "s-manucure", name: "Manucure Spa Express", priceFcfa: 16000, durationMin: 45, active: true, recipe: [] },
  { id: "manucure-pedicure-pedicure-permanent", serviceId: "s-manucure", name: "Pédicure Permanent", priceFcfa: 36000, durationMin: 80, active: true, recipe: [] },
  { id: "manucure-pedicure-perfect-pedicure-russe-permanent", serviceId: "s-manucure", name: "Perfect Pédicure Russe + Permanent", priceFcfa: 39000, durationMin: 80, active: true, recipe: [] },
  { id: "manucure-pedicure-luxury-perfect-pedicure", serviceId: "s-manucure", name: "Luxury Perfect Pédicure", priceFcfa: 39000, durationMin: 90, active: true, recipe: [] },
  { id: "manucure-pedicure-luxury-perfect-manucure-spa", serviceId: "s-manucure", name: "Luxury Perfect Manucure Spa", priceFcfa: 32000, durationMin: 70, active: true, recipe: [] },

  // Onglerie
  { id: "onglerie-vernis-permanent-pieds", serviceId: "s-onglerie", name: "Vernis Permanent Pieds", priceFcfa: 13000, durationMin: 30, active: true, recipe: [] },
  { id: "onglerie-polygel-extensions", serviceId: "s-onglerie", name: "Polygel Extensions", priceFcfa: 45000, durationMin: 120, active: true, recipe: [] },
  { id: "onglerie-reparation-ongle-1-doigt", serviceId: "s-onglerie", name: "Réparation Ongle (1 Doigt)", priceFcfa: 3500, durationMin: 20, active: true, recipe: [] },
  { id: "onglerie-depose-gel-gel-a-enlever", serviceId: "s-onglerie", name: "Dépose Gel (Gel à Enlever)", priceFcfa: 8000, durationMin: 30, active: true, recipe: [] },
  { id: "onglerie-gel-x", serviceId: "s-onglerie", name: "Gel X", priceFcfa: 36000, durationMin: 80, active: true, recipe: [] },
  { id: "onglerie-capsules-permanents-mains", serviceId: "s-onglerie", name: "Capsules Permanents Mains", priceFcfa: 21000, durationMin: 50, active: true, recipe: [] },
  { id: "onglerie-capsules-gel-pieds", serviceId: "s-onglerie", name: "Capsules Gel Pieds", priceFcfa: 23000, durationMin: 60, active: true, recipe: [] },
  { id: "onglerie-vernis-permanent-mains", serviceId: "s-onglerie", name: "Vernis Permanent Mains", priceFcfa: 17000, durationMin: 30, active: true, recipe: [] },
  { id: "onglerie-remplissage-gel", serviceId: "s-onglerie", name: "Remplissage Gel", priceFcfa: 27000, durationMin: 30, active: true, recipe: [] },
  { id: "onglerie-supplement-french", serviceId: "s-onglerie", name: "Supplément French", priceFcfa: 7500, durationMin: 30, active: true, recipe: [] },
  { id: "onglerie-supplement-decoration-chrome-cat-eye-baby-boomer", serviceId: "s-onglerie", name: "Supplément Décoration (Chrome, Cat Eye, Baby Boomer)", priceFcfa: 10000, durationMin: 30, active: true, recipe: [] },

  // Spa
  { id: "spa-soin-du-dos", serviceId: "s-spa", name: "Soin du Dos", priceFcfa: 65000, durationMin: 90, active: true, recipe: [] },
  { id: "spa-hot-stone-pierres-chaudes", serviceId: "s-spa", name: "Hot Stone - Pierres Chaudes", priceFcfa: 59000, durationMin: 60, active: true, recipe: [] },
  { id: "spa-reflexology", serviceId: "s-spa", name: "Reflexology", priceFcfa: 49000, durationMin: 60, active: true, recipe: [] },
  { id: "spa-relax-me-time", serviceId: "s-spa", name: "Relax Me Time", priceFcfa: 60000, durationMin: 80, active: true, recipe: [] },
  { id: "spa-energissant-sportif", serviceId: "s-spa", name: "Energissant Sportif", priceFcfa: 49000, durationMin: 60, active: true, recipe: [] },
  { id: "spa-black-relief-dos", serviceId: "s-spa", name: "Black Relief Dos", priceFcfa: 29000, durationMin: 30, active: true, recipe: [] },
  { id: "spa-de-stress-relaxant", serviceId: "s-spa", name: "De Stress Relaxant", priceFcfa: 45000, durationMin: 55, active: true, recipe: [] },
  { id: "spa-deep-tonique", serviceId: "s-spa", name: "Deep Tonique", priceFcfa: 49000, durationMin: 60, active: true, recipe: [] },
  { id: "spa-steam-time", serviceId: "s-spa", name: "Steam Time", priceFcfa: 40000, durationMin: 50, active: true, recipe: [] },
  { id: "spa-express-head-neck-shoulder", serviceId: "s-spa", name: "Express Head Neck Shoulder", priceFcfa: 29000, durationMin: 30, active: true, recipe: [] },
  { id: "spa-magic-vip-rituel-repair-and-reset", serviceId: "s-spa", name: "Magic VIP Rituel Repair And Reset", priceFcfa: 140000, durationMin: 190, active: true, recipe: [] },
  { id: "spa-pure-delice", serviceId: "s-spa", name: "Pure Delice", priceFcfa: 90000, durationMin: 130, active: true, recipe: [] },

  // Soin du visage
  { id: "soin-du-visage-golden-vip-facial", serviceId: "s-visage", name: "Golden VIP Facial", priceFcfa: 80000, durationMin: 90, active: true, recipe: [] },
  { id: "soin-du-visage-face-lift-and-glow-raffermissant-lift-et-glow", serviceId: "s-visage", name: "Face Lift and Glow - Raffermissant Lift et Glow", priceFcfa: 59000, durationMin: 70, active: true, recipe: [] },
  { id: "soin-du-visage-glow-me-facial", serviceId: "s-visage", name: "Glow Me Facial", priceFcfa: 49000, durationMin: 60, active: true, recipe: [] },
  { id: "soin-du-visage-acne-treatment", serviceId: "s-visage", name: "Acne Treatment", priceFcfa: 49000, durationMin: 60, active: true, recipe: [] },
  { id: "soin-du-visage-hydrate-me-and-restore", serviceId: "s-visage", name: "Hydrate Me and Restore", priceFcfa: 54000, durationMin: 60, active: true, recipe: [] },
  { id: "soin-du-visage-hydrafacial-deep-clean", serviceId: "s-visage", name: "Hydrafacial Deep Clean", priceFcfa: 55000, durationMin: 75, active: true, recipe: [] },
  { id: "soin-du-visage-detox-me-facial", serviceId: "s-visage", name: "Detox Me Facial", priceFcfa: 45000, durationMin: 60, active: true, recipe: [] },

  // Épilation
  { id: "epilation-epilation-menton", serviceId: "s-epilation", name: "Épilation Menton", priceFcfa: 6000, durationMin: 25, active: true, recipe: [] },
  { id: "epilation-pack-epilations-completes", serviceId: "s-epilation", name: "Pack Épilations Complètes", priceFcfa: 45000, durationMin: 60, active: true, recipe: [] },
  { id: "epilation-epilation-bras", serviceId: "s-epilation", name: "Épilation Bras", priceFcfa: 9000, durationMin: 25, active: true, recipe: [] },
  { id: "epilation-epilation-jambes-completes", serviceId: "s-epilation", name: "Épilation Jambes Complètes", priceFcfa: 14000, durationMin: 45, active: true, recipe: [] },
  { id: "epilation-epilation-maillot-integral", serviceId: "s-epilation", name: "Épilation Maillot Intégral", priceFcfa: 17000, durationMin: 45, active: true, recipe: [] },
  { id: "epilation-epilation-demi-jambes", serviceId: "s-epilation", name: "Épilation Demi-Jambes", priceFcfa: 11000, durationMin: 25, active: true, recipe: [] },
  { id: "epilation-epilation-duvet-ventre", serviceId: "s-epilation", name: "Épilation Duvet / Ventre", priceFcfa: 7000, durationMin: 25, active: true, recipe: [] },
  { id: "epilation-epilation-maillot-bresilien", serviceId: "s-epilation", name: "Épilation Maillot Brésilien", priceFcfa: 12000, durationMin: 25, active: true, recipe: [] },
  { id: "epilation-epilation-aisselles", serviceId: "s-epilation", name: "Épilation Aisselles", priceFcfa: 7000, durationMin: 25, active: true, recipe: [] },
  { id: "epilation-epilation-sourcils", serviceId: "s-epilation", name: "Épilation Sourcils", priceFcfa: 7000, durationMin: 15, active: true, recipe: [] },
  { id: "epilation-soin-vagifacial", serviceId: "s-epilation", name: "Soin Vagifacial", priceFcfa: 34000, durationMin: 35, active: true, recipe: [] },
  { id: "epilation-soin-vagifacial-maillot-integral", serviceId: "s-epilation", name: "Soin Vagifacial + Maillot Intégral", priceFcfa: 49000, durationMin: 60, active: true, recipe: [] },

  // Mini & Co
  { id: "mini-co-mini-hair-treat-mini-co", serviceId: "s-mini", name: "Mini Hair Treat (Mini&Co)", priceFcfa: 28000, durationMin: 90, active: true, recipe: [] },
  { id: "mini-co-mini-hair-treat-braids-mini-co", serviceId: "s-mini", name: "Mini Hair Treat + Braids (Mini&Co)", priceFcfa: 46000, durationMin: 180, active: true, recipe: [] },
  { id: "mini-co-supplement-coiffure-enfant", serviceId: "s-mini", name: "Supplément Coiffure Enfant", priceFcfa: 10000, durationMin: 50, active: true, recipe: [] },
  { id: "mini-co-definition-boucles-enfant", serviceId: "s-mini", name: "Définition Boucles Enfant", priceFcfa: 9000, durationMin: 30, active: true, recipe: [] },
  { id: "mini-co-defaire-tresses-enfant", serviceId: "s-mini", name: "Défaire Tresses Enfant", priceFcfa: 5000, durationMin: 45, active: true, recipe: [] },
  { id: "mini-co-coupe-pointes-enfants-mini-co", serviceId: "s-mini", name: "Coupe Pointes Enfants (Mini&Co)", priceFcfa: 9000, durationMin: 25, active: true, recipe: [] },
  { id: "mini-co-supplement-brushing-enfant", serviceId: "s-mini", name: "Supplément Brushing Enfant", priceFcfa: 9000, durationMin: 60, active: true, recipe: [] },
  { id: "mini-co-supplements-tresses-enfants-mini-and-co", serviceId: "s-mini", name: "Suppléments Tresses Enfants Mini&Co", priceFcfa: 19000, durationMin: 60, active: true, recipe: [] },
  { id: "mini-co-mini-jely-manucure", serviceId: "s-mini", name: "Mini Jelly Manucure", priceFcfa: 12000, durationMin: 30, active: true, recipe: [] },
  { id: "mini-co-mini-cutie-pedicure", serviceId: "s-mini", name: "Mini Cutie Pédicure", priceFcfa: 15000, durationMin: 35, active: true, recipe: [] },
];

// Données réelles de la réservation b&co (`booking-services.ts` de
// point-de-vente, 2026-09-27) : prestations réalisables à deux praticiennes en
// parallèle (`twoPractitionersEligible`, 77 sur 107) et sous-catégorie de
// chaque prestation Coiffure. Remplace la sélection éditoriale d'avant (8
// prestations « à deux », 6 lanes Coiffure regroupées à la main).
const TWO_PRACTITIONER_IDS = new Set([
  "coiffure-defrisage-professionnel-beauty-and-co-texlax",
  "coiffure-defrisage-professionnel-soin-fortifiant-anti-casse",
  "coiffure-enlever-anneaux",
  "coiffure-extension-aux-fils-2-paquets",
  "coiffure-extensions-anneaux-haute-couture-2-paquets",
  "coiffure-extensions-aux-fils-1-paquet",
  "coiffure-extensions-tapes-2-paquets-de-cheveux-soit-100-g-18-pouces-coiffage",
  "coiffure-extensions-tapes-3-paquets-de-cheveux-soit-150g-18-pouces-coiffage",
  "coiffure-flip-over-sew-in-tissage-ferme",
  "coiffure-head-spa-ultimate-deep-relaxation",
  "coiffure-hybrid-extensions",
  "coiffure-pose-clips",
  "coiffure-shampoing-brushing-sur-extensions-tissages-shampoing-inclus-et-obligatoire",
  "coiffure-silk-press",
  "coiffure-soin-botox-lissant",
  "coiffure-soin-botox-reparateur-non-lissant",
  "coiffure-soin-complet",
  "coiffure-soin-croisiere",
  "coiffure-soin-croisiere-head-spa",
  "coiffure-soin-detox",
  "coiffure-soin-keratine",
  "coiffure-soin-lissant-tanin",
  "coiffure-soin-perruque",
  "coiffure-soin-reparateur-olapex-new-in",
  "coiffure-soin-vip",
  "coiffure-supplement-hand-feet-massage-massage-pieds-mains",
  "coiffure-tissage-closure-behind-the-hair-line-new",
  "coiffure-tissage-ouvert",
  "coiffure-tissage-rajout",
  "coiffure-tissage-versatile",
  "coiffure-tresses-cheveux",
  "epilation-epilation-aisselles",
  "epilation-epilation-bras",
  "epilation-epilation-demi-jambes",
  "epilation-epilation-jambes-completes",
  "epilation-pack-epilations-completes",
  "manucure-pedicure-gel-sur-ongle-naturel-gainage",
  "manucure-pedicure-jelly-pedicure",
  "manucure-pedicure-luxury-perfect-manucure-spa",
  "manucure-pedicure-luxury-perfect-pedicure",
  "manucure-pedicure-manucure-permanent",
  "manucure-pedicure-manucure-russe-sans-vernis-sans-gel",
  "manucure-pedicure-manucure-spa-express",
  "manucure-pedicure-pedicure-me-spa",
  "manucure-pedicure-pedicure-permanent",
  "manucure-pedicure-perfect-manucure-russe-gel-sur-ongles-naturels-gainage",
  "manucure-pedicure-perfect-pedicure-russe-permanent",
  "manucure-pedicure-smooth-pedicure",
  "manucure-pedicure-supplement-decoration-chrome-cat-eye-baby-boomer",
  "manucure-pedicure-vernis-simple-mains-classique-et-halal",
  "mini-co-defaire-tresses-enfant",
  "mini-co-mini-cutie-pedicure",
  "mini-co-mini-hair-treat-braids-mini-co",
  "mini-co-mini-hair-treat-mini-co",
  "mini-co-mini-jely-manucure",
  "mini-co-supplements-tresses-enfants-mini-and-co",
  "onglerie-capsules-gel-pieds",
  "onglerie-capsules-permanents-mains",
  "onglerie-depose-gel-gel-a-enlever",
  "onglerie-gel-x",
  "onglerie-polygel-extensions",
  "onglerie-remplissage-gel",
  "onglerie-supplement-decoration-chrome-cat-eye-baby-boomer",
  "onglerie-supplement-french",
  "onglerie-vernis-permanent-mains",
  "onglerie-vernis-permanent-pieds",
  "spa-black-relief-dos",
  "spa-de-stress-relaxant",
  "spa-deep-tonique",
  "spa-energissant-sportif",
  "spa-express-head-neck-shoulder",
  "spa-hot-stone-pierres-chaudes",
  "spa-magic-vip-rituel-repair-and-reset",
  "spa-pure-delice",
  "spa-reflexology",
  "spa-relax-me-time",
  "spa-soin-du-dos",
]);

const COIFFURE_SUBCATEGORY_BY_ID: Record<string, string> = {
  "coiffure-defrisage-professionnel-beauty-and-co-texlax": "sub-coiffure-defrisage",
  "coiffure-hybrid-extensions": "sub-coiffure-luxury-extensions",
  "coiffure-extensions-tapes-2-paquets-de-cheveux-soit-100-g-18-pouces-coiffage": "sub-coiffure-luxury-extensions",
  "coiffure-enlever-anneaux": "sub-coiffure-luxury-extensions",
  "coiffure-pose-perruque": "sub-coiffure-perruques",
  "coiffure-soin-perruque": "sub-coiffure-perruques",
  "coiffure-supplement-lisseur": "sub-coiffure-brushing",
  "coiffure-soin-keratine": "sub-coiffure-lissage",
  "coiffure-supplement-coupe-pointes": "sub-coiffure-coupe",
  "coiffure-coupe-transformation": "sub-coiffure-coupe",
  "coiffure-tresses-cheveux": "sub-coiffure-tresses",
  "coiffure-shampoing-brushing-sur-extensions-tissages-shampoing-inclus-et-obligatoire": "sub-coiffure-brushing",
  "coiffure-soin-croisiere": "sub-coiffure-nos-rituels-soins",
  "coiffure-extension-aux-fils-2-paquets": "sub-coiffure-luxury-extensions",
  "coiffure-soin-botox-lissant": "sub-coiffure-lissage",
  "coiffure-tissage-ouvert": "sub-coiffure-tissage",
  "coiffure-tissage-rajout": "sub-coiffure-tissage",
  "coiffure-half-up-half-down": "sub-coiffure-coiffure",
  "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire": "sub-coiffure-brushing",
  "coiffure-extensions-aux-fils-1-paquet": "sub-coiffure-luxury-extensions",
  "coiffure-head-spa-ultimate-deep-relaxation": "sub-coiffure-head-spa",
  "coiffure-extensions-tapes-3-paquets-de-cheveux-soit-150g-18-pouces-coiffage": "sub-coiffure-luxury-extensions",
  "coiffure-defrisage-professionnel-soin-fortifiant-anti-casse": "sub-coiffure-defrisage",
  "coiffure-soin-complet": "sub-coiffure-nos-rituels-soins",
  "coiffure-soin-detox": "sub-coiffure-nos-rituels-soins",
  "coiffure-soin-botox-reparateur-non-lissant": "sub-coiffure-nos-rituels-soins",
  "coiffure-soin-lissant-tanin": "sub-coiffure-lissage",
  "coiffure-silk-press": "sub-coiffure-brushing",
  "coiffure-extensions-anneaux-haute-couture-2-paquets": "sub-coiffure-luxury-extensions",
  "coiffure-pose-clips": "sub-coiffure-luxury-extensions",
  "coiffure-ponytail": "sub-coiffure-coiffure",
  "coiffure-supplement-hand-feet-massage-massage-pieds-mains": "sub-coiffure-head-spa",
  "coiffure-soin-croisiere-head-spa": "sub-coiffure-head-spa",
  "coiffure-pose-u-part-wig": "sub-coiffure-perruques",
  "coiffure-tissage-versatile": "sub-coiffure-tissage",
  "coiffure-shampoing-sechage": "sub-coiffure-brushing",
  "coiffure-flip-over-sew-in-tissage-ferme": "sub-coiffure-tissage",
  "coiffure-tissage-closure-behind-the-hair-line-new": "sub-coiffure-tissage",
  "coiffure-supplement-express-floral-facial-soin-du-visage-relaxant": "sub-coiffure-nos-rituels-soins",
  "coiffure-soin-vip": "sub-coiffure-nos-rituels-soins",
  "coiffure-soin-reparateur-olapex-new-in": "sub-coiffure-nos-rituels-soins",
};

// Mini & Co : les deux cartes de la réservation deviennent deux sous-catégories.
const MINI_SUBCATEGORY_BY_ID: Record<string, string> = {
  "mini-co-mini-hair-treat-mini-co": "sub-mini-hair",
  "mini-co-mini-hair-treat-braids-mini-co": "sub-mini-hair",
  "mini-co-supplement-coiffure-enfant": "sub-mini-hair",
  "mini-co-definition-boucles-enfant": "sub-mini-hair",
  "mini-co-defaire-tresses-enfant": "sub-mini-hair",
  "mini-co-coupe-pointes-enfants-mini-co": "sub-mini-hair",
  "mini-co-supplement-brushing-enfant": "sub-mini-hair",
  "mini-co-supplements-tresses-enfants-mini-and-co": "sub-mini-hair",
  "mini-co-mini-jely-manucure": "sub-mini-spa",
  "mini-co-mini-cutie-pedicure": "sub-mini-spa",
};

// Exemples de démo (2026-10-01) — un seul côté suffit, `incompatiblesOf` lit
// la relation dans les deux sens.
const INCOMPATIBLE_SEEDS: Record<string, string[]> = {
  "coiffure-soin-keratine": [
    "coiffure-defrisage-professionnel-beauty-and-co-texlax",
    "coiffure-defrisage-professionnel-soin-fortifiant-anti-casse",
  ],
  "soin-du-visage-hydrafacial-deep-clean": ["epilation-epilation-menton", "epilation-epilation-sourcils"],
};

// `salonIds: []` = héritée du service parent (aucune restriction propre à la
// prestation) — le catalogue réel ne distingue pas les prestations par salon.
// Périodes d'indisponibilité de démonstration (monde ancré au 03/09/2026) :
// une en cours, une à venir.
const PAUSE_SEEDS: Record<string, PrestationPause[]> = {
  "soin-du-visage-hydrafacial-deep-clean": [
    { id: "pp-hydra", from: "2026-09-01", to: "2026-09-12", reason: "Machine Hydrafacial en révision" },
  ],
  "coiffure-silk-press": [
    { id: "pp-silk", from: "2026-10-12", to: "2026-10-18", reason: "Formation de l'équipe coiffure" },
  ],
};

export const prestationSeeds: Prestation[] = rawPrestations.map((p) => ({
  ...p,
  salonIds: [],
  twoPractitioners: TWO_PRACTITIONER_IDS.has(p.id),
  subcategoryId: COIFFURE_SUBCATEGORY_BY_ID[p.id] ?? MINI_SUBCATEGORY_BY_ID[p.id] ?? null,
  incompatibleWith: INCOMPATIBLE_SEEDS[p.id] ?? [],
  unavailablePeriods: PAUSE_SEEDS[p.id] ?? [],
}));

/* -------------------------------------------------------------------------- */
/* Incompatibilités « même visite »                                            */
/* -------------------------------------------------------------------------- */

// Ids des prestations incompatibles avec `id`, lues des deux côtés de la
// relation (tolère une liste qui ne serait renseignée que d'un côté).
export function incompatiblesOf(prestations: Prestation[], id: string): string[] {
  const own = prestations.find((p) => p.id === id)?.incompatibleWith ?? [];
  const out = new Set(own);
  for (const p of prestations) if (p.id !== id && p.incompatibleWith?.includes(id)) out.add(p.id);
  out.delete(id);
  return [...out].filter((x) => prestations.some((p) => p.id === x));
}

// Remplace les incompatibilités de `id` par `ids`, et répercute sur les
// prestations visées (ajout comme retrait) pour garder la relation symétrique.
export function setIncompatibilities(prestations: Prestation[], id: string, ids: string[]): Prestation[] {
  const next = new Set(ids.filter((x) => x !== id));
  return prestations.map((p) => {
    if (p.id === id) return { ...p, incompatibleWith: [...next] };
    const has = p.incompatibleWith?.includes(id) ?? false;
    if (next.has(p.id) && !has) return { ...p, incompatibleWith: [...(p.incompatibleWith ?? []), id] };
    if (!next.has(p.id) && has) return { ...p, incompatibleWith: p.incompatibleWith!.filter((x) => x !== id) };
    return p;
  });
}

// Première prestation déjà choisie qui empêche d'ajouter `id`, ou null.
export function conflictWith(prestations: Prestation[], id: string, selected: Iterable<string>): string | null {
  const blocked = new Set(incompatiblesOf(prestations, id));
  for (const s of selected) if (s !== id && blocked.has(s)) return s;
  return null;
}

// Questions obligatoires réelles de la réservation b&co (`requiredQuestions`
// de `booking-services.ts`, point-de-vente — 2026-09-27). Ids conservés quand
// la question existait déjà ici.
export const questionSeeds: ServiceQuestion[] = [
  { id: "q-tresses-retirer", serviceId: "s-coiffure", label: "Avez-vous des tresses à retirer ?", type: "oui-non", active: true },
  { id: "q-voile", serviceId: "s-coiffure", label: "Êtes-vous voilée ?", type: "oui-non", active: true },
  { id: "q-gel-retirer", serviceId: "s-manucure", label: "Avez-vous un vernis permanent ou un gel à retirer ?", type: "oui-non", active: true },
  { id: "q-allergie", serviceId: "s-manucure", label: "Êtes-vous allergique à certains produits ? (merci de préciser sur la note interne)", type: "oui-non", active: true },
  { id: "q-diabete", serviceId: "s-manucure", label: "Êtes-vous diabétique ?", type: "oui-non", active: true },
  { id: "q-chaleur", serviceId: "s-spa", label: "Supportez-vous la chaleur ?", type: "oui-non", active: true },
  { id: "q-asthme", serviceId: "s-spa", label: "Êtes-vous asthmatique ?", type: "oui-non", active: true },
  { id: "q-choix-huile", serviceId: "s-spa", label: "Quel choix d'huile souhaitez-vous ?", type: "texte", placeholder: "Précisez votre choix d'huile", active: true },
  { id: "q-zone-douleur", serviceId: "s-spa", label: "Où ressentez-vous la douleur ?", type: "texte", placeholder: "Précisez la ou les zones concernées", active: true },
  { id: "q-type-peau", serviceId: "s-visage", label: "Quel type de peau avez-vous ? (Sensible, Grasse ou Mixte)", type: "texte", placeholder: "Sensible, Grasse ou Mixte", active: true },
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
    .filter((s) => scope === "all" || s.salonIds.some((id) => inScope(scope, id)))
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
    : prestations.filter((p) => (p.salonIds.length ? p.salonIds.some((id) => inScope(scope, id)) : true));

export const orphanPrestations = (prestations: Prestation[]) =>
  prestations.filter((p) => p.serviceId === null);

export const orphanQuestions = (questions: ServiceQuestion[]) =>
  questions.filter((q) => q.serviceId === null);

// Lane d'un tableau Kanban catégorie : soit une vraie sous-catégorie, soit
// « Autres » (`subcategory: null`) pour les prestations qui n'en ont pas ou
// qui référencent une sous-catégorie supprimée depuis.
export type SubcategoryGroup = {
  subcategory: Subcategory | null;
  prestations: Prestation[];
};

// Regroupe les prestations d'un service par sous-catégorie, dans l'ordre des
// sous-catégories du service, suivi d'un groupe « Autres » s'il reste des
// prestations non classées. Un service sans sous-catégorie renvoie un seul
// groupe à plat (`subcategory: null`), affiché sans en-tête de lane par
// l'écran Services.
export function groupPrestationsBySubcategory(
  service: Service,
  prestations: Prestation[],
): SubcategoryGroup[] {
  const own = prestations.filter((p) => p.serviceId === service.id);
  if (service.subcategories.length === 0) {
    return own.length > 0 ? [{ subcategory: null, prestations: own }] : [];
  }
  const groups: SubcategoryGroup[] = service.subcategories.map((subcategory) => ({
    subcategory,
    prestations: own.filter((p) => p.subcategoryId === subcategory.id),
  }));
  const knownIds = new Set(service.subcategories.map((s) => s.id));
  const rest = own.filter((p) => !p.subcategoryId || !knownIds.has(p.subcategoryId));
  if (rest.length > 0) groups.push({ subcategory: null, prestations: rest });
  return groups;
}

let seq = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;
