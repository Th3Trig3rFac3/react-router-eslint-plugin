# Documentation

Reviewed against the source and package metadata on 2026-10-26. This plugin is
in prerelease development; the package name and first publication remain
maintainer decisions.

- [Installation and quick start](../README.md#installation)
- [Rule catalog](../README.md#rules) and [individual rule pages](./rules/)
- [Compatibility and CI boundaries](./compatibility.md)
- [Measured test coverage](./test-coverage.md)
- [Implementation plan and remaining release work](./PLAN.md)
- [Implemented ideas and deferred proposals](./RULE_IDEAS.md)
- [MVP design decisions](./rfcs/README.md)
- [Historical application validation](./validation/mvp-semantics.md)
- [Contributing and local checks](../CONTRIBUTING.md)

## Presets

All presets register the `react-router` plugin and target
`**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`. They do not configure a parser. Follow the
[TypeScript and TSX setup](../README.md#typescript-and-tsx-setup) when needed.
The `flat/` names are aliases of the same preset objects.

| Preset        | Behavior                                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recommended` | Six errors: root boundary, route-config shape, module-path resolution, duplicate IDs, duplicate parameters, and conflicting paths. `no-action-only-routes` is a warning.                                      |
| `strict`      | Includes `recommended`, raises `no-action-only-routes` to error, and adds the strict rules listed in the catalog. Context-dependent checks still need configuration.                                          |
| `all`         | Enables all 33 exported rule names at warning severity, including both names of the resource-response rule. Disable `valid-resource-route` to avoid duplicate reports. The RSC check still needs `rsc: true`. |
| `rsc`         | Enables only `no-conflicting-route-exports` at error severity with `rsc: true`; it does not extend another preset.                                                                                            |

`recommended` and `strict` omit `resource-route-returns-response` and its
`valid-resource-route` alias. Enable the canonical name in a file-scoped flat
config override for external resource endpoints. The rule itself has no
mandatory scope option: without `files`, it checks every recognized route
module without a default component in its ESLint scope.

In `strict`, the following options activate otherwise inactive policies:

| Rule                                  | Required context                                                      |
| ------------------------------------- | --------------------------------------------------------------------- |
| `consistent-route-module-extension`   | Set `mode` to `always` or `never`.                                    |
| `valid-route-params`                  | Set `routePath` or `settings.reactRouter.routePaths`.                 |
| `no-resource-route-client-navigation` | Set `resourceRoutes` or `settings.reactRouter.resourceRoutePaths`.    |
| `no-route-manifest-collision`         | Supply application/resource paths through options or shared settings. |
| `require-resource-content-type`       | Set the rule's `files` option.                                        |
| `require-route-error-boundary`        | Set the rule's `files` option.                                        |

`valid-prerender-paths` rejects unresolved parameters and splats without route
settings; matching concrete paths to routes additionally needs `routePaths`.
`no-sensitive-error-output` checks the root by default and uses `files` to
replace that scope. `no-broad-action-origin` checks literal wildcard origins
without additional options. These checks are already active in `strict` when
their source configuration is present.

## Shared settings

Use `settings.reactRouter` in flat config. Paths and file patterns are relative
to ESLint's working directory, not to the location of `eslint.config.js`.
String-or-array settings accept either one string or an array of strings.

| Setting              | Type            | Default                                                          | Purpose                                                              |
| -------------------- | --------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `appDirectory`       | string          | `app`                                                            | Base directory for route-module paths.                               |
| `rootRoute`          | string or array | `["app/root.*"]`                                                 | Root route candidates.                                               |
| `routeConfig`        | string or array | `["app/routes.ts", "app/routes.js"]`                             | Route-config entry files.                                            |
| `frameworkConfig`    | string or array | `["react-router.config.*", "react-router.config.*.*"]`           | Framework-config candidates.                                         |
| `routeModuleFiles`   | string or array | `["app/root.*", "app/routes/**/*"]`                              | Route-module recognition and orphan-detection scope.                 |
| `routePaths`         | string or array | `[]`                                                             | Explicit URL patterns for parameter, prerender, and manifest checks. |
| `resourceRoutePaths` | string or array | `[]`                                                             | Explicit resource URL patterns for navigation and manifest checks.   |
| `extensions`         | array           | `[".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"]` | Extensionless module and fragment resolution.                        |

Changing `appDirectory` does not rewrite the other default patterns. For a
custom layout, also set `rootRoute`, `routeConfig`, and `routeModuleFiles`, as
shown in the [monorepo example](../README.md#typescript-and-tsx-setup).

File patterns support `*`, `**`, `?`, and brace alternatives such as
`*.{ts,tsx}`. They do not implement the complete ESLint glob language, including
negation and extglobs. URL-pattern options have rule-specific matching rules;
they are not filesystem globs. In particular, manifest collisions use exact
string comparisons.

## Static-analysis limits

Route-config rules follow relative imports within the project boundary, with
cycle/depth protection and a cache based on file metadata. They never import or
execute application code. Unresolved imports and custom route builders remain
unknown; orphan detection skips incomplete graphs. Individual checks can still
report known static entries in a partly dynamic graph.

Most module rules recognize configured roots, `routeModuleFiles`, or an import
from a generated `+types` directory. Matching support files named `.server`,
`.client`, or beneath `+`-prefixed segments are excluded by the normal route
glob classifier. Referencing a module in `routes.ts` does not automatically
make every module-level rule recognize that file; configure custom locations.

The rules do not use TypeScript type information. Import-boundary checks follow
same-file bindings, and several policy checks use simple name or source-text
matching. They cannot prove runtime safety, complete control flow, or bundler
behavior. Every rule is diagnostic-only: no rule currently declares an autofix
or editor suggestion. Use documented options or targeted ESLint disable
comments for intentional patterns, and keep framework build checks enabled.
