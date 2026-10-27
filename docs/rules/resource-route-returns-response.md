# resource-route-returns-response

Check syntactically recognized returns and throws in resource-route handlers
for a response-producing expression. It checks `loader`, `action`,
`clientLoader`, and `clientAction` in recognized modules without a default
component.

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

`files` optionally restricts project-relative filenames, and `allowFiles`
exempts matching files. Without `files`, every recognized resource module in
the ESLint scope is checked. The example above supplies scope through the flat
config's `files` instead. Both names are enabled by `all`; turn off the
`valid-resource-route` alias to avoid duplicate reports.

This is a syntax policy, not a control-flow proof. Returned identifiers,
custom response factories, `Response.json()`, and ordinary thrown errors can
report even when runtime behavior is intentional. A function with no return or
throw reports, but a conditional response return can pass even if another path
falls through. Nested functions are skipped, and re-exported handlers are not
followed. The rule never imports or executes the handler.

## Configuration and references

Presets: `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/resource-routes).
