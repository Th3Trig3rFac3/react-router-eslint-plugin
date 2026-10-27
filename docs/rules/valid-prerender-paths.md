# valid-prerender-paths

Require literal `prerender` paths in `react-router.config.ts` to avoid unresolved
parameters and, when supplied, to match configured route patterns.

```ts
export default {
  prerender: ["/docs", "/teams/acme"],
};
```

The object form React Router uses for concurrency is also supported when its
`paths` value is a static array:

```ts
export default {
  prerender: { paths: ["/docs", "/teams/acme"], concurrency: 4 },
};
```

Function-valued prerender configuration, dynamic arrays, spreads, and computed
properties are skipped. Pass `routePaths` for a project graph that is not
inferred automatically, or use `settings.reactRouter.routePaths`. Use `allow`
for exact path exceptions. Without route patterns, unresolved `:params` and
splats are still reported; concrete route membership is not checked. Only the
default-exported framework config (including simple local aliases) is checked.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/framework-conventions/react-router.config.ts).
