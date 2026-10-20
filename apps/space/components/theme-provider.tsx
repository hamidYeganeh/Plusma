"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Direction } from "radix-ui";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Direction.Provider dir="rtl">
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </Direction.Provider>
  );
}
