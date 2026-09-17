# resource-route-returns-response

Require explicitly scoped resource-route loaders/actions to return or throw a
`Response` on every statically understood path.

This rule is intentionally not part of `recommended`. React Router supports
`data()` for resource routes consumed through fetchers and forms, while
externally consumed resources should generally return a `Response`.

Enable it only for the resource files that have an HTTP response contract:

```js
{
  files: ["app/routes/api/**/*.{ts,tsx}"],
  rules: {
    "react-router/resource-route-returns-response": ["error", {
      allowData: false
    }]
  }
}
```

Recognized response-producing expressions include `new Response(...)`,
`redirect(...)`, `redirectDocument(...)`, and `replace(...)`. Set `allowData: true`
for a fetcher/form-facing route that intentionally returns `data(...)`.

Complex indirect values are reported conservatively; the rule never imports or
executes the handler.
