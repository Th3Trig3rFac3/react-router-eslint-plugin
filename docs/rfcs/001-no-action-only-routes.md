# RFC 001: `no-action-only-routes`

**Status:** Accepted  
**Decision date:** 2026-09-22  
**Scope:** React Router framework route modules; server and client actions  
**Configuration:** `recommended` as `warn`

The compatibility target is the React Router 8.4.x framework API and the
maintained 7.18.x framework line recorded in
[`docs/compatibility.md`](../compatibility.md).

## Problem

An action handles non-GET submissions. A route with only an `action` or
`clientAction` has no document component and no loader for a refreshed GET. That
shape is often an accidental UI route, but it is also the documented shape of a
resource route used for a webhook or another POST endpoint.

## Evidence and decision

React Router documents that a resource route has a loader or action without a
default component, and that GET uses `loader` while other methods use `action`:
[resource routes](https://reactrouter.com/how-to/resource-routes). The rule
therefore reports only a warning. It cannot infer whether an action-only module
is an intentional resource endpoint, so `allowFiles` is the required escape
hatch for known endpoints. `allow` remains an alias for compatibility.

## Contract

- Recognize `action` and `clientAction`, including aliases and export lists.
- Do not report when the module also exports `loader`, `clientLoader`, or a
  default component.
- Report on the action export when none of those UI/GET signals exists.
- Match `allowFiles` against the project-relative filename.
- Do not execute the route or infer a redirect target.
- Do not autofix; the remedy requires application intent.

Incorrect for a UI route:

```tsx
export async function action() {
  return saveSettings();
}
```

Correct when the route renders a page:

```tsx
export async function loader() {
  return getSettings();
}

export async function action() {
  return saveSettings();
}

export default function Settings({ loaderData }) {
  return <form>{loaderData.name}</form>;
}
```

Correct when the endpoint is intentionally POST-only:

```tsx
// app/routes/webhooks/orders.ts
export async function action({ request }) {
  return receiveWebhook(request);
}
```

```js
rules: {
  "react-router/no-action-only-routes": ["warn", {
    allowFiles: ["app/routes/webhooks/**/*"],
  }],
}
```

## Diagnostic and tests

The diagnostic is attached to the action export and explains that a document
GET/refresh cannot render the route. It offers no autofix or suggestion because
the redirect target or UI component requires application intent. The rule page
is [`docs/rules/no-action-only-routes.md`](../rules/no-action-only-routes.md),
and the focused cases are in
[`tests/rules/no-action-only-routes.test.ts`](../../tests/rules/no-action-only-routes.test.ts).

## Limitations and tests

Dynamic exports, runtime route registration, and whether a POST endpoint is
reachable from a UI are outside static analysis. Tests cover direct and aliased
exports, `clientAction`, defaults, loaders, re-exports, and allowed files. The
three application runs found only intentional action-only resources after the
route-module classifier excluded `.server` and `+` support modules.
