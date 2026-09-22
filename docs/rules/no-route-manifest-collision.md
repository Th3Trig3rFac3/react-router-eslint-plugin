# no-route-manifest-collision

Disallow a literal `manifestPath` in `react-router.config.ts` when it is also a
configured application or resource route path.

```js
"react-router/no-route-manifest-collision": [
  "warn",
  { routePaths: ["/__manifest"] },
]
```

The rule requires an explicit route-path list because arbitrary generated route
graphs cannot be inferred from one config file. Function-valued settings are
skipped; use `allow` for a reviewed exception.
