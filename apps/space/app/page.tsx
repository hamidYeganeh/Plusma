import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpLeftIcon, LeafIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cafes } from "@/modules/cafe";
import { LandingHeroSection } from "@/modules/landing";

export default function HomePage() {
  const t = useTranslations("Home"),
    common = useTranslations("Common");
  return (
    <main>
      <LandingHeroSection />
      <div className="directory-page" id="cafes">
        <header className="directory-header">
          <Link href="/" className="wordmark">
            <LeafIcon aria-hidden="true" />
            {common("brand")}
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">{common("demo")}</Badge>
            <ThemeToggle />
          </div>
        </header>
        <section className="directory-intro">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2 className="directory-title">{t("title")}</h2>
          <p>{t("description")}</p>
        </section>
        <section
          className="cafe-collection"
          aria-labelledby="collection-heading"
        >
          <h2 id="collection-heading">{t("collection")}</h2>
          <div className="cafe-grid">
            {cafes.map((cafe) => (
              <article key={cafe.slug} className="cafe-card">
                <Link
                  href={`/cafe/${cafe.slug}`}
                  className="cafe-preview"
                  aria-label={`${t("explore")} ${cafe.name}`}
                >
                  <Image
                    src={cafe.preview}
                    alt={cafe.name}
                    fill
                    priority
                    sizes="(max-width: 810px) 100vw, 60vw"
                  />

                  <Badge variant="secondary">{t("tag")}</Badge>
                </Link>
                <div className="cafe-card-copy">
                  <div>
                    <h3>{cafe.name}</h3>
                    <p>{cafe.description}</p>
                  </div>
                  <Button asChild variant="tactile" size="lg">
                    <Link href={`/cafe/${cafe.slug}`}>
                      {t("explore")}
                      <ArrowUpLeftIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <footer className="directory-footer">
          <span>{t("footer")}</span>
          <span dir="ltr">A new perspective.</span>
        </footer>
      </div>
    </main>
  );
}
