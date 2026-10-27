# no-sensitive-error-output

Disallow raw `error.stack` and direct unknown-error rendering in configured
route error boundaries. Production error pages should expose a normalized public
message.

By default the rule checks the root route. Use `files` for additional boundary
modules and `allowFiles` for internal applications whose error policy is
deliberate. The current implementation matches identifiers named `error`,
`caughtError`, or `unknownError`: direct JSX interpolation and `.stack` reads
inside the boundary report, including reads behind development guards. It
does not prove whether the output reaches production or follow dynamic error
formatting. Use a targeted disable for reviewed development-only diagnostics;
this rule is not a general guarantee against information disclosure.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/how-to/error-boundary).
