# valid-route-module-path

Require static route-module paths in `routes.ts` to resolve to files.

The rule recognizes `route`, `index`, `layout`, and statically understandable
helpers created by `relative()` from `@react-router/dev/routes`. Paths are
resolved relative to the configured React Router app directory, as React Router
does. Extensionless paths are checked with the supported JavaScript and
TypeScript extensions.

Dynamic expressions and custom route-builder wrappers are skipped because the
plugin never executes route configuration code.

Incorrect:

```ts
import { route } from "@react-router/dev/routes";

export default [route("settings", "./settings-page.tsx")];
```

Correct:

```ts
import { route } from "@react-router/dev/routes";

export default [route("settings", "./settings.tsx")];
```

The report includes the attempted candidate paths. There is no autofix or
editor suggestion.

For helper calls in the linted config, `extensions` overrides shared extension
resolution; `checkExtensions` is accepted as an alias. Imported fragments use
`settings.reactRouter.extensions`, so prefer that setting for a consistent
project policy. The shared graph follows safe relative fragments and checks
their static module paths without executing them.

## Configuration and references

Presets: `recommended` (`error`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/routes.ts).
