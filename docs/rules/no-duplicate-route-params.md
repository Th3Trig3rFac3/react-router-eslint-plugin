# no-duplicate-route-params

Report a route pattern that declares the same parameter name more than once.
The analysis includes parent route paths and static `prefix()` fragments.

Incorrect:

```ts
route("teams/:id/members/:id", "./member.tsx");
```

Use distinct names when both values are needed:

```ts
route("teams/:teamId/members/:memberId", "./member.tsx");
```

The rule recognizes dynamic parameters and splats. Dynamic or unresolved route
patterns are skipped. Imported route-config fragments are not merged into a
project-wide graph yet, so the rule checks the statically analyzable route tree
in the file being linted.
