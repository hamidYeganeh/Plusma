import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([
  {
    files: ["src/**/*.{js,ts}"],
    languageOptions: { parser: tsParser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/**",
                "react",
                "react/**",
                "@/modules/**",
                "**/apps/**",
              ],
              message:
                "The spatial module has no application or business dependency.",
            },
          ],
        },
      ],
    },
  },
]);
