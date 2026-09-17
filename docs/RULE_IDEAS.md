# Future Rule Ideas

This document is a design backlog, not a promise that every rule will ship.
Each proposal should still receive a focused RFC with real application examples,
false-positive analysis, and a comparison with diagnostics already provided by
React Router or TypeScript.

## Prioritization criteria

A rule is a strong candidate when it:

- prevents a concrete runtime, routing, security, or deployment failure;
- can identify React Router context without relying on naming alone;
- works from static syntax or a deterministic project index;
- has a clear escape hatch for intentional patterns;
- adds value for JavaScript users even when TypeScript catches the same mistake;
- can explain the failure and a safe remedy in one diagnostic.

Rules that need a project-wide route graph should share one cached analyzer. The
analyzer should be built from `routes.ts`, static local fragments, route module
exports, and `react-router.config.ts` without importing or executing application
code.

## Best next candidates

### `valid-route-config`

Validate statically understandable `RouteConfigEntry` objects and calls to
`route`, `index`, `layout`, `prefix`, and `relative`.

Initial checks could include:

- the default export is an array or a supported static expression;
- every entry has a module file where one is required;
- `index: true` entries do not have children;
- helper arguments appear in the documented positions;
- `children` is an array of route entries;
- `id`, `path`, `file`, and `caseSensitive` have sensible literal types in
  JavaScript files.

This would primarily help JavaScript projects and malformed generated configs.
TypeScript users may already receive several of these diagnostics, so duplicate
reports should be suppressed when a precise TypeScript error exists.

Suggested config: `recommended` for definite structural errors.

### `no-duplicate-route-ids`

Build the static route graph and report repeated explicit route IDs. Route IDs
are documented as unique, and collisions can make route lookup and generated
types ambiguous.

The rule should report both declarations, ignore dynamic IDs it cannot prove,
and account for route config fragments without depending on ESLint file order.

Suggested config: `recommended`.

### `no-conflicting-route-paths`

Report sibling route entries that have the same effective static path and
equivalent case-sensitivity. Include collisions introduced through `prefix()`
or `relative()` fragments.

Start with exact duplicates. Ranking conflicts such as `:id` versus `new`,
optional segments, and splats need separate research because React Router may
resolve them deterministically even when the result surprises a developer.

Suggested config: exact duplicates in `recommended`; ambiguous patterns in
`strict` or a separate rule.

### `no-duplicate-route-params`

Report a single route pattern that declares the same parameter name more than
once, for example `teams/:id/members/:id`. Repeated names make `params.id`
ambiguous and usually indicate a copy/paste mistake.

The rule can operate locally on static route path literals and does not require
type information.

Suggested config: `recommended`.

### `valid-route-params`

Compare parameters used by a route module with the parameters declared by its
route path. Examples include destructuring `params.teamId` when the route uses
`:teamID`, or referencing a parameter that only exists on an unrelated branch.

Begin with direct property access and destructuring in exported loaders and
actions. Parent parameters must be inherited through the route graph. Skip
computed property names and modules referenced by multiple incompatible route
entries.

Suggested config: `strict` initially; promote high-confidence cases after
testing against real applications.

### `require-outlet-for-child-routes`

Report a parent route with configured children when its route component has no
visible `<Outlet />` and does not call `useOutlet()`.

This catches children that match but never render. Component composition makes
the analysis uncertain: an outlet may be rendered by a child component or an
imported layout. Support allowlisted wrapper components and skip components the
rule cannot inspect confidently.

Suggested config: `strict`, warning only.

### `require-hydrate-fallback`

When a route assigns `clientLoader.hydrate = true`, require a
`HydrateFallback` export unless the file is explicitly exempted. React Router
can wait for the client loader during initial hydration, so a fallback avoids an
unexplained empty or delayed route area.

Recognize `true as const`, export aliases, and common function assignment
patterns. Do not require a fallback merely because a `clientLoader` exists.

Suggested config: `recommended` warning or `strict` error after validation.

### `safe-should-revalidate`

Detect implementations that always return `false`, or branches that ignore
`defaultShouldRevalidate` without an explicit project opt-out. An unconditional
false can leave UI data out of sync with the server.

This rule should focus on obvious constant implementations. General control-flow
proof would be expensive and likely noisy.

Suggested config: `strict`.

### `no-resource-route-client-navigation`

Using normal client-side navigation for a resource route makes React Router try
to render or fetch the resource as route data. When the target can be resolved
statically, require an HTML anchor or `<Link reloadDocument>`.

Initial scope:

- literal `to` and `href` values;
- resource routes known from the static route graph;
- `<Link>`, `<NavLink>`, and imperative `navigate()` calls;
- explicit exceptions for resource routes intentionally consumed as data.

Suggested config: `strict` until cross-file path resolution is proven reliable.

### `no-action-form-default-method`

Warn when a `<Form>` targets a route with an action but omits `method`, causing
the browser-style default `GET` behavior. Only report when the target and action
route are statically known; search forms and forms intentionally submitting a
GET must remain valid.

An option such as `allowGetActions` or a targeted disable comment should cover
intentional cases.

Suggested config: `strict` warning.

### `no-conflicting-route-exports`

