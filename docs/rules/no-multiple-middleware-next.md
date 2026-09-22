# no-multiple-middleware-next

Disallow two unconditional `next()` calls in one `middleware` or
`clientMiddleware` function. React Router allows one downstream continuation per
middleware invocation; a second call throws at runtime.

```ts
export const middleware = async ({}, next) => {
  await next();
  await next(); // report
};
```

Branches, loops, callbacks, aliases, and computed calls are skipped when the
execution count is uncertain. The rule has no autofix because the correct
ordering and response policy are application-specific.
