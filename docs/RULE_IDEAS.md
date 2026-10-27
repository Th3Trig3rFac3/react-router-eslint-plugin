# Rule Ideas and Implementation Status

The proposals in this document are implemented as conservative static rules or
explicitly retained in the defer/avoid section. Each rule still needs real
application validation before it should be promoted to a low-noise shared
configuration.

> **Reviewed — 2026-10-26:** `[x]` marks an implemented rule or completed
> implementation task. Items under “Ideas to avoid or defer” are intentionally
> not implementation work.

The descriptions below reflect current implementation scope. The individual
[rule pages](./rules/) and [preset/settings reference](./README.md) describe
activation requirements and heuristic limits. Implemented does not mean full
framework parity or that a policy has passed representative-app validation.

## Prioritization criteria

A rule is a strong candidate when it:

- prevents a concrete runtime, routing, security, or deployment failure;
- can identify React Router context without relying on naming alone;
- works from static syntax or a deterministic project index;
- has a clear escape hatch for intentional patterns;
- adds value for JavaScript users even when TypeScript catches the same mistake;
- can explain the failure and a safe remedy in one diagnostic.

Rules that need a project-wide route graph should share one cached analyzer. The
current analyzer follows `routes.ts` and static relative fragments without
executing application code. Some rules inspect referenced modules. URL-policy
and framework-config rules still use explicit settings; they do not derive a
complete application model from all of these sources.

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
actions, including their client variants. The current implementation uses
`routePath`, `parentPaths`, or shared `routePaths`, combining all supplied
parameter names. It does not infer parent paths or incompatible module reuse
from the graph. Use file-scoped settings to avoid unrelated route parameters.

Suggested config: `strict` initially; promote high-confidence cases after
testing against real applications.

### `require-outlet-for-child-routes` — implemented

Report a parent route with configured children when its route component has no
visible `<Outlet />` and does not call `useOutlet()`.

This catches children that match but never render. Component composition makes
the analysis uncertain: an outlet may be rendered by an imported layout.
`wrapperComponents` supplies known wrappers. The module path inspects the
default component; the route-config path searches parent source text and can
report on composition it cannot inspect. `allowFiles` applies only to the
module path; use a targeted disable for an intentional config-level exception.

Suggested config: `strict`, warning only.

### `no-resource-route-client-navigation` — implemented

Using normal client-side navigation for a resource route makes React Router try
to render or fetch the resource as route data. When the target can be resolved
statically, require an HTML anchor or `<Link reloadDocument>`.

Initial scope:

- literal `to` values and literal `navigate()` arguments;
- resource routes supplied through `resourceRoutes` or shared settings;
- `<Link>`, `<NavLink>`, and imperative `navigate()` calls;
- explicit exceptions for resource routes intentionally consumed as data.

Current config: `strict` warning, inactive without resource patterns. The rule
does not infer resource targets from the route graph or inspect anchor `href`.

### `no-action-form-default-method` — implemented

Warn when a `<Form>` targets a route with an action but omits `method`, causing
the browser-style default `GET` behavior. Only report when the target and action
route are statically known; search forms and forms intentionally submitting a
GET must remain valid.

`allowGetActions` and targeted disable comments cover intentional cases.
`actionPaths` supplies other known targets; there is no graph inference. A
computed action in a module exporting `action` can still report as the
current-route case.

Suggested config: `strict` warning.

### `no-multiple-middleware-next` — implemented

Report a statically provable second call to the same `next` parameter in one
server or client middleware function. React Router permits only one call per
middleware invocation; a second call throws at runtime. Recognize route module
`middleware` and `clientMiddleware` arrays, including locally declared functions.
Skip callbacks, aliases, loops, and branches where execution count is uncertain.

Current config: `strict` error. There is no path-sensitive option. The schema's
`allow` option is currently unused; use a targeted disable for exceptions.

### `return-server-middleware-response` — implemented

