# splittable-route-module

Warn about top-level `let` and `var` state in a route module with client
exports. Mutable module state can couple client exports and prevent the route
module from being split into independent chunks.

The rule checks plain top-level `let` and `var` declarations outside an
`export` declaration, whose identifier names occur directly in an inspected
client export. `allow` lists
binding names, such as `allow: ["cache"]`, rather than module paths. Immutable
bindings, destructured declarations, helper-chain dependencies, and exported
variable declarations are outside this check.

This heuristic is not equivalent to the framework's `splitRouteModules:
"enforce"` build analysis. A warning does not prove that splitting fails, and a
clean lint run does not prove that the module can be split.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/explanation/code-splitting).
