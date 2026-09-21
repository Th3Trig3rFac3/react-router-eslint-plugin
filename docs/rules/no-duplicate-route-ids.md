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
proved without executing application code. Imported route-config fragments are
not merged into a project-wide graph yet, so this rule checks statically
analyzable entries in the file being linted.
