import { useTranslations } from "next-intl";
import { Skeleton } from "@repo/ui/components/skeleton";

export default function CafeLoading() {
  const t = useTranslations("Explore");
  return (
    <main className="not-found-page" role="status" aria-label={t("loading")}>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-60 w-72 rounded-4xl" />
    </main>
  );
}
