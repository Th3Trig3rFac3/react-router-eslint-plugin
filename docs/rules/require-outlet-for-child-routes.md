# require-outlet-for-child-routes

Warn when a statically known parent route has children but its inspected route
component contains neither `<Outlet />` nor `useOutlet()`.

The rule has two analysis paths. In a module selected by `files`, it inspects
the default component for identifiers named `Outlet` or calls named
`useOutlet`. `allowFiles` exempts files from this path. In a route config, it
reads resolved parent modules with children and searches their source text for
`<Outlet` or `useOutlet(`, including parents found through static fragments.

Use `wrapperComponents: ["PageLayout"]` for wrappers that render an outlet.
Wrapper names are honored by both paths. The rule does not inspect imported
wrapper implementations, and `allowFiles` does not exempt the route-config
path. Comments or unrelated text can satisfy that path's source search; missing
or unreadable modules are skipped. Use a targeted disable in the route config
for an intentional parent that this heuristic cannot model.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/route-module).
