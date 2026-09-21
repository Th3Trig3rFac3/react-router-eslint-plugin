# require-hydrate-fallback

Warn when a route exports a `clientLoader`, sets its `hydrate` property to
`true`, and exports no `HydrateFallback`. This is an optional UI policy for
routes that need a loading state while hydration runs, not a universal React
Router validity requirement.

When client-loader hydration is forced, React Router may wait for the client
loader before rendering the route component. A fallback gives the route a
useful loading UI during that interval. An application may intentionally omit
the fallback when the server-rendered component and the client loader are
designed to produce matching data during hydration, such as a cache-priming
pattern. Use `allowFiles` for those files.

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
Intentional SSR or cache-priming exceptions can use `allowFiles` (with `allow`
accepted as an alias). The diagnostic suggests adding a fallback or documenting
the intentional exception.
