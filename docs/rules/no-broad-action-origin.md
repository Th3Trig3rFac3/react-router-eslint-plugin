# no-broad-action-origin

Disallow wildcard entries in the statically visible `allowedActionOrigins`
array in the default export of `react-router.config.ts`. React Router accepts
glob patterns for these origins; this rule flags any literal entry containing
`*` for explicit review.

```ts
export default {
  allowedActionOrigins: ["example.com", "*.example.com"],
};
```

The rule reports `*`, `*.example.com`, `**.example.com`, and other literal
patterns containing `*`. It follows simple top-level `const` aliases, including
the config object and the origins array. Standalone named exports, dynamic
expressions, spreads, and computed properties are not treated as configuration.
Use `allow` for a deliberate exception and document why it is safe.
