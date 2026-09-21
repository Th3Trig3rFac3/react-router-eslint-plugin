# no-conflicting-route-exports

In React Server Components mode, report route modules that export both sides of
a client/server pair. The rule covers:

- `default` and `ServerComponent`;
- `ErrorBoundary` and `ServerErrorBoundary`;
- `Layout` and `ServerLayout`;
- `HydrateFallback` and `ServerHydrateFallback`.

The rule is disabled by default because these APIs are experimental. Enable the
opt-in preset when the application uses RSC:

```js
import reactRouter from "eslint-plugin-react-router";

export default [reactRouter.configs.rsc];
```

Incorrect in that preset:

```tsx
export default function Product() {
  return <div />;
}

export function ServerComponent() {
  return <div />;
}
```

The rule skips modules containing `export *`, since their complete export set
cannot be known without analyzing another module.
