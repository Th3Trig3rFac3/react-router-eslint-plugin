# require-hydrate-fallback

Warn when a route exports a `clientLoader`, sets its `hydrate` property to
`true`, and exports no `HydrateFallback`.

When client-loader hydration is forced, React Router waits for the client
loader before rendering the route component. A fallback gives the route a
useful loading UI during that interval.

Incorrect:

```tsx
export async function clientLoader() {
  return getClientData();
}

clientLoader.hydrate = true as const;
```

Correct:

```tsx
export async function clientLoader() {
  return getClientData();
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <p>Loading...</p>;
}
```

The rule is enabled as a warning in `strict`. Dynamic assignments are skipped.
Intentional exceptions can use `allowFiles` (with `allow` accepted as an alias).
