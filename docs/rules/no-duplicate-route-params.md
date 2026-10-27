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
patterns are skipped. The shared project graph includes statically analyzable
relative fragments within the project boundary, carrying known parent paths
into child entries. Diagnostics from imported fragments are attached to their
owning import in the linted route config.

## Configuration and references

Presets: `recommended` (`error`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/routes.ts).
