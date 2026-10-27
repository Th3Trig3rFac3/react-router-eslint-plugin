# valid-route-module

Check that each statically resolved route-module path contains at least one
meaningful React Router route export. This is separate from
`valid-route-module-path`, which only checks that the file exists.

The rule reads source text without importing or executing it, follows local
route-config fragments, and skips missing or unreadable files and dynamic paths. It
recognizes component, loader/action, middleware, boundary, and documented
metadata exports.

A parse failure reports as a module without a recognized export. Type-only
exports, `export *`, and an RSC-only `ServerComponent` are not meaningful
exports for this rule's current table. Named re-exports are recognized by name
without inspecting their implementation. `allowFiles` exempts exact route
module specifiers (for example `"./routes/integration.tsx"`), not file globs.

## Configuration and references

Presets: `strict` (`error`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
