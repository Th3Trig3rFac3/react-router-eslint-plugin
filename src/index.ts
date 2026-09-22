import noActionOnlyRoutes from "./rules/no-action-only-routes.js";
import noActionFormDefaultMethod from "./rules/no-action-form-default-method.js";
import noBrowserOnlyImportsInServerExports from "./rules/no-browser-only-imports-in-server-exports.js";
import noBroadActionOrigin from "./rules/no-broad-action-origin.js";
import noConflictingRoutePaths from "./rules/no-conflicting-route-paths.js";
import noConflictingRouteExports from "./rules/no-conflicting-route-exports.js";
import noDuplicateRouteIds from "./rules/no-duplicate-route-ids.js";
import noDuplicateRouteParams from "./rules/no-duplicate-route-params.js";
import noDeprecatedReactRouterApi from "./rules/no-deprecated-react-router-api.js";
import noInvalidRouteExports from "./rules/no-invalid-route-exports.js";
import noMultipleMiddlewareNext from "./rules/no-multiple-middleware-next.js";
import noOrphanRouteModules from "./rules/no-orphan-route-modules.js";
import noResourceRouteClientNavigation from "./rules/no-resource-route-client-navigation.js";
import noRouteManifestCollision from "./rules/no-route-manifest-collision.js";
import noSensitiveErrorOutput from "./rules/no-sensitive-error-output.js";
import noServerOnlyImportsInClientExports from "./rules/no-server-only-imports-in-client-exports.js";
import requireRootErrorBoundary from "./rules/require-root-error-boundary.js";
import requireHydrateFallback from "./rules/require-hydrate-fallback.js";
import requireOutletForChildRoutes from "./rules/require-outlet-for-child-routes.js";
import requireResourceContentType from "./rules/require-resource-content-type.js";
import requireRouteErrorBoundary from "./rules/require-route-error-boundary.js";
import preferLinkForInternalNavigation from "./rules/prefer-link-for-internal-navigation.js";
import returnServerMiddlewareResponse from "./rules/return-server-middleware-response.js";
import resourceRouteReturnsResponse, {
  validResourceRouteRule,
} from "./rules/resource-route-returns-response.js";
import safeShouldRevalidate from "./rules/safe-should-revalidate.js";
import splittableRouteModule from "./rules/splittable-route-module.js";
import validPrerenderPaths from "./rules/valid-prerender-paths.js";
import validRouteModule from "./rules/valid-route-module.js";
import validRouteParams from "./rules/valid-route-params.js";
import validRouteModulePath from "./rules/valid-route-module-path.js";
import validRouteConfig from "./rules/valid-route-config.js";
import consistentRouteModuleExtension from "./rules/consistent-route-module-extension.js";
import { createConfigs } from "./configs/index.js";
import type { TSESLint } from "@typescript-eslint/utils";
import packageJson from "../package.json";

export const rules = {
  "consistent-route-module-extension": consistentRouteModuleExtension,
  "no-action-form-default-method": noActionFormDefaultMethod,
  "no-action-only-routes": noActionOnlyRoutes,
  "no-browser-only-imports-in-server-exports": noBrowserOnlyImportsInServerExports,
  "no-broad-action-origin": noBroadActionOrigin,
  "no-conflicting-route-paths": noConflictingRoutePaths,
  "no-conflicting-route-exports": noConflictingRouteExports,
  "no-duplicate-route-ids": noDuplicateRouteIds,
  "no-duplicate-route-params": noDuplicateRouteParams,
  "no-deprecated-react-router-api": noDeprecatedReactRouterApi,
  "no-invalid-route-exports": noInvalidRouteExports,
  "no-multiple-middleware-next": noMultipleMiddlewareNext,
  "no-orphan-route-modules": noOrphanRouteModules,
  "no-resource-route-client-navigation": noResourceRouteClientNavigation,
  "no-route-manifest-collision": noRouteManifestCollision,
  "no-sensitive-error-output": noSensitiveErrorOutput,
  "no-server-only-imports-in-client-exports": noServerOnlyImportsInClientExports,
  "prefer-link-for-internal-navigation": preferLinkForInternalNavigation,
  "require-hydrate-fallback": requireHydrateFallback,
  "require-outlet-for-child-routes": requireOutletForChildRoutes,
  "require-resource-content-type": requireResourceContentType,
  "require-route-error-boundary": requireRouteErrorBoundary,
  "require-root-error-boundary": requireRootErrorBoundary,
  "return-server-middleware-response": returnServerMiddlewareResponse,
  "resource-route-returns-response": resourceRouteReturnsResponse,
  "safe-should-revalidate": safeShouldRevalidate,
  "splittable-route-module": splittableRouteModule,
  "valid-prerender-paths": validPrerenderPaths,
  "valid-resource-route": validResourceRouteRule,
  "valid-route-config": validRouteConfig,
  "valid-route-module": validRouteModule,
  "valid-route-module-path": validRouteModulePath,
  "valid-route-params": validRouteParams,
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
