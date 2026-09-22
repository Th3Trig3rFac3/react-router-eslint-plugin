# no-orphan-route-modules

Find files matched by `routeModuleFiles` that are not referenced by a static
route graph. Run it on configured route files in `strict` or a project policy
override to catch abandoned pages after a refactor.

The analyzer follows relative route-config fragments inside the project root,
with cycle and depth limits. Dynamic spreads, unresolved imports, test files,
and root routes are skipped rather than guessed. Use `allowFiles` or `ignore`
for convention-based modules and fixtures.
