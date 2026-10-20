import { BARG_TABLES } from "./data/barg-tables.js";

export type CafeTable = { id: number; capacity: number; zone: string };

/** Public demo content only. Adding a venue does not require a new route. */
export type Cafe = {
  slug: string;
  name: string;
  scene: "barg-garden";
  description: string;
  preview: string;
  tables: readonly CafeTable[];
};

export const cafes = [
  {
    slug: "barg",
    name: "کافه برگ",
    scene: "barg-garden",
    tables: BARG_TABLES.map(({ id, capacity, zone }) => ({
      id,
      capacity,
      zone,
    })),
    description:
      "میان میزها قدم بزن، کنار حوض مکث کن و فضا را از زاویهٔ خودت ببین.",
    preview: "/cafes/barg/preview.png",
  },
] as const satisfies readonly Cafe[];

export function getCafe(slug: string): Cafe | undefined {
  return cafes.find((cafe) => cafe.slug === slug);
}
