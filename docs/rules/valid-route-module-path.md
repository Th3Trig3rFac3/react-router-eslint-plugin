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

The report includes the attempted candidate paths. A typo is not autofixed
unless a future version can identify one unambiguous replacement.
