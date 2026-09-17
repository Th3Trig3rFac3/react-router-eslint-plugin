import noActionOnlyRoutes from "./rules/no-action-only-routes.js";
import noInvalidRouteExports from "./rules/no-invalid-route-exports.js";
import requireRootErrorBoundary from "./rules/require-root-error-boundary.js";
import resourceRouteReturnsResponse, {
  validResourceRouteRule,
} from "./rules/resource-route-returns-response.js";
import validRouteModulePath from "./rules/valid-route-module-path.js";
import { createConfigs } from "./configs/index.js";
import type { TSESLint } from "@typescript-eslint/utils";

export const rules = {
  "no-action-only-routes": noActionOnlyRoutes,
  "no-invalid-route-exports": noInvalidRouteExports,
  "require-root-error-boundary": requireRootErrorBoundary,
  "resource-route-returns-response": resourceRouteReturnsResponse,
  "valid-resource-route": validResourceRouteRule,
  "valid-route-module-path": validRouteModulePath,
};

export const meta = {
  name: "eslint-plugin-react-router",
  version: "0.1.0",
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
