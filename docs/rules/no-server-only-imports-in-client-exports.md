# no-server-only-imports-in-client-exports

Disallow Node built-ins and explicit `server-only`, `.server`, or configured
server-only imports used by a default component, `clientLoader`, `clientAction`,
`clientMiddleware`, or `HydrateFallback`.

The rule follows same-file top-level bindings, including helper chains. Imports
without bindings are checked whenever client exports are present. Whole
`import type` declarations and imports unused by the inspected client bindings
are skipped. Sources containing `/server` are also treated as server-only.

`allow` exempts exact module specifiers; `serverOnlyPackages` adds exact
specifiers to the restricted set. Node detection uses a maintained subset of
built-ins, not the complete Node module registry. The rule does not inspect
imported implementations, fully resolve lexical shadowing, or recursively
bundle modules; framework build checks remain authoritative for complex graphs.

## Configuration and references

Presets: `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
