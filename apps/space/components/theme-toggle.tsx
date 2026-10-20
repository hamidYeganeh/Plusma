"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("Common");
  return (
    <div className="theme-switch">
      <Button
        variant="outline"
        size="icon-lg"
        className="light-theme-button"
        aria-label={t("darkTheme")}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <MoonIcon />
      </Button>
      <Button
        variant="outline"
        size="icon-lg"
        className="dark-theme-button"
        aria-label={t("lightTheme")}
        onClick={() => setTheme("light")}
      >
        <SunIcon />
      </Button>
    </div>
  );
}
