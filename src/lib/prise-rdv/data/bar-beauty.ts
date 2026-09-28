export type BarBeautyDrink = {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Drop the real photo at this path — placeholder until then. */
  image: string;
};

export const barBeautyDrinks: BarBeautyDrink[] = [
  {
    id: "pure-glow",
    name: "Pure Glow",
    description: "Collagène, passion, orange amer, ruby grape",
    price: 4500,
    image: "/images/rdv/drinks/pure-glow.jpg",
  },
  {
    id: "dragon-mystic",
    name: "Dragon Mystic",
    description: "Dragon fruit, timer berry, eau pétillante",
    price: 4500,
    image: "/images/rdv/drinks/dragon-mystic.jpg",
  },
  {
    id: "pause-tropical",
    name: "Pause Tropical",
    description: "Magnésium, ananas, menthe, citron",
    price: 4500,
    image: "/images/rdv/drinks/pause-tropical.jpg",
  },
  {
    id: "eclat-matcha",
    name: "L'Éclat Matcha",
    description: "Matcha fraise ou vanille au choix",
    price: 4500,
    image: "/images/rdv/drinks/eclat-matcha.jpg",
  },
  {
    id: "ice-coffee-caramel",
    name: "Ice Coffee Caramel",
    description: "Caramel, expresso, lait au choix",
    price: 4500,
    image: "/images/rdv/drinks/ice-coffee-caramel.jpg",
  },
  {
    id: "soin-glace-ice-tea",
    name: "Soin Glacé Ice Tea",
    description: "Pêche citron",
    price: 3500,
    image: "/images/rdv/drinks/soin-glace-ice-tea.jpg",
  },
  {
    id: "pretty-latte",
    name: "Pretty Latte",
    description: "Lait froid ou chaud au choix et garniture au choix (caramel, vanille, cookies, spéculos)",
    price: 3900,
    image: "/images/rdv/drinks/pretty-latte.jpg",
  },
];

export const barBeautyNote = "Lait avec ou sans lactose au choix.";
