import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Sadece src klasörünü tara (diğer her şeyi hariç tut)
  globalIgnores([
    // Proje kökündeki tüm dosyaları hariç tut
    "*.js",
    "*.mjs",
    "*.ts",
    "*.json",
    "*.md",
    // Test dosyalarını hariç tut
    "src/__tests__/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Diğer gereksiz dosyalar
    "node_modules/**",
    "public/**",
    "archive/**",
  ]),
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
