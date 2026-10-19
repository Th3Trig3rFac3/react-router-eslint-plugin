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
available in the same lint file, and use `allow` for intentional generated
paths. The rule only checks paths when they are statically known.
