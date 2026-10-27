# no-action-only-routes

Report when a route module exports `action` or `clientAction` without `loader`,
`clientLoader`, or a default route component. This is a warning in `recommended`
and an error in `strict`.

## Why

An action-only UI route cannot render a document `GET` request after a refresh.
Add a loader (often one that redirects to a valid page) or a default component.

Action-only resource endpoints such as webhooks can be intentional. Configure
their paths with `allowFiles`, or disable the rule for that specific module.

## Options

```js
{
  "allowFiles": ["app/routes/webhooks/**/*"]
}
```

`allow` is accepted as an alias for `allowFiles`.

## Examples

Incorrect:

```tsx
export async function action() {
  return new Response("ok");
}
```

Correct:

```tsx
import { redirect } from "react-router";

export async function loader() {
  return redirect("/dashboard");
}

export async function action() {
  return new Response("ok");
}
```

This rule does not autofix because the correct redirect target or component is
application-specific.

## Configuration and references

Presets: `recommended` (`warn`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
