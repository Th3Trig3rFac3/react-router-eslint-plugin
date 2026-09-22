# ESLint Plugin for React Router

> [!IMPORTANT]
> This project is in prerelease development and has not been published to npm.
> The rule API may change before a stable 1.0 release.

An ESLint plugin for catching common mistakes in React Router framework-mode
route modules and route configuration files.

The goal is to make frequent routing errors easy to understand for newer React
Router users while also offering stricter, opt-in checks for large applications.
Rules should be conservative, well documented, and safe to run: the plugin will
analyze source code and file paths without executing an application's route
configuration.

## Rules

| Rule                                        | Purpose                                                                                                                                   | Config               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `consistent-route-module-extension`         | Enforce a configured extension policy for static route-module paths.                                                                      | Strict, opt-in       |
| `no-action-form-default-method`             | Warn when a known action form omits `method` and therefore defaults to a browser GET.                                                     | Strict               |
| `no-action-only-routes`                     | Warn when a route exports an action but cannot handle a refreshed `GET` request. Intentional action-only resource routes can be excluded. | Recommended          |
| `no-browser-only-imports-in-server-exports` | Disallow explicitly client-only imports used by server route exports.                                                                     | Strict               |
| `no-broad-action-origin`                    | Disallow universal or wildcard `allowedActionOrigins` entries.                                                                            | Strict, opt-in       |
| `no-conflicting-route-exports`              | In the opt-in RSC preset, find mutually exclusive client/server route exports.                                                            | RSC opt-in           |
| `no-conflicting-route-paths`                | Find exact duplicate sibling paths, including paths introduced through `prefix()`.                                                        | Recommended          |
| `no-deprecated-react-router-api`            | Report APIs in the maintained React Router deprecation table with migration guidance.                                                     | Strict               |
| `no-duplicate-route-ids`                    | Find repeated explicit route IDs in a static route configuration.                                                                         | Recommended          |
| `no-duplicate-route-params`                 | Find repeated parameter names in one effective route pattern.                                                                             | Recommended          |
| `no-multiple-middleware-next`               | Disallow two unconditional `next()` calls in one middleware invocation.                                                                   | Strict               |
| `no-orphan-route-modules`                   | Find configured route-module files that are not referenced by the static route graph.                                                     | Strict               |
| `no-resource-route-client-navigation`       | Require document navigation for statically scoped resource-route targets.                                                                 | Strict, opt-in       |
| `no-route-manifest-collision`               | Disallow a lazy route manifest path that collides with a configured route.                                                                | Strict, opt-in       |
| `no-sensitive-error-output`                 | Disallow raw error stacks or unknown errors rendered by route error boundaries.                                                           | Strict, opt-in       |
| `no-server-only-imports-in-client-exports`  | Disallow explicit server-only or Node imports reached by client route exports.                                                            | Strict               |
| `prefer-link-for-internal-navigation`       | Require `Link` instead of plain anchors for internal application navigation.                                                              | Strict               |
| `require-hydrate-fallback`                  | Warn when `clientLoader.hydrate = true` has no `HydrateFallback` export.                                                                  | Strict               |
| `require-outlet-for-child-routes`           | Warn when a configured parent with children has no statically visible outlet.                                                             | Strict               |
| `require-resource-content-type`             | Require `Content-Type` for explicitly scoped resource Responses with non-empty bodies.                                                    | Strict, opt-in       |
| `require-route-error-boundary`              | Require an error boundary at explicitly configured application boundaries.                                                                | Strict, opt-in       |
| `require-root-error-boundary`               | Require the root route to export an `ErrorBoundary`.                                                                                      | Recommended          |
| `return-server-middleware-response`         | Warn when server middleware discards the response returned by `next()`.                                                                   | Strict               |
| `safe-should-revalidate`                    | Warn about trivially unconditional `shouldRevalidate` implementations that always return `false`.                                         | Strict               |
| `valid-route-config`                        | Validate statically understandable route helper calls and `RouteConfigEntry` object literals.                                             | Recommended          |
| `splittable-route-module`                   | Warn about top-level mutable state that can prevent client route-module splitting.                                                        | Strict               |
| `valid-prerender-paths`                     | Validate static prerender paths and reject unresolved route parameters.                                                                   | Strict, opt-in       |
| `valid-route-module`                        | Check that resolved route modules expose a meaningful route export.                                                                       | Strict               |
| `valid-route-module-path`                   | Check that static module paths referenced by `routes.ts` resolve to files.                                                                | Recommended          |
| `valid-route-params`                        | Check direct loader/action parameter reads against a configured route path.                                                               | Strict, opt-in       |
| `no-invalid-route-exports`                  | Find misspelled or unsupported route-module exports.                                                                                      | Strict               |
| `resource-route-returns-response`           | Require externally consumed resource routes to return a `Response`, with explicit file scoping.                                           | Strict, opt-in scope |

The resource-route rule is intentionally narrow. React Router also supports
resource routes consumed through fetchers or forms, where returning `data()` can
be correct. The plugin should not report those routes as invalid by default.

The original `valid-resource-route` spelling is exported as a compatibility
alias for `resource-route-returns-response`; it is not enabled by either shared
config.

