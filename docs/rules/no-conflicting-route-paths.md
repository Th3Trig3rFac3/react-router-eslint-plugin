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
Pathless layout entries are not reported as conflicts.
