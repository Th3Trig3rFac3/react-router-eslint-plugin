import noActionOnlyRoutes from "./rules/no-action-only-routes.js";
import noConflictingRoutePaths from "./rules/no-conflicting-route-paths.js";
import noConflictingRouteExports from "./rules/no-conflicting-route-exports.js";
import noDuplicateRouteIds from "./rules/no-duplicate-route-ids.js";
import noDuplicateRouteParams from "./rules/no-duplicate-route-params.js";
import noInvalidRouteExports from "./rules/no-invalid-route-exports.js";
import requireRootErrorBoundary from "./rules/require-root-error-boundary.js";
import requireHydrateFallback from "./rules/require-hydrate-fallback.js";
import resourceRouteReturnsResponse, {
  validResourceRouteRule,
} from "./rules/resource-route-returns-response.js";
import safeShouldRevalidate from "./rules/safe-should-revalidate.js";
import validRouteModulePath from "./rules/valid-route-module-path.js";
import validRouteConfig from "./rules/valid-route-config.js";
import { createConfigs } from "./configs/index.js";
import type { TSESLint } from "@typescript-eslint/utils";
import packageJson from "../package.json";

export const rules = {
  "no-action-only-routes": noActionOnlyRoutes,
  "no-conflicting-route-paths": noConflictingRoutePaths,
  "no-conflicting-route-exports": noConflictingRouteExports,
  "no-duplicate-route-ids": noDuplicateRouteIds,
  "no-duplicate-route-params": noDuplicateRouteParams,
  "no-invalid-route-exports": noInvalidRouteExports,
  "require-hydrate-fallback": requireHydrateFallback,
  "require-root-error-boundary": requireRootErrorBoundary,
  "resource-route-returns-response": resourceRouteReturnsResponse,
  "safe-should-revalidate": safeShouldRevalidate,
  "valid-resource-route": validResourceRouteRule,
  "valid-route-config": validRouteConfig,
  "valid-route-module-path": validRouteModulePath,
};

export const meta = {
  name: "eslint-plugin-react-router",
  version: packageJson.version,
  namespace: "react-router",
};

const plugin = {
  meta,
  rules,
  configs: {} as TSESLint.FlatConfig.SharedConfigs,
};

export const configs = createConfigs(plugin);
Object.assign(plugin.configs, configs);

export { plugin };
export default plugin;
