# no-orphan-route-modules

Find files matched by `routeModuleFiles` that are not referenced by a static
route graph. Run it on configured route files in `strict` or a project policy
override to catch abandoned pages after a refactor.

The analyzer follows relative route-config fragments inside the project root,
with cycle and depth limits. An incomplete, dynamic, cyclic, or malformed graph
skips orphan detection. Configured roots are excluded. Tests, helpers, and
convention-based modules are not automatically excluded when they match
`routeModuleFiles`; use `allowFiles` or `ignore` for those files.

The rule runs on the configured route-config entry file and reports there. It
walks the working directory, excluding `node_modules`, `.git`, `dist`, and
`coverage`, then applies the configured file patterns. Keep those patterns
narrow in large repositories.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/start/framework/routing).
