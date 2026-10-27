# consistent-route-module-extension

Enforce a deliberate extension style for static route-module paths in a route
config. The rule is opt-in because extension style is a repository preference.

```js
"react-router/consistent-route-module-extension": [
  "warn",
  { mode: "always", extension: ".tsx" },
]
```

`mode: "never"` requires extensionless paths. Dynamic module expressions are
skipped. The rule does not change paths automatically because the selected
extension is a project convention.

The rule is listed in `strict` but produces no reports until `mode` is set.
With `mode: "always"` and no `extension`, any extension in
`settings.reactRouter.extensions` is accepted. This rule inspects the current
route-config file only; it does not follow imported fragments.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/routes.ts).
