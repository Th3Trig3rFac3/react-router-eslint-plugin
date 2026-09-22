# no-server-only-imports-in-client-exports

Disallow Node built-ins and explicit `server-only`, `.server`, or configured
server-only imports used by a default component, `clientLoader`, `clientAction`,
`clientMiddleware`, or `HydrateFallback`.

The rule follows direct bindings in the current file and skips type-only or
unused server imports. It does not execute or recursively bundle application
modules; build-time dependency diagnostics remain authoritative for complex
graphs. Use `allow` or `serverOnlyPackages` for documented dual-runtime code.
