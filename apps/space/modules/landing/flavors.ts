// Original photography and sample USD prices: https://kuro-coffee-template.modulify.website/
// All reader-facing flavor content lives in messages/fa.json.
export type LandingFlavor = {
  id: string;
  price: number;
  caffeine: number;
  scene: string;
  tile: { sheet: string; col: number; row: number };
};

export const priceCurrency = "USD";
export const coffeeFlavors: LandingFlavor[] = [
  {
    id: "original",
    price: 5.4,
    caffeine: 150,
    scene: "/landing/kuro/scenes/original.webp",
    tile: {
      sheet: "/landing/kuro/ingredients.webp",
      col: 0,
      row: 0,
    },
  },
  {
    id: "caramel",
    price: 5.9,
    caffeine: 150,
    scene: "/landing/kuro/scenes/caramel-latte.webp",
    tile: {
      sheet: "/landing/kuro/ingredients.webp",
      col: 1,
      row: 0,
    },
  },
  {
    id: "vanilla",
    price: 5.7,
    caffeine: 150,
    scene: "/landing/kuro/scenes/vanilla-latte.webp",
    tile: {
      sheet: "/landing/kuro/ingredients.webp",
      col: 2,
      row: 0,
    },
  },
  {
    id: "hazelnut",
    price: 5.9,
    caffeine: 150,
    scene: "/landing/kuro/scenes/hazelnut-latte.webp",
    tile: {
      sheet: "/landing/kuro/ingredients.webp",
      col: 0,
      row: 1,
    },
  },
  {
    id: "mocha",
    price: 6.2,
    caffeine: 165,
    scene: "/landing/kuro/scenes/mocha-latte.webp",
    tile: {
      sheet: "/landing/kuro/ingredients.webp",
      col: 1,
      row: 1,
    },
  },
  {
    id: "cinnamon",
    price: 5.9,
    caffeine: 150,
    scene: "/landing/kuro/scenes/cinnamon-latte.webp",
    tile: {
      sheet: "/landing/kuro/ingredients.webp",
      col: 2,
      row: 1,
    },
  },
];
export const matchaFlavors: LandingFlavor[] = [
  {
    id: "matcha",
    price: 5.9,
    caffeine: 70,
    scene: "/landing/kuro/matcha/scenes/original.webp",
    tile: {
      sheet: "/landing/kuro/matcha/ingredients-v2.webp",
      col: 0,
      row: 0,
    },
  },
  {
    id: "blueberry",
    price: 6.4,
    caffeine: 70,
    scene: "/landing/kuro/matcha/scenes/blueberry.webp",
    tile: {
      sheet: "/landing/kuro/matcha/ingredients-v2.webp",
      col: 2,
      row: 0,
    },
  },
  {
    id: "cherry",
    price: 6.6,
    caffeine: 70,
    scene: "/landing/kuro/matcha/scenes/cherry.webp",
    tile: {
      sheet: "/landing/kuro/matcha/ingredients-v2.webp",
      col: 1,
      row: 1,
    },
  },
  {
    id: "coconut",
    price: 6.2,
    caffeine: 70,
    scene: "/landing/kuro/matcha/scenes/coconut.webp",
    tile: {
      sheet: "/landing/kuro/matcha/ingredients-v2.webp",
      col: 2,
      row: 1,
    },
  },
  {
    id: "blackberry",
    price: 6.4,
    caffeine: 70,
    scene: "/landing/kuro/matcha/scenes/blackberry.webp",
    tile: {
      sheet: "/landing/kuro/matcha/ingredients-v2.webp",
      col: 0,
      row: 1,
    },
  },
  {
    id: "strawberry",
    price: 6.4,
    caffeine: 70,
    scene: "/landing/kuro/matcha/scenes/strawberry.webp",
    tile: {
      sheet: "/landing/kuro/matcha/ingredients-v2.webp",
      col: 1,
      row: 0,
    },
  },
];
export const allFlavors = [...coffeeFlavors, ...matchaFlavors];
