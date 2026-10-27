# return-server-middleware-response

Warn when server `middleware` calls `next()` and reaches the end of an obvious
straight-line path without returning the downstream response. Dropping that
response can lose status, headers, or body changes made by later handlers.

```ts
export const middleware = [
  async ({}, next) => {
    await next();
    // report: return the response or an intentional replacement
  },
];
```

`return await next()`, returning a saved response, and client middleware are
not reported. Only direct top-level calls and variable initializers are
tracked. A top-level return of any non-`undefined` expression suppresses the
report; the rule does not prove that expression is a `Response` or analyze all
branches. Conditional returns do not necessarily suppress a report for a
top-level call.

Although the schema accepts `allow`, the implementation does not apply it;
use a targeted ESLint disable for an intentional exception.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/middleware).
