# valid-route-config

Validate the statically understandable parts of a framework-mode `routes.ts`
file. The rule checks imported `route`, `index`, `layout`, `prefix`, and
`relative` helpers, as well as literal `RouteConfigEntry` objects.

Incorrect:

```ts
import { index, route } from "@react-router/dev/routes";

export default [
  index("./home.tsx", [route("nested", "./nested.tsx")]),
  route("settings", getFile()),
];
```

Correct:

```ts
import { index, route } from "@react-router/dev/routes";

export default [index("./home.tsx"), route("settings", "./settings.tsx")];
```

Dynamic route builders and unknown spreads are skipped. The rule never imports
or executes route configuration. Relative imports inside the project root are
parsed as route-config fragments with cycle/depth limits and cached by file
metadata; package imports and unresolved dynamic fragments remain unknown. It
is intended to complement TypeScript for JavaScript projects and malformed
generated configs.

## Configuration and references

Presets: `recommended` (`error`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/routes.ts).
