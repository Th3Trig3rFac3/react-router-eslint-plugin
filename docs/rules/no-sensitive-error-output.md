# no-sensitive-error-output

Disallow raw `error.stack` and direct unknown-error rendering in configured
route error boundaries. Production error pages should expose a normalized public
message, with diagnostics guarded by an explicit development check.

By default the rule checks the root route. Use `files` for additional boundary
modules and `allowFiles` for internal applications whose error policy is
deliberate. It reports only obvious syntax and skips dynamic error formatting.
