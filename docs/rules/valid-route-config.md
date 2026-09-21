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
or executes route configuration. Analysis is currently limited to the route
config file being linted; imported config fragments are not merged into a
project-wide graph yet. It is intended to complement TypeScript for JavaScript
projects and malformed generated configs.
