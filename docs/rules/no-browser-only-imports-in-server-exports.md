# no-browser-only-imports-in-server-exports

Disallow explicit `client-only`, `browser-only`, `.client`, or configured
browser-only imports reached by `loader`, `action`, server `middleware`, or
`headers` exports.

```ts
import widget from "./widget.client";

export function loader() {
  return widget;
}
```

The rule only follows direct imports used by the server export in the current
file. It does not infer browser usage from ordinary web-standard `Request` or
`Response` APIs, and it skips type-only imports. Use `allow` or
`browserOnlyPackages` for an integration with a documented dual-runtime API.
