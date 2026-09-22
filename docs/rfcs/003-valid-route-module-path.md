# RFC 003: `valid-route-module-path`

**Status:** Accepted  
**Decision date:** 2026-09-22  
**Scope:** Statically analyzable framework route configuration  
**Configuration:** `recommended` as `error`

The compatibility target is the React Router 8.4.x framework API and the
maintained 7.18.x framework line recorded in
[`docs/compatibility.md`](../compatibility.md).

## Problem

`routes.ts` connects a URL pattern to a route-module file. A typo in that file
path makes the route graph fail before the application can serve the route.

## Evidence and decision

The official [framework routing guide](https://reactrouter.com/start/framework/routing)
defines the URL pattern and module path as the two required parts of a route.
The [`routes.ts` API](https://reactrouter.com/api/framework-conventions/routes.ts)
documents `route`, `index`, `layout`, `prefix`, and `relative`; only the first
three and helpers returned by `relative` carry a module path that this rule can
check directly. The rule follows React Router app-directory resolution and
never evaluates user configuration.

## Contract

- Recognize direct and aliased imports from `@react-router/dev/routes`.
- Check static module arguments to `route`, `index`, and `layout`.
- Track helpers created by `relative(directory)` and resolve their paths from
  that directory.
- Try the configured JavaScript/TypeScript extensions for extensionless paths.
- Keep paths inside the configured project boundary.
- Skip computed strings, custom wrappers, `flatRoutes()`, and other unknown
  graph edges rather than guessing.
- Report the literal path and candidate files; suggest a replacement only when
  there is exactly one high-confidence candidate.

Incorrect:

```ts
import { route } from "@react-router/dev/routes";

export default [route("settings", "./setting.tsx")];
```

Correct:

```ts
import { index, layout, relative, route } from "@react-router/dev/routes";

const fromRoutes = relative("./routes");

export default [
  index("./home.tsx"),
  route("settings", "./settings.tsx"),
  layout("./auth/layout.tsx", [fromRoutes.route("profile", "profile.tsx")]),
];
```

Unknown by design:

```ts
const modulePath = getPathFromEnvironment();
export default [route("settings", modulePath)];
```

## Diagnostic and tests

The diagnostic is attached to the literal module argument and lists the
attempted candidates. There is no autofix; a replacement is suggested only
when exactly one high-confidence candidate exists. The rule page is
[`docs/rules/valid-route-module-path.md`](../rules/valid-route-module-path.md),
and the focused cases are in
[`tests/rules/valid-route-module-path.test.ts`](../../tests/rules/valid-route-module-path.test.ts).

## Limitations and tests

File-system route generators and custom wrappers own their own discovery rules;
the plugin does not reproduce or execute them. Tests cover helper aliases,
`relative`, extensionless paths, imported fragments, Windows/POSIX paths,
computed values, and project-boundary traversal. The official template's
static `index` path passed; Epic Stack's custom `autoRoutes` call was recorded
as an intentionally skipped dynamic wrapper.
