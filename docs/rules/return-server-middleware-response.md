# return-server-middleware-response

Warn when server `middleware` calls `next()` and reaches the end of an obvious
straight-line path without returning the downstream response. Dropping that
response can lose status, headers, or body changes made by later handlers.

```ts
export const middleware = async ({}, next) => {
  await next();
  // report: return the response or an intentional replacement
};
```

`return await next()`, returning a saved response, client middleware, branches,
and complex control flow are not reported by this conservative rule.
