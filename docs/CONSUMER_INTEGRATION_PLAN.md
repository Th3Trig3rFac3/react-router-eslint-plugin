# Consumer application integration test improvement plan

Status: proposed; implementation has not started. Reviewed on 2026-11-02.

## Goal

Prove that a separate React Router framework application can install this package,
load it through its own ESLint configuration, and lint real application files with
the currently implemented rules. Also prove that the clean application can build,
start, and serve a route with the plugin installed.

Implement a dedicated consumer integration suite and CI job. Keep the existing
unit tests for detailed rule behavior; a unit test alone cannot establish that the
published package installs and runs correctly in another project.

## Current coverage and the gap

- `tests/rules/` exercises individual rules through RuleTester.
- `tests/integration/plugin.test.ts` exercises ESLint presets, real files, and route
  graph caching, but imports `src/index.ts` through the source module path.
- `scripts/verify-package.ts` loads the built ESM and CommonJS entry files directly.
  `package:check` also checks packaging and types, but does not run a consumer app.
- `scripts/validate-mvp-apps.ts` loads the built plugin against supplied application
  directories. Its historical report covers selected MVP checks, not every current
  rule, installation from a tarball, or the consumer's normal ESLint CLI setup.
- `.github/workflows/ci.yml` already covers OS/Node and ESLint boundaries. It does
  not install the packed plugin into an isolated React Router application.

The registry currently exports 33 rule names backed by 32 implementations.
`valid-resource-route` aliases `resource-route-returns-response`. Derive coverage
from the installed registry so future rules cannot silently escape this suite.

## Proposed files

All paths below are proposed additions or changes, not existing commands or tests.

