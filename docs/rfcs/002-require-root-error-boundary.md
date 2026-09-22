# RFC 002: `require-root-error-boundary`

**Status:** Accepted  
**Decision date:** 2026-09-22  
**Scope:** The configured React Router framework root route  
**Configuration:** `recommended` as `error`

The compatibility target is the React Router 8.4.x framework API and the
maintained 7.18.x framework line recorded in
[`docs/compatibility.md`](../compatibility.md).

## Problem

An exception from a route API must still render a useful document. A missing
root boundary leaves the application without a final route-level error UI.

## Evidence and decision

The official [error boundary guide](https://reactrouter.com/how-to/error-boundary)
says that route modules catch errors with the closest `ErrorBoundary` and that
all applications should at minimum export a root error boundary. The plugin
enforces that documented minimum as a project policy and does not prescribe the
error UI itself.

## Contract

- Inspect only the configured root candidate, `app/root.*` by default.
- Recognize a named `ErrorBoundary` declaration, export list, and safe local
  re-export.
- Respect `rootRoute` and `appDirectory` settings for custom layouts and
  monorepos.
- Do not require a hook, prop shape, status handling, or particular markup.
- Do not autofix an application-specific error screen.

Incorrect:

```tsx
export default function Root() {
  return <Outlet />;
}
```

Correct:

```tsx
export function ErrorBoundary() {
  return <h1>Something went wrong</h1>;
}

export default function Root() {
  return <Outlet />;
}
```

## Diagnostic and tests

The diagnostic is attached to the root file and states that the root should
export an `ErrorBoundary`; it has no autofix because the error UI is
application-specific. The rule page is
[`docs/rules/require-root-error-boundary.md`](../rules/require-root-error-boundary.md),
and the focused cases are in
[`tests/rules/require-root-error-boundary.test.ts`](../../tests/rules/require-root-error-boundary.test.ts).

## Limitations and tests

The rule cannot prove that an error boundary is accessible, safe, or complete.
It intentionally skips non-root route modules; `require-route-error-boundary`
is a separate policy. Tests cover JavaScript and TypeScript roots, aliases,
re-exports, custom root settings, and unrelated files. The Shopify fixture's
missing root boundary was an actionable finding, not a false positive.
