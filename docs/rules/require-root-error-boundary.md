# require-root-error-boundary

Require the configured root route module to export `ErrorBoundary`.

## Why

React Router renders the closest route error boundary when route APIs throw.
The root boundary is the final fallback for errors that are not handled lower
in the route tree.

## Configuration

The default root candidate is `app/root.*`. Customize it with shared settings:

```js
settings: {
  reactRouter: {
    rootRoute: "packages/web/app/root.tsx",
  }
}
```

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
```

The rule does not generate an error UI because accessible error presentation is
application-specific.

Export declarations, aliases, and named re-exports are recognized syntactically;
the re-exported implementation is not inspected. `export *` skips the missing
boundary report because the export set is unknown. Changing `appDirectory`
alone does not change `rootRoute`; configure the root pattern explicitly.

## Configuration and references

Presets: `recommended` (`error`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/error-boundary).
