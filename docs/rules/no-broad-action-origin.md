# no-broad-action-origin

Disallow universal wildcard values in `allowedActionOrigins` inside
`react-router.config.ts`. A wildcard weakens the origin allowlist and should be
an explicit, reviewed security decision.

```ts
export default {
  allowedActionOrigins: ["https://example.com"],
};
```

The rule reports literal `*`, `*.example.test`, and `https://*` entries. Dynamic
configuration is skipped. Use `allow` for a deliberate exception and document
why it is safe.
