import { DEFAULT_SETTINGS } from "../utils/settings.js";
import type { TSESLint } from "@typescript-eslint/utils";

const SOURCE_FILES = ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"];

export function createConfigs(plugin: TSESLint.FlatConfig.Plugin) {
  const recommended = {
    name: "react-router/recommended",
    files: SOURCE_FILES,
    plugins: { "react-router": plugin },
    settings: { reactRouter: DEFAULT_SETTINGS },
    rules: {
      "react-router/require-root-error-boundary": "error",
      "react-router/valid-route-config": "error",
      "react-router/valid-route-module-path": "error",
      "react-router/no-duplicate-route-ids": "error",
      "react-router/no-duplicate-route-params": "error",
      "react-router/no-conflicting-route-paths": "error",
      "react-router/no-action-only-routes": "warn",
    },
  } as const;

  const strict = {
    name: "react-router/strict",
    files: SOURCE_FILES,
    plugins: { "react-router": plugin },
    settings: { reactRouter: DEFAULT_SETTINGS },
    rules: {
      ...recommended.rules,
      "react-router/no-action-only-routes": "error",
      "react-router/no-invalid-route-exports": "error",
      "react-router/require-hydrate-fallback": "warn",
      "react-router/safe-should-revalidate": "warn",
    },
  } as const;

  const rsc = {
    name: "react-router/rsc",
    files: SOURCE_FILES,
    plugins: { "react-router": plugin },
    settings: { reactRouter: DEFAULT_SETTINGS },
    rules: {
      "react-router/no-conflicting-route-exports": ["error", { rsc: true }],
    },
  } as const;

  return {
    recommended,
    strict,
    rsc,
    "flat/recommended": recommended,
    "flat/strict": strict,
    "flat/rsc": rsc,
  };
}
