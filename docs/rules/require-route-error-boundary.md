# require-route-error-boundary

Require `ErrorBoundary` only at explicitly configured application boundaries;
this rule does not impose a boundary on every route.

```js
"react-router/require-route-error-boundary": [
  "error",
  { files: ["app/routes/admin/layout.tsx"] },
]
```

Declarations, export lists, and statically resolvable re-exports are accepted.
Use `allowFiles` for a boundary supplied by an inspected wrapper or another
application layer.
