# no-conflicting-route-paths

Report exact duplicate sibling paths in a static route configuration. The rule
also expands literal `prefix()` calls and treats paths as case-insensitive when
their `caseSensitive` setting is omitted or `false`.

Incorrect:

```ts
import { prefix, route } from "@react-router/dev/routes";

export default [
  ...prefix("admin", [route("users", "./users.tsx")]),
  ...prefix("admin", [route("users", "./other-users.tsx")]),
];
```

The rule focuses on exact static duplicates. It does not rank patterns such as
`:id` and `new`, because React Router can resolve those patterns deliberately.
Pathless layout entries are not reported as conflicts. The shared project graph
includes statically analyzable relative route-config fragments inside the
project boundary. Reports from a fragment are attached to its owning import in
the linted route config. Dynamic or unresolved entries remain unknown. Paths
with different `caseSensitive` values are compared in separate groups.

## Configuration and references

Presets: `recommended` (`error`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/routes.ts).
