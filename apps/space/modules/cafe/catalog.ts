import { BARG_TABLES } from "./data/barg-tables.js";
import { COMMA_TABLES } from "./data/comma-beheshti-tables.js";

/** Scene identity stays separate from the cafe's numeric table identity. */
export function tableTargetId(id: number): string {
  return `table-${id}`;
}

export type CafeTable = {
  id: number;
  targetId: string;
  capacity: number;
  zone: string;
};

/** Public demo content only. Adding a venue does not require a new route. */
export type Cafe = {
  slug: string;
  name: string;
  scene: "barg-garden" | "comma-beheshti";
  description: string;
  preview: string;
  tables: readonly CafeTable[];
  waypoints: readonly string[];
  reconstruction?: { note: string; source: string };
};

export const cafes = [
  {
    slug: "barg",
    name: "کافه برگ",
    scene: "barg-garden",
    waypoints: ["entrance", "pond", "left", "lounge"],
    tables: BARG_TABLES.map(({ id, capacity, zone }) => ({
      id,
      targetId: tableTargetId(id),
      capacity,
      zone,
    })),
    description:
      "میان میزها قدم بزن، کنار حوض مکث کن و فضا را از زاویهٔ خودت ببین.",
    preview: "/cafes/barg/preview.png",
  },
  {
    slug: "comma-beheshti",
    name: "کاما · بهشتی",
    scene: "comma-beheshti",
    waypoints: ["entrance", "courtyard", "bar", "hall"],
    tables: COMMA_TABLES.map(({ id, capacity, zone }) => ({
      id,
      targetId: tableTargetId(id),
      capacity,
      zone,
    })),
    description:
      "از حیاط سنگ‌ریزه‌ای و گلخانهٔ شیشه‌ای تا سالن شطرنجی و بار بتنی؛ بازسازی تقریبی از عکس‌های رسمی کاما.",
    preview: "/cafes/comma-beheshti/preview.png",
    reconstruction: {
      note: "بازسازی از عکس‌های رسمی؛ نسبت ابعاد، اتصال بخش‌ها و چیدمان میزها تخمینی است. نیم‌طبقه در نمای کلی دیده می‌شود؛ گردش پیاده محدود به هم‌کف و حیاط است.",
      source: "https://commaconcept.ir/about/",
    },
  },
] as const satisfies readonly Cafe[];

export function getCafe(slug: string): Cafe | undefined {
  return cafes.find((cafe) => cafe.slug === slug);
}
