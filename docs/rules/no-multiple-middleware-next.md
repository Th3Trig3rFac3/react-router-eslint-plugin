# no-multiple-middleware-next

Disallow two unconditional `next()` calls in one `middleware` or
`clientMiddleware` function. React Router allows one downstream continuation per
middleware invocation; a second call throws at runtime.

```ts
export const middleware = [
  async ({}, next) => {
    await next();
    await next(); // report
  },
];
```

Branches, loops, callbacks, aliases, and computed calls are skipped when the
execution count is uncertain. The rule has no autofix because the correct
ordering and response policy are application-specific.

Inline middleware arrays and locally declared function references are
recognized. Although the schema accepts `allow`, the implementation does not
apply it; use a targeted ESLint disable for an intentional exception.

## Configuration and references

Presets: `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/middleware).