Report mutually exclusive route module exports. The first useful contract is
React Server Components, where a route cannot export both `default` and
`ServerComponent`. Equivalent client/server boundary pairs such as
`ErrorBoundary`/`ServerErrorBoundary`, `Layout`/`ServerLayout`, and
`HydrateFallback`/`ServerHydrateFallback` can be added only while those APIs are
supported and their contracts remain stable.

Keep experimental APIs behind an option or versioned preset so stable users do
not receive diagnostics for syntax their React Router version does not know.

Suggested config: opt-in RSC preset first.

## Useful project-policy rules

These rules can be valuable in larger applications but should not enter
`recommended` without broad evidence.

### `no-orphan-route-modules`

Report files matching configured route-module globs that are not referenced by
the static route graph. This can find abandoned pages after route refactors.
Allow test fixtures, colocated helpers, convention-based route packages, and
dynamic file-route adapters.

### `valid-prerender-paths`

Compare static `prerender` paths from `react-router.config.ts` with the route
graph. Report paths that cannot match any route and concrete paths that still
contain unresolved `:params`. Skip function-valued prerender configuration.

### `no-route-manifest-collision`

When lazy route discovery uses a custom `manifestPath`, report a statically
configured application route or resource route at the same path.

### `no-broad-action-origin`

Flag dangerously broad `allowedActionOrigins` entries such as a universal
wildcard. This is a security policy rule and must precisely model React Router's
documented host-pattern semantics before implementation.

### `require-resource-content-type`

For explicitly scoped resource routes that construct a `Response` containing a
non-empty body, require a `Content-Type` header unless the body type supplies it
automatically. This is useful for APIs, feeds, files, and documents but too
application-specific for a shared default.

### `no-sensitive-error-output`

Warn when a root `ErrorBoundary` renders `error.stack` or raw unknown error
content without a development-only guard. Avoid reporting deliberate internal
applications and safely normalized public messages.

### `consistent-route-module-extension`

Enforce a configured extension policy for module paths in `routes.ts`, such as
always including `.tsx` or always omitting resolvable extensions. This is purely
stylistic and can offer a safe fix when resolution is unambiguous.

### `no-deprecated-react-router-api`

Provide version-aware migration diagnostics for APIs formally deprecated by
React Router. The rule must be generated from a maintained compatibility table;
it should never guess based on package names or flag APIs that remain supported.

## Advanced client/server analysis

### `no-server-only-imports-in-client-exports`

Trace dependencies reachable from client-side exports such as the default
component, `clientLoader`, `clientAction`, `clientMiddleware`, and
`HydrateFallback`. Report imports that are explicitly server-only or use Node
built-ins in browser code.

This requires scope-aware dependency tracing and must understand that server
exports are removed from browser bundles. Before implementation, confirm that
React Router's build already does not provide a clearer diagnostic.

### `no-browser-only-imports-in-server-exports`

Perform the inverse check for `loader`, `action`, server `middleware`, and
`headers`. Only flag modules that are explicitly marked client-only or use
browser globals at module evaluation time; functions may intentionally inspect
web-standard request and response APIs.

### `splittable-route-module`

Identify top-level state or shared bindings that prevent client route exports
from being split into independent chunks. This should mirror React Router's
`splitRouteModules: "enforce"` behavior rather than inventing a second,
conflicting definition. Implement only if lint-time feedback is materially
earlier or clearer than the build diagnostic.

## Ideas to avoid or defer

- Do not require every route to export a loader; many valid UI routes need none.
- Do not require every route to export an error boundary; boundary placement is
  an application architecture decision.
- Do not require every resource route to return `Response`; fetcher/form-facing
  resource routes may legitimately return serializable data.
- Do not ban `react-router-dom` or hook-based APIs merely because a newer style
  exists; supported APIs are not lint errors.
- Do not enforce authentication, authorization, caching, or CSRF behavior from
  function names. Security rules need explicit, inspectable contracts.
- Do not duplicate a React Router build error unless the lint diagnostic is
  earlier, more precise, and available to JavaScript users.
- Do not attempt to validate arbitrary dynamic route builders by executing
  configuration code.

## Suggested implementation order

1. `valid-route-config`
2. `no-duplicate-route-ids`
3. `no-duplicate-route-params`
4. exact cases for `no-conflicting-route-paths`
5. `require-hydrate-fallback`
6. `valid-route-params`
7. `no-resource-route-client-navigation`
8. `require-outlet-for-child-routes`
9. project-policy and client/server dependency rules

The first four can reuse the existing `routes.ts` import tracking and path
resolution without requiring type services. The later rules benefit from a
cached project graph and need more representative-app testing.

## Primary React Router references

- [Route modules](https://reactrouter.com/start/framework/route-module)
- [Framework routing and route helpers](https://reactrouter.com/start/framework/routing)
- [`routes.ts` convention](https://reactrouter.com/api/framework-conventions/routes.ts)
- [`RouteConfigEntry` API](https://api.reactrouter.com/v7/interfaces/_react-router_dev.routes.RouteConfigEntry.html)
- [Data loading and hydration](https://reactrouter.com/start/framework/data-loading)
- [`Form` and submission methods](https://reactrouter.com/api/components/Form)
- [Resource routes](https://reactrouter.com/how-to/resource-routes)
- [Automatic route-module code splitting](https://reactrouter.com/explanation/code-splitting)
- [`react-router.config.ts`](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- [React Server Components](https://reactrouter.com/how-to/react-server-components)