| Path                                     | Responsibility                                                                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/consumer/fixtures/framework-app/` | Small, runnable framework app with exact dependency pins, its own lockfile, ESLint flat config, TypeScript/Vite/framework configs, root, nested route, loader/action, and resource endpoint. |
| `tests/consumer/cases/`                  | Isolated valid/invalid mutations and expected diagnostics for every canonical rule; alias and preset cases.                                                                                  |
| `scripts/test-consumer.ts`               | Build, pack, create isolated consumers, install dependencies, run assertions, build/start the clean app, and clean up.                                                                       |
| `tests/consumer/README.md`               | Fixture maintenance, dependency update process, local execution, and failure investigation.                                                                                                  |
| `package.json`                           | Add an explicit `test:consumer` script invoking the runner through the existing `tsx` development tool.                                                                                      |
| `.github/workflows/ci.yml`               | Add a required consumer job and bounded compatibility matrix.                                                                                                                                |
| `.github/workflows/release.yml`          | Run the pinned consumer gate before publication.                                                                                                                                             |

Use a standalone runner initially. Avoid making network installation and framework
builds part of the default `vitest run`; retain the existing fast test workflow.

## 1. Test the actual package boundary

1. Build the plugin once and create a tarball with `pnpm pack` in a temporary output
   directory. Discover the resulting filename rather than hardcoding the version.
2. Copy the checked-in app into a unique temporary directory outside this checkout
   and any workspace. Use a path containing spaces in at least one smoke case.
3. Install the fixture's pinned dependencies using its own frozen lockfile. Then
   install the generated tarball as a local file dependency in that temporary copy.
   Only this temporary manifest/lockfile may change. Do not use a workspace link,
   a source alias, `NODE_PATH`, or the repository's `node_modules` as a fallback.
4. Make the app explicitly declare React, React DOM, `react-router`, matching
   `@react-router/*` framework packages, ESLint, the TypeScript ESLint parser, and
   its framework build/type dependencies. Select mutually compatible exact pins
   and commit the resolved lockfile; React Router is not a plugin runtime peer.
5. Resolve the plugin by the name in the root package metadata from the consumer.
   Assert its resolved location belongs to that consumer's installation, its
   version matches the packed package, and both public import and require entries
   expose rules/configs. Follow the documented CJS export shape.
6. Run the consumer-local ESLint binary with the consumer as its working directory.
   Use its on-disk flat config and normal config discovery. Do not inject a plugin
   object from the runner or substitute the repository's ESLint binary.

The base lockfile pins registry dependencies; the tarball install is an intentional
second step because its artifact changes on every commit. Capture the final
resolved versions in the report. Verify required CLI tools exist locally so a
missing dependency cannot cause an executor to download a different tool version.

## 2. Establish a clean app and preset checks

Start with a conventional `app/root.tsx`, `app/routes.ts`, and `app/routes/` layout.
Use real framework imports, a root error boundary, nested routes with an Outlet,
a parameterized page, and a response-returning resource endpoint.

- Import the installed plugin by package name in `eslint.config.mjs`, apply
  `recommended`, configure the TS/TSX parser explicitly, and lint the whole intended
  application scope plus `react-router.config.ts`.
- Run `eslint ... --format json --max-warnings 0` as an argument array. Require exit
  code 0, zero warnings/errors/fatal errors, and the expected set of linted files.
  An empty result, ignored route, or missing framework config must fail the test.
- Repeat with `strict`, supplying the documented settings and rule options needed
  to activate context-dependent checks. Do not treat a configured but inactive
  rule as evidence of coverage.
- Load `all` and verify its effective rule map and warning severities. Disable
  `valid-resource-route` for normal lint runs to prevent duplicate alias reports;
  test the alias separately. Supply options required to exercise relevant rules.
- Exercise `rsc` as a separate lint configuration with its opt-in behavior, and
  verify each `flat/*` alias matches its corresponding preset. RSC lint coverage
  does not establish that the normal framework fixture is an RSC application.
- Include a small JavaScript/JSX lint case and a CommonJS config load/lint smoke
  case in addition to the primary ESM/TSX application.

## 3. Prove every implemented rule executes

Maintain a case manifest keyed by canonical rule ID. For each implementation,
provide at least one accepted source case and one intentional violation, reusing
existing RuleTester examples as a starting point and adapting them to disk files.
Compare manifest keys against `Object.keys(installedPlugin.rules)` with an explicit
alias map; fail on missing or stale cases.

Organize cases around these areas, covering all names in the installed registry:

| Area                           | Canonical rules                                                                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route graph and config         | `valid-route-config`, `valid-route-module-path`, `valid-route-module`, `no-duplicate-route-ids`, `no-duplicate-route-params`, `no-conflicting-route-paths`, `no-orphan-route-modules`, `consistent-route-module-extension` |
| Module exports and boundaries  | `no-invalid-route-exports`, `no-conflicting-route-exports`, `require-root-error-boundary`, `require-route-error-boundary`, `require-hydrate-fallback`, `require-outlet-for-child-routes`                                   |
| Actions, middleware, responses | `no-action-only-routes`, `no-action-form-default-method`, `no-multiple-middleware-next`, `return-server-middleware-response`, `resource-route-returns-response`, `require-resource-content-type`, `no-broad-action-origin` |
| Navigation, params, prerender  | `valid-route-params`, `no-resource-route-client-navigation`, `no-route-manifest-collision`, `valid-prerender-paths`, `prefer-link-for-internal-navigation`, `safe-should-revalidate`                                       |
| Environment and module safety  | `no-browser-only-imports-in-server-exports`, `no-server-only-imports-in-client-exports`, `no-sensitive-error-output`, `splittable-route-module`, `no-deprecated-react-router-api`                                          |

For each case:

1. Restore clean fixture files and apply only that case's mutation and configuration.
   Use a fresh process so previous route graphs or configuration cannot leak.
2. Enable the target rule explicitly and set any required options/settings. Exercise
   extension mode, route paths, resource paths, file scopes, and `rsc: true` where
   applicable, following the individual rule documentation.
3. Lint through the installed CLI. Normalize file paths and diagnostic ordering;
   compare rule ID, severity, relative filename, line, and diagnostic count against
   explicit expectations. Use structured message IDs through a consumer-local ESLint
   API check if needed; avoid snapshots of entire human-readable messages.
4. Require clean cases to produce no diagnostics. Require error cases to exit 1,
   and warning cases to exit 1 under `--max-warnings 0`. Treat exit 2, signals,
   timeouts, parse failures, and rule exceptions as harness failures, never success.
5. Test `valid-resource-route` alone against the canonical rule's case and compare
   diagnostics after normalizing the rule name.

Keep per-rule activation checks separate from preset integration checks. Include
representative preset violations so severity and actual rule execution are both
tested, including the recommended warning/strict error for `no-action-only-routes`.
Known invalid modules need not pass framework compilation; only the clean baseline
is used for the build/start gate.

## 4. Test project context and application execution

- Exercise imported route-config fragments and real sibling route files. Include
  cross-file cases for missing modules, duplicate/conflicting routes, and orphan
  modules; do not replace those with `lintText` snippets.
- Add a relocated application layout with explicit `appDirectory`, `rootRoute`,
  `routeConfig`, and `routeModuleFiles` settings. Run from that app's directory to
  catch assumptions about the repository root and path separators.
- Assert generated type/build directories are excluded while all intended source
  files remain linted. Record effective configuration for representative files.
- On the clean baseline, run framework type generation, TypeScript checking, and
  a production build using the fixture's pinned scripts.
- Start the built app using its declared server adapter on an available local
  port. Poll readiness with a deadline, request a rendered page and the resource
  endpoint, and assert status, a known page marker, resource body, and content type.
  Always terminate the server and its children, including on Windows or failure.

These checks establish installation, lint integration, and basic application
execution. They do not claim complete browser hydration, navigation, RSC runtime,
or framework-equivalent validation of every static-analysis heuristic.

## 5. CI and reproducibility

Introduce a `consumer-integration` job on pull requests and main-branch pushes,
alongside the existing checks. Start with Ubuntu and a supported Node 24 patch,
using explicit fixture pins and the ESLint version resolved by the baseline.
Once the complete rule manifest passes, extend coverage without duplicating the
entire OS × Node × ESLint × React Router cross product:

| Lane                      | Scope                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required baseline         | Complete rule and preset suite, clean app typecheck/build/start, pinned primary React Router line.                                                                                    |
| Required compatibility    | Complete rule and preset suite on each targeted React Router major, paired with coherent framework dependencies; ESLint minimum and pinned current boundary from package metadata/CI. |
| Required OS smoke         | Clean lint, representative cross-file failures, and installed ESM/CJS loading on Windows and macOS.                                                                                   |
| Node smoke                | Installed-package lint/load checks on supported Node lines 22, 24, and 26, at patches satisfying `engines.node`.                                                                      |
| Optional scheduled canary | New dependency releases; report failures separately before promoting pins to required lanes.                                                                                          |

Use separate pinned manifests/lockfiles or explicitly maintained overlays for
compatibility lanes. Do not mutate the repository's package manifest/lockfile to
select consumer versions. Keep React Router 7/8 fixture targets aligned with the
compatibility policy, and verify exact releases during implementation instead of
copying historical report pins or claiming that moving `latest` is reproducible.

Cache dependency downloads, not installed consumers or previous plugin tarballs.
Give installation, lint cases, builds, and readiness separate bounded timeouts.
Use cross-platform process execution with argument arrays and explicit working
directories; avoid shell-specific copy commands and command interpolation.

Upload a failure report containing phase, versions, tarball identity, command,
exit status, stdout/stderr, normalized ESLint JSON, and effective config. Preserve
the temporary app on failure when explicitly requested for local debugging;
otherwise clean up owned temporary directories in a `finally` block.

Add `pnpm run test:consumer` to contributor instructions after implementation.
Keep `pnpm run ci` fast initially and make the separate consumer CI status required.
Run the pinned baseline gate in the manual release workflow before publication.
Record completed runs in compatibility documentation with their actual pins;
leave historical application reports unchanged.

## Delivery milestones and acceptance criteria

- [ ] Phase 1: Add pinned clean fixture and runner; install the freshly packed
      package, resolve public ESM/CJS exports, and pass consumer-local recommended
      lint with nonempty, explicit file coverage.
- [ ] Phase 2: Cover every canonical implementation with valid/invalid disk cases,
      test the alias separately, and fail when registry/manifest coverage drifts.
- [ ] Phase 3: Verify every preset, required options, relocated layout, and cross-file
      cases; no crashes, parse errors, unexpected diagnostics, or skipped source files.
- [ ] Phase 4: Pass clean framework type generation, typecheck, build, server startup,
      and page/resource HTTP assertions with reliable process cleanup.
- [ ] Phase 5: Enable required CI lanes and release gate; document the local command,
      fixture updates, failure artifacts, and tested versions.

Completion requires an actual successful CI run plus a deliberate failing-rule
mutation that makes the consumer gate fail with the expected diagnostic. Merely
adding a workflow or observing a zero exit code without checking files and rule
coverage is insufficient. No new lint rules or npm publication are part of this work.

## References

- [Existing presets and activation requirements](./README.md)
- [Compatibility policy and historical application runner](./compatibility.md)
- [Individual rule behavior and limitations](./rules/)
- [pnpm pack documentation](https://pnpm.io/cli/pack): creating the installable tarball.
- [ESLint CLI documentation](https://eslint.org/docs/latest/use/command-line-interface):
  JSON output, warning limits, config inspection, and exit-code contracts.
- [React Router framework routing](https://reactrouter.com/start/framework/routing)
  and [framework CLI](https://reactrouter.com/api/other-api/dev): fixture conventions,
  framework type generation, and build commands.

Official documentation was consulted on 2026-11-02. Context7 tools were unavailable
in this session; recheck version-specific APIs and dependency compatibility when
implementing the fixtures.
