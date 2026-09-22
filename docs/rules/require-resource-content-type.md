# require-resource-content-type

For explicitly scoped resource modules, require a `Content-Type` header when a
statically recognized `new Response()` has a non-empty literal, object, or array
body.

```js
"react-router/require-resource-content-type": [
  "warn",
  { files: ["app/routes/api/**/*"] },
]
```

Empty responses, `Response.json()`, dynamic bodies, and unknown header objects
are skipped. Header names are matched case-insensitively. The rule is a policy
check and is never enabled for every route by the shared configs without scope.