## Installation

After the package name is confirmed and the first npm release is made, install
the plugin alongside ESLint. Replace `YOUR_PACKAGE_NAME` with the final
maintainer-controlled package name:

```sh
npm install --save-dev eslint YOUR_PACKAGE_NAME
pnpm add --save-dev eslint YOUR_PACKAGE_NAME
yarn add --dev eslint YOUR_PACKAGE_NAME
bun add --dev eslint YOUR_PACKAGE_NAME
```

Until then, use a packed tarball from this repository (`pnpm build && pnpm pack`)
for local validation.

## Configurations

- `recommended` focuses on common correctness problems with low false-positive
  rates.
- `strict` extends the recommended checks with more opinionated rules. The
  response-contract rule still needs an explicit file scope.
- `all` exposes every rule at warning severity for rule exploration. It is
  intentionally unstable and should not be used in CI without review.

The intended flat-config API is:

```js
import reactRouter from "eslint-plugin-react-router";

export default [reactRouter.configs.recommended];
```

The package also exposes `configs["flat/recommended"]` and
`configs["flat/strict"]` and `configs["flat/all"]` aliases for configuration
styles that prefer explicit flat-config naming.

For a reviewed, higher-signal policy bundle:

```js
import reactRouter from "eslint-plugin-react-router";

export default [reactRouter.configs.strict];
```

To customize a monorepo or non-standard app directory:

```js
import reactRouter from "eslint-plugin-react-router";

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

## Supported versions

| Component    | Current support policy                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js      | `^22.23.2 \|\| ^24.21.0`                                                                                                              |
| ESLint       | `^10.0.0`                                                                                                                             |
| React Router | Framework-mode route modules and `@react-router/dev/routes` syntax; the plugin does not add React Router as a runtime peer dependency |

Development and release tooling prioritize Node.js 24. Node.js 22 remains a
supported compatibility line and is covered by CI. The development
`@types/node` dependency follows the primary Node.js 24 line.

The compatibility matrix is deliberately conservative while the package is a
prerelease. React Router release validation and the previous-maintained-major
fixture set are release gates, not assumptions hidden in the rules.

See [`docs/compatibility.md`](./docs/compatibility.md) for the dated latest and
previous React Router, ESLint, and Node.js evidence, exact CI boundaries, and
the three application validation report.

## What the first rules catch

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

Unscoped resource response contract:

```ts
// reports only when this file is explicitly selected by the config
export function loader() {
  return { ok: true };
}
```

Each rule page in [`docs/rules`](./docs/rules) includes correct alternatives,
options, limitations, and the relevant React Router documentation link.

## Static-analysis boundaries and opt-outs

The plugin never imports or executes route modules or `routes.ts`. It checks
static exports, helper imports, literal paths, and simple control flow. Dynamic
route builders, computed module paths, unresolved re-exports, and complex
indirect return values are skipped or reported as unknown rather than guessed.
Use a targeted ESLint disable comment, `allowFiles`, `allow`, or an explicit
file-scoped override when an intentional application convention is outside the
rule's contract.

## Project status and roadmap

The detailed architecture, rule contracts, test strategy, packaging work,
documentation requirements, and release phases are in [PLAN.md](./docs/PLAN.md).
The implementation status and intentionally deferred ideas are in
[RULE_IDEAS.md](./docs/RULE_IDEAS.md).

Early feedback is particularly useful for:

- legitimate route patterns that the proposed rules must allow;
- monorepos and custom `appDirectory` layouts;
- split route configurations using `relative()`;
- compatibility expectations for React Router, ESLint, and Node.js versions.

## Design principles

- Prefer a few reliable rules over many noisy heuristics.
- Explain the React Router behavior behind every diagnostic.
- Never execute application code or route configuration during linting.
- Autofix only when an edit is semantics-preserving.
- Keep intentional resource-route and application-specific patterns configurable.
- Avoid duplicating errors already handled better by TypeScript or React Router.

## Project name and affiliation

The npm package name is not final. An npm/CDN check found that
`eslint-plugin-react-router` is already occupied by a legacy `0.0.1` package,
so this repository's unscoped name is a provisional local/CI identifier only.
Before publishing an alpha, the owner must select an available
maintainer-controlled scope or alternate name and update package metadata,
installation examples, and release automation together. Do not publish under
the occupied name or imply that this project is the legacy package.

This is currently a community project and is not affiliated with or endorsed by
Shopify, Remix, or the React Router maintainers. React Router and Remix are
trademarks of their respective owners.

## Contributing

Implementation is underway. Before opening a large pull request, please use the
plan to discuss the proposed phase or rule contract in an issue. A rule proposal
should include:

- the React Router mistake or best practice it addresses;
- minimal valid and invalid examples;
- known legitimate exceptions;
- whether TypeScript or React Router already detects it;
- whether a safe fix or suggestion is possible.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local checks. A security policy and
code of conduct are also included. See [SECURITY.md](./SECURITY.md),
[CHANGELOG.md](./CHANGELOG.md), and the issue templates before proposing a
release or a new rule.

## License

Licensed under the [Apache License 2.0](./LICENSE). The license choice will be
confirmed with the project owner before the first npm release.
