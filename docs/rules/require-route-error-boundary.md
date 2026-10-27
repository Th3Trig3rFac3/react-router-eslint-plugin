# require-route-error-boundary

Require `ErrorBoundary` only at explicitly configured application boundaries;
this rule does not impose a boundary on every route.

```js
"react-router/require-route-error-boundary": [
  "error",
  { files: ["app/routes/admin/layout.tsx"] },
]
```

Declarations, export lists, and named re-exports are accepted syntactically;
the re-exported implementation is not inspected. `export *` skips the missing
boundary report. Use `allowFiles` for a boundary supplied by another application
layer. The rule is inactive until its own `files` option is supplied; a
flat-config `files` selector alone does not activate it.

## Configuration and references

Presets: `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/error-boundary).
