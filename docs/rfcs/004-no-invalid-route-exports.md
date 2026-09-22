# RFC 004: `no-invalid-route-exports`

**Status:** Accepted  
**Decision date:** 2026-09-22  
**Scope:** Recognized framework route modules  
**Configuration:** `strict` as `error`

The compatibility target is the React Router 8.4.x framework API and the
maintained 7.18.x framework line recorded in
[`docs/compatibility.md`](../compatibility.md).

## Problem

Misspelled route exports silently fail to participate in the framework pipeline.
The allowed names also change as React Router adds route-module APIs, so an
unversioned list would create upgrade surprises.

## Evidence and decision

The official [Route Module guide](https://reactrouter.com/start/framework/route-module)
documents component, loader/action, boundary, middleware, headers, links, meta,
handle, and revalidation exports. The [HMR explanation](https://reactrouter.com/explanation/hot-module-replacement)
identifies framework-managed exports and explains that user-defined exports are
not managed by the route pipeline. The [RSC guide](https://reactrouter.com/how-to/react-server-components)
documents the server component and server boundary variants. The rule uses that
versioned list to catch typos, while `allow` handles integration extensions and
intentional user-defined exports.

## Contract

- Inspect only recognized route modules, including configured roots and route
  globs; `.server`/`.client` support modules and `+` colocated helpers are
  excluded by the shared classifier.
- Recognize documented client/server variants, `default`, aliases, and local
  export specifiers.
- Skip `export *` because the complete export set cannot be known without
  following another module.
- Treat `unstable_*` as reserved and skip it to avoid blocking future flags.
- Report unknown names at their export site; never remove or rename code.
- Keep this rule in `strict` until another compatibility review supports a
  promotion.

Official export:

```tsx
export function ErrorBoundary() {
  return <p>Unable to load this route.</p>;
}
```

Typo:

```tsx
export function ErrorBoundry() {
  return <p>Never reached as a route boundary.</p>;
}
```

Intentional integration extension:

```js
rules: {
  "react-router/no-invalid-route-exports": ["error", {
    allow: ["customRouteMetadata"],
  }],
}
```

## Diagnostic and tests

The diagnostic is attached to the unknown export and names the `allow` escape
hatch. It has no autofix because renaming or removing an application export is
not semantics-preserving. The rule page is
[`docs/rules/no-invalid-route-exports.md`](../rules/no-invalid-route-exports.md),
and the focused cases are in
[`tests/rules/no-invalid-route-exports.test.ts`](../../tests/rules/no-invalid-route-exports.test.ts).

## Limitations and tests

The rule is a policy check, not a claim that every user-defined export causes a
runtime failure. HMR may still permit such exports with a full reload, so the
RFC requires an explicit allow entry for applications that use them. Tests
cover official exports, aliases, type-only exports, re-exports, future flags,
typos, integration allows, server variants, and support-module exclusions. The
Epic Stack run found only named application helpers; the final validation used
its explicit `allow` list and produced no unresolved strict diagnostics.