For a server middleware function that calls `next()`, report an obvious path
that discards its `Response` and returns `undefined`. This can lose status,
headers, or body changes from downstream handlers. Do not report middleware
that intentionally omits `next()` and relies on React Router's automatic call,
or `clientMiddleware`, whose return contract differs. Start with direct
`await next();` followed by an empty return or function end; defer complex
control flow. The implementation accepts any non-`undefined` top-level return
as sufficient and does not verify its type. The schema's `allow` option is
currently unused.

Suggested config: `strict` until confirmed against representative applications.

## Useful project-policy rules — implemented with explicit scope

These rules can be valuable in larger applications but should not enter
`recommended` without broad evidence.

### `no-orphan-route-modules` — implemented

Report files matching configured route-module globs that are not referenced by
the static route graph. This can find abandoned pages after route refactors.
Use `allowFiles` or `ignore` for fixtures, colocated helpers, and convention-based
modules. A dynamic or incomplete graph skips the check; matched test files are
not automatically exempt.

### `valid-prerender-paths` — implemented

Check static array and object-form `prerender` paths in the default framework
config. Reject unresolved parameters/splats; check concrete route membership
only when `routePaths` is supplied in options or settings. Skip function-valued
prerender configuration. The route graph is not inferred automatically.

### `no-route-manifest-collision` — implemented

When lazy route discovery uses a custom `manifestPath`, report a statically
configured application route or resource route at the same exact path. Lists
come from options or shared settings, rather than automatic graph inference.

### `no-broad-action-origin` — implemented

Flag any literal `allowedActionOrigins` entry containing `*` in the
default-exported framework config, including simple local aliases. This is a
project policy requiring wildcard review, not a complete origin-security model.

### `require-resource-content-type` — implemented

For explicitly scoped resource routes that construct a `Response` containing a
statically known non-empty body, require a visible `Content-Type` header.
Dynamic bodies and `Response.json()` are skipped; unknown header objects can
report. `files` must be supplied even though the rule is present in `strict`.

### `no-sensitive-error-output` — implemented

Warn on obvious stack reads and raw error interpolation in a root
`ErrorBoundary` (or additional `files`). The current syntax check does not
recognize development-only guards. Use `allowFiles` or a targeted disable for a
reviewed exception; this is not a general data-disclosure analysis.

### `consistent-route-module-extension` — implemented

Enforce a configured extension policy for module paths in `routes.ts`, such as
always including `.tsx` or always omitting resolvable extensions. This is purely
stylistic. `mode` is required to activate the check; it inspects the current
config file only and provides no autofix or editor suggestion.

### `no-deprecated-react-router-api` — implemented

Provide diagnostics from a small maintained table (`json` imports by default),
with optional project entries. The rule does not read the installed framework
version or cover every deprecation in newer releases; additions require a
version review.

## Advanced client/server analysis — implemented conservatively

### `no-server-only-imports-in-client-exports` — implemented

Trace dependencies reachable from client-side exports such as the default
component, `clientLoader`, `clientAction`, `clientMiddleware`, and
`HydrateFallback`. Report imports that are explicitly server-only or use Node
built-ins in browser code.

The implementation follows same-file helper bindings by identifier name and
checks unbound side-effect imports when client exports exist. It does not fully
resolve lexical shadowing or imported implementations. Framework build checks
remain authoritative.

### `no-browser-only-imports-in-server-exports` — implemented

Perform the inverse check for `loader`, `action`, server `middleware`, and
`headers`. It uses explicit module markers, `/client` naming, and configured
package lists. It does not analyze arbitrary browser-global usage in imported
code. Same-file helper chains and side-effect imports are checked.

### `splittable-route-module` — implemented

Identify names from plain top-level `let`/`var` declarations read directly by
client exports. This is a narrow heuristic, not equivalent to React Router's
`splitRouteModules: "enforce"` build check. Immutable helpers, exported state,
and helper-chain dependencies are outside its current analysis.

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
- [x] Implement parameter, resource-navigation, and outlet checks with their
      documented explicit settings and syntax/text limits.
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
