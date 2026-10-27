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

The rule follows same-file top-level bindings reachable from server exports,
including local helper chains. Imports without bindings are checked whenever
server exports are present. Sources containing `/client` are also treated as
browser-only, so review that naming heuristic for dual-runtime packages.

It does not inspect imported implementations or infer browser usage from
ordinary `Request` or `Response` APIs. Whole `import type` declarations are
skipped. `allow` exempts exact module specifiers; `browserOnlyPackages` adds
exact specifiers to the restricted set. Binding tracing uses identifier names
and does not fully resolve lexical shadowing.

## Configuration and references

Presets: `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
