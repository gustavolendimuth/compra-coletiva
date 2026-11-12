import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Migrado de .eslintrc.json + .eslintignore (next lint saiu no Next 16).
export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      // Regras novas do eslint-plugin-react-hooks 7 (React Compiler) que o código atual ainda viola:
      // ficam como aviso até a refatoração; as regras de antes do upgrade continuam como estavam.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/immutability": "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAnyKeyword",
          message: "Use um tipo específico ou 'unknown' em vez de 'any'.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    ".nyc_output/**",
    ".vite/**",
    "next-env.d.ts",
    "public/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/__tests__/**",
    "**/__mocks__/**",
    "src/__tests__/mock-data.ts",
    "vitest.setup.ts",
    "vite.config.ts",
    "vitest.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
  ]),
]);
