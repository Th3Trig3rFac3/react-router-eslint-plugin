# require-outlet-for-child-routes

Warn when a statically known parent route has children but its inspected route
component contains neither `<Outlet />` nor `useOutlet()`.

The rule can inspect the current module with `files`, or a route config can
inspect resolved local modules. Imported wrapper components, dynamic children,
and composition the rule cannot inspect are skipped. Use `allowFiles` for
intentional wrapper routes.
