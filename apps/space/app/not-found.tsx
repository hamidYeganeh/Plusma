import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className="not-found-page">
      <span className="eyebrow">۴۰۴</span>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <Button variant="tactile" asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </main>
  );
}
