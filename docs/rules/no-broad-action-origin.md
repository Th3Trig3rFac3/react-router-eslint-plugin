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

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/react-router.config.ts).
