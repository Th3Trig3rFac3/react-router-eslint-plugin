# MVP semantics validation

**Verified:** 2026-09-22  
**Plugin revision:** `30ed3569f57b7296a3e5874f5b90a171caf0a22a` plus the
working-tree classifier and export fixes recorded in this report  
**Runner:** `scripts/validate-mvp-apps.ts` with the repository's installed
ESLint 10.11.0 and TypeScript parser

This report closes the Phase 0 evidence work. It separates behavior required by
React Router from policy chosen by this plugin. Static linting never installs,
imports, or executes an application; it reads each app's source and manifest
files and then lints the complete `app/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`
scope.

## Official framework evidence

The sources below were read on 2026-09-22. The version selector in the route
module guide showed React Router 8.4.0 and the maintained 7.18.x documentation
line at that time.

| MVP claim                                                                                                                                             | Official evidence                                                                                                                                       | Plugin decision                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A route module may export a component, loader/action, metadata, boundaries, and middleware; a default component is the document UI.                   | [Route modules](https://reactrouter.com/start/framework/route-module)                                                                                   | `no-action-only-routes` treats a default export, `loader`, or `clientLoader` as a GET/UI signal. `no-invalid-route-exports` keeps a versioned allowlist.                                |
| Resource routes intentionally omit a default component; GET uses `loader` and non-GET requests use `action`.                                          | [Resource routes](https://reactrouter.com/how-to/resource-routes)                                                                                       | Action-only modules are a warning with an explicit `allowFiles` opt-out. This is a plugin policy for likely accidental UI routes, not a claim that every action-only module is invalid. |
| A route entry has a URL pattern and a module path. The framework provides `route`, `index`, `layout`, `prefix`, `relative`, and `flatRoutes` helpers. | [Routing](https://reactrouter.com/start/framework/routing) and [`routes.ts`](https://reactrouter.com/api/framework-conventions/routes.ts)               | `valid-route-module-path` checks only static module arguments and skips dynamic wrappers or computed paths.                                                                             |
| Route errors use the closest `ErrorBoundary`; the root boundary is the documented minimum application fallback.                                       | [Error boundaries](https://reactrouter.com/how-to/error-boundary)                                                                                       | `require-root-error-boundary` enforces the root boundary as the recommended project policy without prescribing its UI.                                                                  |
| `.server` and `.client` files are graph support modules, not route-module names.                                                                      | [Server-only modules](https://reactrouter.com/api/framework-conventions/server-modules)                                                                 | The shared classifier excludes `.server`, `.client`, and `+`-prefixed colocated support files from broad `app/routes/**/*` matching.                                                    |
| Framework-managed exports affect HMR; RSC adds client/server component and boundary variants.                                                         | [HMR](https://reactrouter.com/explanation/hot-module-replacement) and [React Server Components](https://reactrouter.com/how-to/react-server-components) | `no-invalid-route-exports` remains in `strict`, allows official variants including `ServerHydrateFallback`, and requires `allow` for application helpers.                               |

These references support the framework semantics. Whether a project chooses to
allow a POST-only endpoint, require a custom root boundary, or reject an
application helper export is explicitly documented as plugin policy in the
[MVP RFCs](../rfcs/README.md).

## Representative applications

All repositories were cloned into a temporary validation directory and linted
at the commit shown below. The working tree was clean before analysis. The
official starter's wildcard dependency declarations resolved to React Router
8.4.0 in its lockfile; the other two fixtures provide exact previous-major
pins.

| Application               | Repository and commit                                                                                                                                   | React Router dependency                                                                       | Why it represents a distinct case                                                                                                                                                                            | Files in `app/` |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------: |
| Official default template | [`remix-run/react-router-templates`](https://github.com/remix-run/react-router-templates), `067adb378a00a4c2ceb71934d5e8901d0e87c256`                   | 8.4.0 resolved from the lockfile (`react-router` and `@react-router/dev` are declared as `*`) | Official generated framework app with static `routes.ts`, an index route, a root `ErrorBoundary`, and `Layout`.                                                                                              |               4 |
| Epic Stack                | [`epicweb-dev/epic-stack`](https://github.com/epicweb-dev/epic-stack), `8473afd804b66dba6a23f317908dc35d1535e90d`                                       | 7.16.0 in `package-lock.json`                                                                 | Independently maintained full-stack app with loaders/actions, nested/index/layout routes, resource endpoints, a generated `react-router-auto-routes()` wrapper, and colocated `.server`/`+` support modules. |             119 |
| Shopify app template      | [`Shopify/shopify-app-template-react-router`](https://github.com/Shopify/shopify-app-template-react-router), `e548c959eb00460f7141d42bd694cd50769c5e3e` | 7.18.2 exact in `package.json`                                                                | Independently maintained integration app using `@react-router/fs-routes`/`flatRoutes`, nested route directories, and intentional webhook action-only endpoints.                                              |              15 |

The Epic Stack and Shopify repositories are independent public applications,
so the three runs are not copies of one generated template. Epic Stack and the
Shopify template carry MIT `LICENSE.md` files; the official template checkout
has no license file in the cloned repository root. The fixtures were used
read-only for validation and no application code is copied into this
repository.

## Reproducible command and settings

From a clean checkout, build the package first so the runner loads the same
`dist/index.js` entry that is included in the tarball. Then use the local `tsx`
binary and replace the three paths with the checked-out directories:

```text
pnpm run build
node_modules/.bin/tsx scripts/validate-mvp-apps.ts \
  --app official-default-template=/path/to/react-router-templates/default \
  --app epic-stack=/path/to/epic-stack \
  --allow-action-only epic-stack=app/routes/admin/cache/sqlite.tsx,app/routes/resources/theme-switch.tsx \
  --allow-invalid epic-stack=ThemeSwitch,useOptimisticThemeMode,useTheme,useOptionalTheme,newEmailAddressSessionKey,twoFAVerifyVerificationType,twoFAVerificationType,BreadcrumbHandle,DeleteNote,providerIdKey,prefilledProfileKey,onboardingEmailSessionKey,resetPasswordUsernameSessionKey,SignupEmail,codeQueryParam,targetQueryParam,typeQueryParam,redirectToQueryParam,VerifySchema \
  --app shopify-template=/path/to/shopify-app-template-react-router \
  --allow-action-only shopify-template=app/routes/webhooks.app.scopes_update.tsx,app/routes/webhooks.app.uninstalled.tsx
```

The runner uses the default settings that are part of the package contract:

```text
appDirectory: app
rootRoute: app/root.*
routeConfig: app/routes.ts, app/routes.js
routeModuleFiles: app/root.*, app/routes/**/*
extensions: .js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, .cts
```

When `dist/index.js` is unavailable during local development, the runner falls
back to the source entry; the recorded run used the built package entry. Each
app is linted twice: `require-root-error-boundary`,
`valid-route-module-path`, and `no-action-only-routes` together, followed by
`no-invalid-route-exports` alone. The second run keeps the strict export policy
from obscuring the recommended-rule results. The JSON output records the
source glob, effective settings, file count, fatal count, and every diagnostic.

## Run results

The unfiltered baseline was run first so that every report could be classified.
The final run repeated the same revision and settings with only the intentional
exceptions in the command above.

| Application               | Source files | Skipped files | Elapsed (ms) | Baseline recommended (`errors / warnings / fatal`) | Baseline invalid-export errors | Final recommended (`errors / warnings / fatal`) | Final invalid-export errors | Crashes |
| ------------------------- | -----------: | ------------: | -----------: | -------------------------------------------------: | -----------------------------: | ----------------------------------------------: | --------------------------: | ------: |
| Official default template |            4 |             0 |          963 |                                          0 / 0 / 0 |                              0 |                                       0 / 0 / 0 |                           0 |       0 |
| Epic Stack                |          119 |             0 |         5370 |                                          0 / 2 / 0 |                             19 |                                       0 / 0 / 0 |                           0 |       0 |
| Shopify app template      |           15 |             0 |          433 |                                          1 / 2 / 0 |                              0 |                                       1 / 0 / 0 |                           0 |       0 |

The one final diagnostic is the Shopify template's missing
`app/root.tsx` `ErrorBoundary`. It is the actionable finding the rule is meant
to report, not an unresolved false positive. The two final resource warnings
from the baseline are suppressed by the documented `allowFiles` entries; the
strict helper exports are suppressed by the documented `allow` list.

## Coverage across the applications

| Behavior                          | Official starter                | Epic Stack                                                                  | Shopify template                                              | Supplemental unit fixture                                                                                                                            |
| --------------------------------- | ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `ErrorBoundary`              | Present and accepted            | Present and accepted                                                        | Missing; actionable diagnostic                                | Missing, alias, re-export, and custom-root cases in [`require-root-error-boundary.test.ts`](../../tests/rules/require-root-error-boundary.test.ts)   |
| Server/client support modules     | No support modules              | `.server` files and `+shared` helpers observed and excluded                 | `error.server.tsx` observed and excluded                      | `.server`, `.client`, and `+` paths in [`no-invalid-route-exports.test.ts`](../../tests/rules/no-invalid-route-exports.test.ts)                      |
| Intentional action-only endpoints | None                            | `admin/cache/sqlite.tsx` and `resources/theme-switch.tsx`                   | Two Shopify webhook routes                                    | Action-only UI, client action, aliases, and `allowFiles` cases in [`no-action-only-routes.test.ts`](../../tests/rules/no-action-only-routes.test.ts) |
| Resource routes                   | None                            | `resources/*` loaders/actions and theme endpoint                            | Webhook action endpoints                                      | Resource-route examples in the rule page and RFC 001                                                                                                 |
| Nested/layout/index routes        | One index route and root layout | Extensive nested, pathless layout, splat, and index routes                  | Nested directory routes and route files                       | Route helper/index/layout cases in [`valid-route-module-path.test.ts`](../../tests/rules/valid-route-module-path.test.ts)                            |
| Aliases and re-exports            | Type import and named exports   | Application aliases and helpers                                             | Route modules with framework imports                          | Export normalization and re-export tests                                                                                                             |
| Custom route path resolution      | Static `app/routes.ts`          | `react-router-auto-routes()` is a dynamic wrapper and intentionally skipped | `flatRoutes()` is a dynamic wrapper and intentionally skipped | `relative()`, imported fragments, extensionless paths, and project-boundary cases                                                                    |

The dynamic-wrapper cases are recorded as skipped unknowns, not as evidence
that the plugin can reproduce a file-route generator. The focused fixtures
cover the corresponding static helper contracts and controlled failure cases.

## Diagnostic dispositions

### Recommended rules

- **Epic Stack, `app/routes/admin/cache/sqlite.tsx`:** intentional action-only
  SQLite resource endpoint; allowed with `allowFiles`.
- **Epic Stack, `app/routes/resources/theme-switch.tsx`:** intentional
  action-only resource endpoint used by the theme switcher; allowed with
  `allowFiles`.
- **Shopify,
  `app/routes/webhooks.app.scopes_update.tsx`:** intentional webhook action;
  allowed with `allowFiles`.
- **Shopify,
  `app/routes/webhooks.app.uninstalled.tsx`:** intentional webhook action;
  allowed with `allowFiles`.
- **Shopify, `app/root.tsx`:** no boundary was present; retained as an
  actionable `require-root-error-boundary` error.

### Strict export rule

The 19 Epic Stack baseline reports were all named application helpers exported
from otherwise valid route modules. They are not React Router exports and are
therefore policy findings, not framework-semantics false positives. The final
run documents them through `allow`:

| File                                                 | Allowed names                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `app/routes/resources/theme-switch.tsx`              | `ThemeSwitch`, `useOptimisticThemeMode`, `useTheme`, `useOptionalTheme`                        |
| `app/routes/settings/profile/change-email.tsx`       | `newEmailAddressSessionKey`                                                                    |
| `app/routes/settings/profile/two-factor/verify.tsx`  | `twoFAVerifyVerificationType`                                                                  |
| `app/routes/settings/profile/two-factor/_layout.tsx` | `twoFAVerificationType`, `BreadcrumbHandle`                                                    |
| `app/routes/users/$username/notes/$noteId.tsx`       | `DeleteNote`                                                                                   |
| `app/routes/_auth/onboarding/$provider.tsx`          | `providerIdKey`, `prefilledProfileKey`                                                         |
| `app/routes/_auth/onboarding/index.tsx`              | `onboardingEmailSessionKey`                                                                    |
| `app/routes/_auth/reset-password.tsx`                | `resetPasswordUsernameSessionKey`                                                              |
| `app/routes/_auth/signup.tsx`                        | `SignupEmail`                                                                                  |
| `app/routes/_auth/verify.tsx`                        | `codeQueryParam`, `targetQueryParam`, `typeQueryParam`, `redirectToQueryParam`, `VerifySchema` |

No invalid-export diagnostic occurred in the official starter or Shopify
template. The classifier fix removed the earlier false positives for Epic's
`.server` and `+shared` support modules; regression cases are committed in
`no-invalid-route-exports.test.ts`.

## Rule-by-rule conclusion and controlled mutations

The four accepted decisions and examples are recorded in [RFC 001](../rfcs/001-no-action-only-routes.md), [RFC 002](../rfcs/002-require-root-error-boundary.md), [RFC 003](../rfcs/003-valid-route-module-path.md), and [RFC 004](../rfcs/004-no-invalid-route-exports.md). Their rule pages link the same official sources and describe the options.

The unit suite supplies controlled invalid mutations instead of relying on a
zero-diagnostic application run:

- `no-action-only-routes`: action-only UI, `clientAction`, aliases, and an
  allowed resource file;
- `require-root-error-boundary`: missing, aliased, re-exported, and custom-root
  boundaries;
- `valid-route-module-path`: a missing literal, unsupported helper shape,
  extensionless path, `relative()` base, imported fragment, and traversal;
- `no-invalid-route-exports`: misspelling, official server/client variants,
  type-only exports, aliases/re-exports, future flags, `allow`, `.server`, and
  `+` support modules.

These mutations are run by the normal test command and are linked from the
corresponding RFCs. The remaining static-analysis limits are deliberate:
computed paths and generated route wrappers are skipped, and an `allow` entry
is required when an integration exports application helpers from a route file.

## Phase 0 decision

The official evidence, the three final application runs, the diagnostic
dispositions, and the regression tests satisfy the MVP contracts. The related
Phase 0 checklist item can therefore be marked complete. Future React Router,
ESLint, or Node release changes must refresh [`compatibility.md`](../compatibility.md)
and repeat this report before widening the support matrix.
