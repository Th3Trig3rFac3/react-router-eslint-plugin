# ESLint Plugin for React Router

An ESLint plugin for catching common mistakes in React Router framework-mode
route modules and route configuration files.

The goal is to make frequent routing errors easy to understand for newer React
Router users while also offering stricter, opt-in checks for large applications.
Rules are conservative, well documented, and safe to run: the plugin analyzes
source code and file paths without executing an application's route
configuration.

## Installation

Install the plugin alongside ESLint:

```sh
npm install --save-dev eslint @th3trig3rfac3/eslint-plugin-react-router
pnpm add --save-dev eslint @th3trig3rfac3/eslint-plugin-react-router
yarn add --dev eslint @th3trig3rfac3/eslint-plugin-react-router
bun add --dev eslint @th3trig3rfac3/eslint-plugin-react-router
```

## Configurations

All presets register the plugin under the `react-router` namespace, target
`["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"]`, and populate default
[`settings.reactRouter`](#shared-settings) values. They do not configure a
parser; follow [TypeScript and TSX setup](#typescript-and-tsx-setup) when linting
TypeScript or TSX files.

| Preset          | Flat alias         | Config name                | Behavior                                                                                                                                                                                                                                                     |
| --------------- | ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **recommended** | `flat/recommended` | `react-router/recommended` | Low-noise baseline enabling 7 rules: 6 errors (`require-root-error-boundary`, `valid-route-config`, `valid-route-module-path`, `no-duplicate-route-ids`, `no-duplicate-route-params`, `no-conflicting-route-paths`) and 1 warning (`no-action-only-routes`). |
| **strict**      | `flat/strict`      | `react-router/strict`      | Extends `recommended`, promotes `no-action-only-routes` to `error`, and enables 23 additional opinionated rules (30 rules total: 13 errors, 17 warnings). Six rules require options or shared settings to activate.                                          |
| **all**         | `flat/all`         | `react-router/all`         | Enables all 32 exported rules at `warn` severity with no duplicates. Intended for exploration rather than CI without review. `no-conflicting-route-exports` still requires `rsc: true`, and option-gated `strict` rules still require configuration.         |
| **rsc**         | `flat/rsc`         | `react-router/rsc`         | Standalone opt-in preset enabling only `no-conflicting-route-exports` at `error` severity with `{ rsc: true }`. Combine it with `recommended` or `strict` when using React Server Components.                                                                |

The flat-config API is:

```js
import reactRouter from "@th3trig3rfac3/eslint-plugin-react-router";

export default [reactRouter.configs.recommended];
```

The package also exposes `configs["flat/recommended"]`,
`configs["flat/strict"]`, `configs["flat/all"]`, and `configs["flat/rsc"]`
aliases referencing the same flat config objects.

To enable React Server Components export checks alongside `recommended` or
`strict`:

```js
import reactRouter from "@th3trig3rfac3/eslint-plugin-react-router";

export default [reactRouter.configs.recommended, reactRouter.configs.rsc];
```

## TypeScript and TSX setup

Flat config needs a parser that accepts TypeScript syntax. The plugin's rules
also inspect JSX in TSX route modules, so enable JSX in the parser options:

```js
import tsParser from "@typescript-eslint/parser";
import reactRouter from "@th3trig3rfac3/eslint-plugin-react-router";

export default [
  {
    ...reactRouter.configs.recommended,
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];
```

Install `@typescript-eslint/parser` alongside ESLint and the plugin when using
this setup. See the [parser configuration guide](https://eslint.org/docs/latest/use/configure/parser)
for parser options and other supported parsers.

For a reviewed, higher-signal policy bundle:

```js
import reactRouter from "@th3trig3rfac3/eslint-plugin-react-router";

export default [reactRouter.configs.strict];
```

To customize a monorepo or non-standard app directory:

```js
import reactRouter from "@th3trig3rfac3/eslint-plugin-react-router";

export default [
  {
    ...reactRouter.configs.recommended,
    settings: {
      reactRouter: {
        appDirectory: "packages/web/app",
        rootRoute: "packages/web/app/root.tsx",
        routeConfig: "packages/web/app/routes.ts",
        routeModuleFiles: ["packages/web/app/root.tsx", "packages/web/app/routes/**/*"],
        routePaths: ["/teams/:teamId"],
        resourceRoutePaths: ["/download/*"],
      },
    },
  },
];
```

## Rules

| Rule                                        | Purpose                                                                                                                                   | Config                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `consistent-route-module-extension`         | Enforce a configured extension policy for static route-module paths.                                                                      | Strict, opt-in         |
| `no-action-form-default-method`             | Warn when a known action form omits `method` and therefore defaults to a browser GET.                                                     | Strict                 |
| `no-action-only-routes`                     | Warn when a route exports an action but cannot handle a refreshed `GET` request. Intentional action-only resource routes can be excluded. | Recommended            |
| `no-browser-only-imports-in-server-exports` | Disallow explicitly client-only imports used by server route exports.                                                                     | Strict                 |
| `no-broad-action-origin`                    | Disallow universal or wildcard `allowedActionOrigins` entries.                                                                            | Strict, opt-in         |
| `no-conflicting-route-exports`              | In the opt-in RSC preset, find mutually exclusive client/server route exports.                                                            | RSC opt-in             |
| `no-conflicting-route-paths`                | Find exact duplicate sibling paths, including paths introduced through `prefix()`.                                                        | Recommended            |
| `no-deprecated-react-router-api`            | Report APIs in the maintained React Router deprecation table with migration guidance.                                                     | Strict                 |
| `no-duplicate-route-ids`                    | Find repeated explicit route IDs in a static route configuration.                                                                         | Recommended            |
| `no-duplicate-route-params`                 | Find repeated parameter names in one effective route pattern.                                                                             | Recommended            |
| `no-multiple-middleware-next`               | Disallow two unconditional `next()` calls in one middleware invocation.                                                                   | Strict                 |
| `no-orphan-route-modules`                   | Find configured route-module files that are not referenced by the static route graph.                                                     | Strict                 |
| `no-resource-route-client-navigation`       | Require document navigation for statically scoped resource-route targets.                                                                 | Strict, opt-in         |
| `no-route-manifest-collision`               | Disallow a lazy route manifest path that collides with a configured route.                                                                | Strict, opt-in         |
| `no-sensitive-error-output`                 | Disallow raw error stacks or unknown errors rendered by route error boundaries.                                                           | Strict, opt-in         |
| `no-server-only-imports-in-client-exports`  | Disallow explicit server-only or Node imports reached by client route exports.                                                            | Strict                 |
| `prefer-link-for-internal-navigation`       | Require `Link` instead of plain anchors for internal application navigation.                                                              | Strict                 |
| `require-hydrate-fallback`                  | Warn when `clientLoader.hydrate = true` has no `HydrateFallback` export.                                                                  | Strict                 |
| `require-outlet-for-child-routes`           | Warn when a configured parent with children has no statically visible outlet.                                                             | Strict                 |
| `require-resource-content-type`             | Require `Content-Type` for explicitly scoped resource Responses with non-empty bodies.                                                    | Strict, opt-in         |
| `require-route-error-boundary`              | Require an error boundary at explicitly configured application boundaries.                                                                | Strict, opt-in         |
| `require-root-error-boundary`               | Require the root route to export an `ErrorBoundary`.                                                                                      | Recommended            |
| `return-server-middleware-response`         | Warn when server middleware discards the response returned by `next()`.                                                                   | Strict                 |
| `safe-should-revalidate`                    | Warn about trivially unconditional `shouldRevalidate` implementations that always return `false`.                                         | Strict                 |
| `valid-route-config`                        | Validate statically understandable route helper calls and `RouteConfigEntry` object literals.                                             | Recommended            |
| `splittable-route-module`                   | Warn about top-level mutable state that can prevent client route-module splitting.                                                        | Strict                 |
| `valid-prerender-paths`                     | Validate static prerender paths and reject unresolved route parameters.                                                                   | Strict, opt-in         |
| `valid-route-module`                        | Check that resolved route modules expose a meaningful route export.                                                                       | Strict                 |
| `valid-route-module-path`                   | Check that static module paths referenced by `routes.ts` resolve to files.                                                                | Recommended            |
| `valid-route-params`                        | Check direct loader/action parameter reads against a configured route path.                                                               | Strict, opt-in         |
| `no-invalid-route-exports`                  | Find misspelled or unsupported route-module exports.                                                                                      | Strict                 |
| `resource-route-returns-response`           | Require externally consumed resource routes to return a `Response`, with explicit file scoping.                                           | All only, opt-in scope |

`resource-route-returns-response` is intentionally excluded from `recommended`
and `strict`. React Router supports resource routes consumed through fetchers or
forms, where returning `data()` is valid. Enable this rule in a file-scoped
override for external HTTP resource endpoints, or pass `allowData: true`; see
[Rules requiring options or scoping](#rules-requiring-options-or-scoping).

## Rules requiring options or scoping

### Strict rules requiring options to activate

These six rules are enabled in `strict`, but remain inactive until you supply
their required rule options or [`settings.reactRouter`](#shared-settings):

| Rule                                    | Activation requirement                                                       | Options and behavior                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **consistent-route-module-extension**   | `mode: "always" \| "never"`                                                  | Optional `extension` (pattern `^\.[A-Za-z0-9]+$`, e.g. `".tsx"`). Without `extension`, `"always"` accepts any extension in `settings.reactRouter.extensions`. Inspects the linted route-config file only.                                                                                                            |
| **valid-route-params**                  | `routePath` or `settings.reactRouter.routePaths`                             | `routePath` (`string \| string[]`) and optional `parentPaths` (`string[]`). Parameter names from all supplied paths are combined; use a file-scoped override per route. Checks direct reads and destructuring in `loader`, `action`, `clientLoader`, and `clientAction`.                                             |
| **no-resource-route-client-navigation** | `resourceRoutes` or `settings.reactRouter.resourceRoutePaths`                | Optional `allow` (`string[]`) for targets intentionally fetched as route data. Flags literal `<Link>`, `<NavLink>`, and `navigate()` targets matching resource patterns unless `<Link reloadDocument>` is set.                                                                                                       |
| **no-route-manifest-collision**         | `routePaths` / `resourcePaths` or shared `routePaths` / `resourceRoutePaths` | Checks literal `routeDiscovery.manifestPath` in `react-router.config.*` when `mode` is `"lazy"` or omitted via exact string matching. Optional `allow` (`string[]`) exempts reviewed paths.                                                                                                                          |
| **require-resource-content-type**       | Rule `files` option (`string[]`, min 1 item)                                 | A flat-config `files` selector alone does not activate it. Checks `handlers` (default `["loader", "action"]`) for `new Response()` with a statically known non-empty body and requires a case-insensitive `Content-Type` header in an object literal or `new Headers({ ... })`. `allowFiles` exempts matching files. |
| **require-route-error-boundary**        | Rule `files` option (`string[]`, min 1 item)                                 | A flat-config `files` selector alone does not activate it. Requires a named `ErrorBoundary` export (`export *` satisfies the check). `allowFiles` exempts matching files.                                                                                                                                            |

### Active strict rules with scoping or pattern options

These rules already run in `strict` when the corresponding route or framework
config exists, and accept options for wider scoping or exceptions:

- `valid-prerender-paths` (`{ routePaths?: string[], allow?: string[] }`):
  Always checks static `prerender` arrays (or `prerender.paths`) in
  `react-router.config.*` for unresolved `:param` or `*` splat segments. When
  `routePaths` or `settings.reactRouter.routePaths` is configured, concrete
  paths must also match at least one route pattern. `allow` exempts exact paths.
- `no-sensitive-error-output` (`{ files?: string[], allowFiles?: string[] }`):
  Checks `settings.reactRouter.rootRoute` by default. Setting `files` replaces
  that root-only scope with the given file patterns; `allowFiles` exempts
  matching files. Flags direct JSX rendering of `error`, `caughtError`, or
  `unknownError` and `.stack` reads on those identifiers inside `ErrorBoundary`.
- `no-broad-action-origin` (`{ allow?: string[] }`): Checks literal
  `allowedActionOrigins` entries in `react-router.config.*` for `*` wildcards.
  Use `allow` to exempt explicitly reviewed wildcard patterns.

### All-only and opt-in resource rule

- `resource-route-returns-response`
  (`{ allowData?: boolean, files?: string[], allowFiles?: string[] }`):
  Enabled at `warn` in `all` only. Checks `loader`, `action`, `clientLoader`,
  and `clientAction` in recognized route modules without a default export,
  requiring statically visible returns and throws to produce
  `new Response(...)`, `redirect(...)`, `redirectDocument(...)`, or
  `replace(...)`. Without `files`, it checks every recognized resource module in
  ESLint's scope; restrict it using flat-config `files` or the rule's `files`
  option, exempt paths with `allowFiles`, and set `allowData: true` for
  fetcher/form-facing routes that intentionally return `data(...)`.

Example flat-config setup combining `strict` with explicit rule options and
scoped overrides:

```js
import reactRouter from "@th3trig3rfac3/eslint-plugin-react-router";

export default [
  reactRouter.configs.strict,
  {
    files: ["app/routes.ts"],
    rules: {
      "react-router/consistent-route-module-extension": [
        "warn",
        { mode: "always", extension: ".tsx" },
      ],
    },
  },
  {
    files: ["app/routes/teams.$teamId.tsx"],
    rules: {
      "react-router/valid-route-params": ["warn", { routePath: "/teams/:teamId" }],
    },
  },
  {
    files: ["app/routes/api/**/*.ts"],
    rules: {
      "react-router/resource-route-returns-response": ["error", { allowData: false }],
      "react-router/require-resource-content-type": [
        "warn",
        { files: ["app/routes/api/**/*.ts"] },
      ],
    },
  },
  {
    files: ["app/routes/admin/layout.tsx"],
    rules: {
      "react-router/require-route-error-boundary": [
        "error",
        { files: ["app/routes/admin/layout.tsx"] },
      ],
    },
  },
];
```

### Other configurable rules

- `no-action-only-routes`: `{ allowFiles?: string[], allow?: string[] }` (`allow`
  is an alias for `allowFiles`) to exempt intentional action-only resource
  modules.
- `no-action-form-default-method`:
  `{ actionPaths?: string[], allowGetActions?: boolean | string[], components?: string[] }`
  (`components` defaults to `["Form"]`).
- `no-browser-only-imports-in-server-exports`:
  `{ allow?: string[], browserOnlyPackages?: string[] }`.
- `no-server-only-imports-in-client-exports`:
  `{ allow?: string[], serverOnlyPackages?: string[] }`.
- `no-deprecated-react-router-api`:
  `{ apis?: Array<{ name: string, package?: string, replacement?: string }>, allow?: string[] }`
  (extends the built-in table, which initially tracks `json` in `react-router`
  and `react-router-dom`).
- `no-invalid-route-exports`: `{ allow?: string[] }` for custom integration
  route exports.
- `no-orphan-route-modules`: `{ allowFiles?: string[], ignore?: string[] }` to
  exempt non-route files matched by `routeModuleFiles`.
- `prefer-link-for-internal-navigation`: `{ allow?: string[] }` to exempt
  intentional internal anchor `href` values.
- `require-hydrate-fallback`: `{ allowFiles?: string[], allow?: string[] }`.
- `require-outlet-for-child-routes`:
  `{ files?: string[], allowFiles?: string[], wrapperComponents?: string[] }`.
- `safe-should-revalidate`: `{ allowFiles?: string[], allow?: string[] }`.
- `splittable-route-module`: `{ allow?: string[] }` for top-level binding names.
- `valid-route-module`: `{ allowFiles?: string[] }` to exempt referenced modules
  in `routes.ts`.
- `valid-route-module-path`:
  `{ extensions?: string[], checkExtensions?: string[] }` (`checkExtensions` is
  an alias for `extensions` in the linted route-config file).
- `no-conflicting-route-exports`: `{ rsc?: boolean }` (enabled with `{ rsc: true }`
  by the `rsc` preset).

Rules without options (`valid-route-config`, `no-duplicate-route-ids`,
`no-duplicate-route-params`, `no-conflicting-route-paths`,
`require-root-error-boundary`, `no-multiple-middleware-next`, and
`return-server-middleware-response`) use targeted ESLint disable comments or
flat-config overrides for intentional exceptions.

## Shared settings

Configure shared project settings under `settings.reactRouter` in your flat
config. Paths and file patterns are resolved relative to ESLint's current working
directory, not relative to `eslint.config.js`. Settings typed as
`string | string[]` accept either a single string or an array of strings.

| Setting                | Type                 | Default                                                          | Purpose                                                                        |
| ---------------------- | -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **appDirectory**       | `string`             | `"app"`                                                          | Base directory for resolving relative route-module paths in `routes.ts`.       |
| **rootRoute**          | `string \| string[]` | `["app/root.*"]`                                                 | Glob patterns identifying the root route module.                               |
| **routeConfig**        | `string \| string[]` | `["app/routes.ts", "app/routes.js"]`                             | Glob patterns identifying route configuration entry files.                     |
| **frameworkConfig**    | `string \| string[]` | `["react-router.config.*", "react-router.config.*.*"]`           | Glob patterns identifying React Router framework configuration files.          |
| **routeModuleFiles**   | `string \| string[]` | `["app/root.*", "app/routes/**/*"]`                              | Glob patterns for route-module recognition and orphan-module detection.        |
| **routePaths**         | `string \| string[]` | `[]`                                                             | Explicit route URL patterns for parameter, prerender, and manifest checks.     |
| **resourceRoutePaths** | `string \| string[]` | `[]`                                                             | Explicit resource URL patterns for client-navigation and manifest checks.      |
| **extensions**         | `string[]`           | `[".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"]` | Extensions tried when resolving extensionless route-module and fragment paths. |

Changing `appDirectory` does not rewrite `rootRoute`, `routeConfig`, or
`routeModuleFiles`. For monorepos or custom directory layouts, set all four
explicitly as shown in [TypeScript and TSX setup](#typescript-and-tsx-setup).

Pattern semantics:

- File-pattern settings (`rootRoute`, `routeConfig`, `frameworkConfig`,
  `routeModuleFiles`) and rule `files` / `allowFiles` / `ignore` options
  normalize `\` to `/`, strip leading `./`, and support `*` (within a segment),
  `**` / `**/` (across segments), `?` (single non-`/` character), and `{a,b}`
  brace alternatives (up to 64 expansions). Negations (`!`), extglobs, and
  character classes (`[...]`) are not supported.
- URL-pattern settings (`routePaths`, `resourceRoutePaths`) use rule-specific
  matching rather than filesystem globs: `no-route-manifest-collision` performs
  exact string comparison, `valid-prerender-paths` and
  `no-resource-route-client-navigation` match `:param` and `*` splat segments,
  and `valid-route-params` extracts `:param` names from configured paths.

## Supported versions

| Component    | Current support policy                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js      | `^22.23.5 \|\| ^24.22.3 \|\| ^26.13.1`                                                                                                |
| ESLint       | `^10.4.0`                                                                                                                             |
| React Router | Framework-mode route modules and `@react-router/dev/routes` syntax; the plugin does not add React Router as a runtime peer dependency |

Development and CI cover Node.js 22, 24, and 26 across Linux, Windows, and
macOS, along with ESLint `10.4.0` and `10.15.0` boundary checks on LTS Node.js
lines.

## What the rules catch

Action-only UI route:

```tsx
// reports: a document GET/refresh has no component or loader
export async function action() {
  return new Response("saved");
}
```

Root without a final error boundary:

```tsx
// reports in app/root.tsx
export default function Root() {
  return <Outlet />;
}
```

Missing route module path:

```ts
// reports when ./settings-page.tsx does not exist
route("settings", "./settings-page.tsx");
```

Scoped resource response contract:

```ts
// reports only when this file is explicitly selected in ESLint config
export function loader() {
  return { ok: true };
}
```

## Static-analysis boundaries and opt-outs

- **Never executes application code**: Neither `routes.ts`, route modules, nor
  `react-router.config.*` are imported or executed. Rules inspect parsed ASTs
  and resolved file paths only.
- **Route-module recognition and `.server` / `.client` / `+` exclusions**:
  Module rules analyze files matching `rootRoute`, files matching
  `routeModuleFiles`, or files importing from a generated `+types` directory
  (such as `./+types/...`). Within `routeModuleFiles`, support files named
  `*.server.<ext>`, `*.client.<ext>`, or beneath any `+`-prefixed path segment
  are excluded from route-module classification so shared helpers are not
  flagged as routes. Referencing a module outside `routeModuleFiles` from
  `routes.ts` does not automatically classify it during module-level linting;
  add custom directories to `settings.reactRouter.routeModuleFiles`. (Note:
  `no-orphan-route-modules` scans files matching `routeModuleFiles` directly on
  disk—excluding `node_modules`, `.git`, `dist`, and `coverage`—and uses
  `allowFiles` or `ignore` for non-route files matching that glob.)
- **Cross-file route-config limits**: Route-config analysis follows static
  relative imports within the project root boundary (rejecting path traversal
  outside the project root, null bytes, and escaping symlinks), with cycle
  detection, `maxDepth = 16`, and file metadata caching (`mtimeMs` and `size`).
  Dynamic route builders, computed module paths, unresolved re-exports, and
  `export *` are skipped or treated as unknown rather than guessed.
- **No TypeScript type information required**: Rules do not invoke the
  TypeScript type checker. Import-boundary checks follow same-file top-level
  bindings, and policy checks evaluate syntactic patterns and literal names
  rather than full runtime control flow. Keep React Router typegen and
  TypeScript checks enabled alongside ESLint.
- **Diagnostic-only (no autofixes)**: Every rule is diagnostic-only and declares
  no autofix or editor suggestion, because safe remedies (adding a loader,
  redirect, error boundary, header, or export) depend on application intent.
- **Opt-outs and escape hatches**: Use targeted ESLint disable comments
  (`// eslint-disable-next-line react-router/<rule-name>`), flat-config `files` /
  `ignores` overrides, or rule options (`allowFiles`, `allow`, `ignore`,
  `allowData`, `wrapperComponents`) when an intentional application convention
  falls outside a rule's contract.

## Design principles

- Prefer a few reliable rules over many noisy heuristics.
- Explain the React Router behavior behind every diagnostic.
- Never execute application code or route configuration during linting.
- Autofix only when an edit is semantics-preserving.
- Keep intentional resource-route and application-specific patterns configurable.
- Avoid duplicating errors already handled better by TypeScript or React Router.

## Project name and affiliation

This package is published to npm under the maintainer-controlled scope
`@th3trig3rfac3/eslint-plugin-react-router`.

This is a community project and is not affiliated with or endorsed by Shopify,
Remix, or the React Router maintainers. React Router and Remix are trademarks of
their respective owners.

## Contributing

Before opening a large pull request or proposing a new rule, open an issue on
[GitHub Issues](https://github.com/Th3Trig3rFac3/react-router-eslint-plugin/issues)
describing:

- the React Router mistake or best practice it addresses;
- minimal valid and invalid examples;
- known legitimate exceptions;
- whether TypeScript or React Router already detects it;
- whether a safe fix or suggestion is possible.

See the
[contributing guide](https://github.com/Th3Trig3rFac3/react-router-eslint-plugin/blob/main/CONTRIBUTING.md)
for local checks, the
[security policy](https://github.com/Th3Trig3rFac3/react-router-eslint-plugin/blob/main/SECURITY.md),
the
[code of conduct](https://github.com/Th3Trig3rFac3/react-router-eslint-plugin/blob/main/CODE_OF_CONDUCT.md),
and [CHANGELOG.md](./CHANGELOG.md).

## License

Licensed under the [Apache License 2.0](./LICENSE) (`Apache-2.0`).
