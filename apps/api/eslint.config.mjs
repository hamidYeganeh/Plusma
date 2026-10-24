import { config } from "@repo/eslint-config/base";
import parser from "@typescript-eslint/parser";
import typescript from "@typescript-eslint/eslint-plugin";
import globals from "globals";
export default [
  ...config,
  {
    files: ["**/*.{ts,mjs}"],
    languageOptions: { parser, globals: globals.node },
    plugins: { "@typescript-eslint": typescript },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "turbo/no-undeclared-env-vars": [
        "warn",
        { allowList: ["STAFF_PASSWORD"] },
      ],
    },
  },
  { ignores: ["dist/**"] },
];
