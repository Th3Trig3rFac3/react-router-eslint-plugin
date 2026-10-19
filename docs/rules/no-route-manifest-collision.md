# no-route-manifest-collision

Disallow a literal `routeDiscovery.manifestPath` in the default export of
`react-router.config.ts` when lazy discovery is enabled (or `mode` is omitted)
and the path is also a configured application or resource route path.

```js
"react-router/no-route-manifest-collision": [
  "warn",
  { routePaths: ["/__manifest"], resourcePaths: ["/download"] },
]
```

The rule requires an explicit route-path list because arbitrary generated route
graphs cannot be inferred from one config file. It also checks paths supplied
through `resourcePaths` or `settings.reactRouter.resourceRoutePaths`. Initial
discovery mode, dynamic values, and ambiguous objects are skipped. Use `allow`
for a reviewed exception.
