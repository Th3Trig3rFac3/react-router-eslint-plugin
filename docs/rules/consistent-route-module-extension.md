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
