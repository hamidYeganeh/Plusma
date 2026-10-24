import { notFound, permanentRedirect } from "next/navigation";
import { cafes, getCafe } from "@/modules/cafe";

export function generateStaticParams() {
  return cafes.map(({ slug }) => ({ slug }));
}

export default async function ExploreAlias({
  params,
}: PageProps<"/cafe/[slug]/explore">) {
  const slug = (await params).slug;
  if (!getCafe(slug)) notFound();
  permanentRedirect(`/cafe/${slug}`);
}
