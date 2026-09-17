# no-invalid-route-exports

Disallow misspelled or unsupported exports in recognized React Router route
modules.

The allowlist follows the documented framework route-module exports, including
`default`, middleware, loaders/actions, boundaries, headers, links, metadata,
`handle`, and `shouldRevalidate`. `unstable_*` names are reserved for future
React Router APIs. Use the `allow` option for a known integration extension.

```js
"react-router/no-invalid-route-exports": ["error", {
  "allow": ["customRouteMetadata"]
}]
```

The rule skips `export *` modules because their complete export set cannot be
known without executing or deeply analyzing another module.
