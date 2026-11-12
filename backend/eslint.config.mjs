import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// Migrado de .eslintrc.json + .eslintignore (ESLint 9, flat config). Só arquivos .ts, como o antigo `--ext .ts`.
export default defineConfig([
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2021, ...globals.jest },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  globalIgnores([
    "dist/**",
    "build/**",
    "coverage/**",
    ".nyc_output/**",
    "prisma/generated/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**",
    "**/__mocks__/**",
    "scripts/**",
    "**/*.d.ts",
  ]),
]);
