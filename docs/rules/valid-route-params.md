# valid-route-params

Require direct `params` reads in loaders and actions to match a configured route
path. This catches spelling differences such as `:teamId` versus
`params.teamID`.

```js
"react-router/valid-route-params": [
  "warn",
  { routePath: "/teams/:teamId" },
]
```

Parent paths can be supplied with `parentPaths`, or globally through
`settings.reactRouter.routePaths`. Computed property names, dynamic route
builders, and modules referenced by incompatible route entries are skipped.
