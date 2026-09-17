# no-action-only-routes

Warn when a route module exports `action` or `clientAction` without a loader or
default route component.

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
export async function loader() {
  return redirect("/dashboard");
}

export async function action() {
  return new Response("ok");
}
```

This rule does not autofix because the correct redirect target or component is
application-specific.
