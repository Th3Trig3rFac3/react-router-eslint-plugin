import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintPlugin from "eslint-plugin-eslint-plugin";

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["src/rules/**/*.{ts,tsx}"],
    plugins: { "eslint-plugin": eslintPlugin },
    rules: {
      "eslint-plugin/require-meta-docs-description": "error",
      "eslint-plugin/require-meta-schema": "error",
      "eslint-plugin/require-meta-type": "error",
    },
  },
];
