# Rule Ideas and Implementation Status

The proposals in this document are implemented as conservative static rules or
explicitly retained in the defer/avoid section. Each rule still needs real
application validation before it should be promoted to a low-noise shared
configuration.

> **Status — 2026-09-22:** `[x]` marks an implemented rule or completed
> implementation task. Items under “Ideas to avoid or defer” are intentionally
> not implementation work.

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

## Implemented rules

These rules are exported today. Route-config analysis follows safe relative
fragments inside the project root and skips dynamic or unresolved graph edges:

- [x] `valid-route-config`
- [x] `no-duplicate-route-ids`
- [x] `no-conflicting-route-paths`
- [x] `no-duplicate-route-params`
- [x] `require-hydrate-fallback` (`strict`)
- [x] `safe-should-revalidate` (`strict`)
- [x] `no-conflicting-route-exports` (opt-in RSC preset)
- [x] `valid-route-module`
- [x] `valid-route-params`
- [x] `require-outlet-for-child-routes`
- [x] `no-resource-route-client-navigation`
- [x] `no-action-form-default-method`
- [x] `no-multiple-middleware-next`
- [x] `return-server-middleware-response`
- [x] `no-orphan-route-modules`
- [x] `valid-prerender-paths`
- [x] `no-route-manifest-collision`
- [x] `no-broad-action-origin`
- [x] `require-resource-content-type`
- [x] `no-sensitive-error-output`
- [x] `consistent-route-module-extension`
- [x] `no-deprecated-react-router-api`
- [x] `no-server-only-imports-in-client-exports`
- [x] `no-browser-only-imports-in-server-exports`
- [x] `splittable-route-module`

