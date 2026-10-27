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

Empty responses, `Response.json()`, and dynamic bodies are skipped. For a known
non-empty body, the header must be visible in an object literal or
`new Headers({ ... })`; unknown header objects can report even when they set a
content type at runtime. Header names are matched case-insensitively.

`handlers` defaults to `["loader", "action"]`; `allowFiles` exempts matching
files. The rule is present in `strict` but remains inactive until its own
`files` option is supplied. A flat-config `files` selector alone does not
activate it.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/resource-routes).
