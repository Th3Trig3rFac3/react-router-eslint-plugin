# valid-prerender-paths

Require literal `prerender` paths in `react-router.config.ts` to avoid unresolved
parameters and, when supplied, to match configured route patterns.

```ts
export default {
  prerender: ["/docs", "/teams/acme"],
};
```

Function-valued prerender configuration and dynamic arrays are skipped. Pass
`routePaths` for a project graph that is not available in the same lint file,
and use `allow` for intentional generated paths.
