# safe-should-revalidate

Warn about a statically obvious `shouldRevalidate` implementation that always
returns `false`. This can prevent route data from being refreshed after an
action or navigation and leave the UI stale.

Incorrect:

```tsx
export function shouldRevalidate() {
  return false;
}
```

Prefer preserving React Router's default decision unless the route has a
deliberate alternative policy:

```tsx
export function shouldRevalidate({ defaultShouldRevalidate }) {
  return defaultShouldRevalidate;
}
```

The rule intentionally checks only a single literal `return false` (including
an expression-bodied arrow). Complex control flow is skipped. Intentional
exceptions can use `allowFiles` (with `allow` accepted as an alias).

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
