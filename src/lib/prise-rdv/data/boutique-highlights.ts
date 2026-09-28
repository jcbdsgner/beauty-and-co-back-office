export type BoutiqueHighlightSize = {
  label: string;
  price: number;
  originalPrice?: number;
};

export type BoutiqueHighlight = {
  id: string;
  name: string;
  image: string;
  inStock: boolean;
  sizes: BoutiqueHighlightSize[];
};

export const boutiqueHighlights: BoutiqueHighlight[] = [
  {
    id: "becky-wave",
    name: "Becky Wave Raw Hair",
    image: "/images/rdv/boutique/becky-wave.jpg",
    inStock: true,
    sizes: [
      { label: "14\"", price: 75000 },
      { label: "18\"", price: 85000 },
      { label: "20\"", price: 95000 },
      { label: "22\"", price: 105000 },
    ],
  },
  {
    id: "salma-straight",
    name: "Salma Straight Raw Hair",
    image: "/images/rdv/boutique/salma-straight.jpg",
    inStock: false,
    sizes: [
      { label: "18\"", price: 64000, originalPrice: 70000 },
      { label: "20\"", price: 70000, originalPrice: 76000 },
      { label: "22\"", price: 78000, originalPrice: 85000 },
    ],
  },
  {
    id: "venus-curly",
    name: "Venus Curly",
    image: "/images/rdv/boutique/venus-curly.jpg",
    inStock: true,
    sizes: [
      { label: "14\"", price: 52000 },
      { label: "18\"", price: 61000 },
      { label: "20\"", price: 68000 },
    ],
  },
];