- [x] The plugin also exports `require-root-error-boundary`,
      `valid-route-module-path`, `no-action-only-routes`,
      `no-invalid-route-exports`, and the opt-in
      `resource-route-returns-response` rule. See the
      [README rule table](../README.md#rules) for config membership.

## Implemented candidate contracts

### `valid-route-params` — implemented

Compare parameters used by a route module with the parameters declared by its
route path. Examples include destructuring `params.teamId` when the route uses
`:teamID`, or referencing a parameter that only exists on an unrelated branch.

Begin with direct property access and destructuring in exported loaders and
actions. Parent parameters must be inherited through the route graph. Skip
computed property names and modules referenced by multiple incompatible route
entries.

Suggested config: `strict` initially; promote high-confidence cases after
testing against real applications.

### `require-outlet-for-child-routes` — implemented

Report a parent route with configured children when its route component has no
visible `<Outlet />` and does not call `useOutlet()`.

This catches children that match but never render. Component composition makes
the analysis uncertain: an outlet may be rendered by a child component or an
imported layout. Support allowlisted wrapper components and skip components the
rule cannot inspect confidently.

Suggested config: `strict`, warning only.

### `no-resource-route-client-navigation` — implemented

Using normal client-side navigation for a resource route makes React Router try
to render or fetch the resource as route data. When the target can be resolved
statically, require an HTML anchor or `<Link reloadDocument>`.

Initial scope:

- literal `to` and `href` values;
- resource routes known from the static route graph;
- `<Link>`, `<NavLink>`, and imperative `navigate()` calls;
- explicit exceptions for resource routes intentionally consumed as data.

Suggested config: `strict` until cross-file path resolution is proven reliable.

### `no-action-form-default-method` — implemented

Warn when a `<Form>` targets a route with an action but omits `method`, causing
the browser-style default `GET` behavior. Only report when the target and action
route are statically known; search forms and forms intentionally submitting a
GET must remain valid.

An option such as `allowGetActions` or a targeted disable comment should cover
intentional cases.

Suggested config: `strict` warning.

### `no-multiple-middleware-next` — implemented

Report a statically provable second call to the same `next` parameter in one
server or client middleware function. React Router permits only one call per
middleware invocation; a second call throws at runtime. Recognize route module
`middleware` and `clientMiddleware` arrays, including locally declared functions.
Skip callbacks, aliases, loops, and branches where execution count is uncertain.

Suggested config: `recommended` for unconditional duplicate calls; use a
separate `strict` option for path-sensitive cases.

### `return-server-middleware-response` — implemented

For a server middleware function that calls `next()`, report an obvious path
that discards its `Response` and returns `undefined`. This can lose status,
headers, or body changes from downstream handlers. Do not report middleware
that intentionally omits `next()` and relies on React Router's automatic call,
or `clientMiddleware`, whose return contract differs. Start with direct
`await next();` followed by an empty return or function end; defer complex
control flow.

Suggested config: `strict` until confirmed against representative applications.

## Useful project-policy rules — implemented with explicit scope

These rules can be valuable in larger applications but should not enter
`recommended` without broad evidence.

### `no-orphan-route-modules` — implemented

Report files matching configured route-module globs that are not referenced by
the static route graph. This can find abandoned pages after route refactors.
Allow test fixtures, colocated helpers, convention-based route packages, and
dynamic file-route adapters.

### `valid-prerender-paths` — implemented

Compare static `prerender` paths from `react-router.config.ts` with the route
graph. Report paths that cannot match any route and concrete paths that still
contain unresolved `:params`. Skip function-valued prerender configuration.

### `no-route-manifest-collision` — implemented

When lazy route discovery uses a custom `manifestPath`, report a statically
configured application route or resource route at the same path.

### `no-broad-action-origin` — implemented

Flag dangerously broad `allowedActionOrigins` entries such as a universal
wildcard. This is a security policy rule and must precisely model React Router's
documented host-pattern semantics before implementation.

### `require-resource-content-type` — implemented

For explicitly scoped resource routes that construct a `Response` containing a
non-empty body, require a `Content-Type` header unless the body type supplies it
automatically. This is useful for APIs, feeds, files, and documents but too
application-specific for a shared default.

### `no-sensitive-error-output` — implemented

Warn when a root `ErrorBoundary` renders `error.stack` or raw unknown error
content without a development-only guard. Avoid reporting deliberate internal
applications and safely normalized public messages.

### `consistent-route-module-extension` — implemented

Enforce a configured extension policy for module paths in `routes.ts`, such as
always including `.tsx` or always omitting resolvable extensions. This is purely
stylistic and can offer a safe fix when resolution is unambiguous.

### `no-deprecated-react-router-api` — implemented

Provide version-aware migration diagnostics for APIs formally deprecated by
React Router. The rule must be generated from a maintained compatibility table;
it should never guess based on package names or flag APIs that remain supported.

## Advanced client/server analysis — implemented conservatively

### `no-server-only-imports-in-client-exports` — implemented

Trace dependencies reachable from client-side exports such as the default
component, `clientLoader`, `clientAction`, `clientMiddleware`, and
`HydrateFallback`. Report imports that are explicitly server-only or use Node
built-ins in browser code.

This requires scope-aware dependency tracing and must understand that server
exports are removed from browser bundles. Before implementation, confirm that
React Router's build already does not provide a clearer diagnostic.

### `no-browser-only-imports-in-server-exports` — implemented

Perform the inverse check for `loader`, `action`, server `middleware`, and
`headers`. Only flag modules that are explicitly marked client-only or use
browser globals at module evaluation time; functions may intentionally inspect
web-standard request and response APIs.

### `splittable-route-module` — implemented

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

## Implementation order completed

- [x] Validate and repair current rule contracts.
- [x] Implement `no-multiple-middleware-next` using local route-module syntax.
- [x] Build and use a cached, parser-backed project graph for imported route fragments and
      referenced route modules. Keep resolution independent of ESLint file order.
- [x] Implement `valid-route-params`, `no-resource-route-client-navigation`, and
      `require-outlet-for-child-routes` with explicit uncertainty handling.
- [x] Implement project-policy and conservative client/server dependency rules with
      explicit uncertainty handling.

`no-action-form-default-method` and `return-server-middleware-response` are
tested independently and remain warning-level strict policies until legitimate
patterns and overlap with React Router or TypeScript diagnostics are measured.

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
- [Middleware](https://reactrouter.com/how-to/middleware)
