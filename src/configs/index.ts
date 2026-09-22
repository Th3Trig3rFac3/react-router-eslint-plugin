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
      "react-router/no-action-form-default-method": "warn",
      "react-router/no-multiple-middleware-next": "error",
      "react-router/return-server-middleware-response": "warn",
      "react-router/valid-route-params": "warn",
      "react-router/require-outlet-for-child-routes": "warn",
      "react-router/no-resource-route-client-navigation": "warn",
      "react-router/no-invalid-route-exports": "error",
      "react-router/require-hydrate-fallback": "warn",
      "react-router/safe-should-revalidate": "warn",
      "react-router/valid-route-module": "error",
      "react-router/no-orphan-route-modules": "warn",
      "react-router/valid-prerender-paths": "warn",
      "react-router/no-route-manifest-collision": "warn",
      "react-router/no-broad-action-origin": "warn",
      "react-router/require-resource-content-type": "warn",
      "react-router/no-sensitive-error-output": "warn",
      "react-router/consistent-route-module-extension": "warn",
      "react-router/no-deprecated-react-router-api": "warn",
      "react-router/no-server-only-imports-in-client-exports": "error",
      "react-router/no-browser-only-imports-in-server-exports": "error",
      "react-router/splittable-route-module": "warn",
      "react-router/require-route-error-boundary": "error",
      "react-router/prefer-link-for-internal-navigation": "warn",
    },
  } as const;

  const all = {
    name: "react-router/all",
    files: SOURCE_FILES,
    plugins: { "react-router": plugin },
    settings: { reactRouter: DEFAULT_SETTINGS },
    rules: Object.fromEntries(
      Object.keys(plugin.rules ?? {}).map((ruleName) => [
        `react-router/${ruleName}`,
        "warn",
      ]),
    ),
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
    all,
    rsc,
    "flat/recommended": recommended,
    "flat/strict": strict,
    "flat/all": all,
    "flat/rsc": rsc,
  };
}
