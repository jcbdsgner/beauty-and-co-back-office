import { bookingServices } from "@/lib/prise-rdv/data/booking-services";
import { toSentenceCase } from "@/lib/prise-rdv/utils";

export type Pack = {
  id: string;
  label: string;
  image: string;
  /** Vidéo de fond en boucle pour la card, en remplacement de `image` — `image` reste le poster/fallback. */
  video?: string;
  description: string;
  /** Ids de BookingSubService, résolus dans bookingServices à l'affichage — jamais dupliqués ici. */
  prestationIds: string[];
};

export const packs: Pack[] = [
  {
    id: "eclat-express",
    label: "Pack Éclat Express",
    image: "/images/accueil/abonnement-soin.jpg",
    description: "Brushing, vernis et sourcils nets pour un look soigné en un seul passage.",
    prestationIds: [
      "coiffure-shampoing-brushing-shampoing-inclus-et-obligatoire",
      "manucure-pedicure-vernis-simple-mains-classique-et-halal",
      "epilation-epilation-sourcils",
    ],
  },
  {
    id: "cocooning-duo",
    label: "Pack Cocooning Duo",
    image: "/images/accueil/forfait-detente-spa-poster.jpg",
    video: "/videos/forfait-detente-spa.mp4",
    description: "Soin du dos et réflexologie : une vraie parenthèse détente.",
    prestationIds: ["spa-soin-du-dos", "spa-reflexology"],
  },
  {
    id: "beaute-des-mains",
    label: "Pack Beauté des Mains",
    image: "/images/accueil/gallery-4.png",
    description: "Manucure, pédicure et remplissage gel pour des mains et pieds impeccables.",
    prestationIds: [
      "manucure-pedicure-manucure-spa-express",
      "manucure-pedicure-pedicure-me-spa",
      "onglerie-remplissage-gel",
    ],
  },
  {
    id: "glow-total",
    label: "Pack Glow Total",
    image: "/images/accueil/gallery-3.png",
    description: "Facial éclat, épilation complète et manucure russe pour un glow total.",
    prestationIds: [
      "soin-du-visage-glow-me-facial",
      "epilation-pack-epilations-completes",
      "manucure-pedicure-manucure-russe-sans-vernis-sans-gel",
    ],
  },
];

export type PackPrestation = {
  id: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
  price: number;
  duration: string;
  durationMinutes: number;
};

/** Résout les prestationIds d'un Pack dans le catalogue, dans l'ordre du catalogue. */
export function getPackPrestations(pack: Pack): PackPrestation[] {
  const prestations: PackPrestation[] = [];

  for (const category of bookingServices) {
    for (const sub of category.subServices) {
      if (!pack.prestationIds.includes(sub.id)) continue;
      prestations.push({
        id: sub.id,
        label: toSentenceCase(sub.label),
        categoryId: category.id,
        categoryLabel: category.label,
        price: sub.price,
        duration: sub.duration,
        durationMinutes: sub.durationMinutes,
      });
    }
  }

  return prestations;
}

/** Somme des prix des prestations incluses, prises séparément. */
export function getPackIndividualTotal(pack: Pack): number {
  return getPackPrestations(pack).reduce((sum, prestation) => sum + prestation.price, 0);
}

/** Prix packagé du Pack : 20% moins cher que la somme des prestations individuelles, arrondi. */
export function getPackPrice(pack: Pack): number {
  return Math.round((getPackIndividualTotal(pack) * 0.8) / 500) * 500;
}
