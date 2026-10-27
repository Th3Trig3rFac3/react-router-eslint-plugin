# no-duplicate-route-ids

Disallow repeated explicit `id` values in statically analyzable route config
entries. React Router route IDs are used by route lookup and generated types,
so duplicate IDs make those references ambiguous.

Incorrect:

```ts
export default [
  { id: "settings", path: "settings", file: "./settings.tsx" },
  { id: "settings", path: "preferences", file: "./preferences.tsx" },
];
```

Dynamic IDs and dynamic route entries are skipped because their value cannot be
proved without executing application code. The shared project graph follows
static relative route-config fragments within the project boundary, so
duplicates can be detected across files. Diagnostics from a fragment are
attached to its owning import in the linted route config. Generated IDs are
not checked.

## Configuration and references

Presets: `recommended` (`error`), `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/routes.ts).
