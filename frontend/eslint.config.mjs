import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ADD THIS BLOCK ↓↓↓
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      ".eslintcache",
      "public",
    ],
  },

  // your existing Next.js defaults
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
