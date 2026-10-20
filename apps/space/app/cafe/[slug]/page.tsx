import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cafes, getCafe } from "@/modules/cafes/catalog";
import { CafeExplorer } from "@/modules/explore/cafe-explorer";

export function generateStaticParams() {
  return cafes.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/cafe/[slug]">): Promise<Metadata> {
  const cafe = getCafe((await params).slug);
  if (!cafe) return {};
  return { title: `${cafe.name}؛ گردش سه‌بعدی`, description: cafe.description };
}

export default async function CafePage({ params }: PageProps<"/cafe/[slug]">) {
  const cafe = getCafe((await params).slug);
  if (!cafe) notFound();
  return <CafeExplorer cafe={cafe} />;
}
