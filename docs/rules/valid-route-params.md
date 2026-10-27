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

`routePath` accepts a string or an array; it falls back to
`settings.reactRouter.routePaths`. `parentPaths` adds parameter names from
explicit parent patterns. Names from all supplied paths are combined, so use a
file-scoped override to avoid admitting parameters from unrelated routes.

The rule checks `loader`, `action`, `clientLoader`, and `clientAction`, including
direct property reads and parameter destructuring. It does not infer a module's
path or parent parameters from the project graph. Computed member reads and
nested functions are skipped. With no configured paths, the rule is inactive.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
