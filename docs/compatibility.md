# Compatibility baseline

**Configured `1.0.0` toolchain targets:** ESLint `10.15.0` (`eslint: ^10.15.0`), TypeScript ESLint parser `8.73.0` (`@typescript-eslint/parser: ^8.73.0`), pnpm `^12.21.0`; CI `eslint-boundary` targets `10.4.0` and `10.15.0`

**Historical upstream lookup:** 2026-10-26

**Local `1.0.0` test baseline (2026-11-21):** Windows, Node.js 26.12.1, ESLint 10.15.0, TypeScript ESLint parser 8.73.0 (37 test files, 197 tests)

**Historical application evidence:** 2026-09-22; see the [pinned report](./validation/mvp-semantics.md)

**Support mode:** React Router framework-mode static analysis; React Router is not a runtime peer dependency

Upstream release availability, package support declarations, CI configuration,
and completed validation are separate evidence. An upstream lookup or updated
dependency declaration does not establish that this plugin or external
applications were rerun against that release.

## Version table

| Product      | Upstream snapshot on 2026-10-26                                                                                                                        | Project declaration                                                                         | Validation evidence                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Router | **8.5.0**, released 2026-10-16; the previous-major docs selector shows **7.18.4**.                                                                     | Framework route-module and route-helper analysis; no React Router peer dependency.          | The historical application report (2026-09-22) used **8.4.0**, **7.18.2**, and **7.16.0**. Applications have not been rerun for 8.5.0, 7.18.4, or `1.0.0`.                                                                                                    |
| ESLint       | **10.14.0**, released 2026-10-16 (upstream snapshot); `1.0.0` updates dev dependencies to ESLint **10.15.0** and parser **8.73.0**.                    | `peerDependencies.eslint: ^10.4.0` (dev dependency `^10.15.0`)                              | The local `1.0.0` 197-test baseline (2026-11-21) used ESLint **10.15.0** and parser **8.73.0** on Windows/Node 26.12.1. CI is configured for **10.4.0** and **10.15.0** on Node 22 and 24; minimum **10.4.0** and Linux/macOS CI runs have not been run here. |
| Node.js      | **26.12.1** (Current), **24.22.1**, and **22.23.4** on 2026-10-26; `1.0.0` sets minimum `engines.node` patches to `22.23.5`, `24.22.3`, and `26.13.1`. | `engines.node: ^22.23.5 \|\| ^24.22.3 \|\| ^26.13.1`; development uses `pnpm` (`^12.21.0`). | The local `1.0.0` baseline (2026-11-21) ran on **26.12.1** (Windows). Node **22.x**, **24.x**, and Linux/macOS CI runs are configured on moving tags and have not been run here.                                                                              |

Primary sources from the 2026-10-26 upstream snapshot:
[React Router changelog](https://reactrouter.com/changelog),
[framework version selector](https://reactrouter.com/start/framework/route-module),
[ESLint 10.14.0 release note](https://eslint.org/blog/2026/10/eslint-v10.14.0-released/),
[Node release index](https://nodejs.org/dist/index.json), and
[Node release policy](https://nodejs.org/en/about/previous-releases).

React Router 6.x and older, ESLint 9.x and older, and Node.js versions outside
the declared 22/24/26 ranges are outside this package's support policy. The
previous React Router major remains a compatibility target, but the exact
fixture pins must be updated and rerun before a newer patch is called tested.
The [deprecation rule](./rules/no-deprecated-react-router-api.md) uses a small
maintained table and does not automatically cover every upstream deprecation.

## Reproducible checks

Install pnpm and use the engine versions declared in `package.json`.
`devEngines` selects the development package manager (`pnpm` `^12.21.0`), which
is separate from the published plugin's supported Node range in `engines.node`.
The lockfile records dependency resolutions.

```sh
pnpm install --frozen-lockfile
pnpm run ci
pnpm run test:coverage
pnpm run package:check
```

The regular [CI matrix](../.github/workflows/ci.yml) is configured for Node
`22.x`, `24.x`, and `26.x` across Linux, Windows, and macOS. The `eslint-boundary` job
runs `ci` on Ubuntu with the supported LTS Node tags (`22.x` and `24.x`) and ESLint `10.4.0` and `10.15.0`.
Coverage runs on Ubuntu/Node 26; package validation runs on all three Ubuntu Node
entries. Moving Node tags test the patches selected at job time, rather than
pinning every minimum engine patch.

The framework application runner uses the built package:

```sh
pnpm run build
pnpm exec tsx scripts/validate-mvp-apps.ts --app official-default-template=/path/to/react-router-templates/default --app epic-stack=/path/to/epic-stack --app shopify-template=/path/to/shopify-app-template-react-router
```

It lints the full `app/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}` scope twice: the
three original recommended MVP checks, then `no-invalid-route-exports` alone.
This is not a validation run of every rule in today's `recommended` or
`strict` preset. Its JSON includes file counts, fatal errors, diagnostics, and
effective settings. The pinned application report documents the intentional
resource-route and integration-export exceptions needed for its final run.

## Maintenance rule

Refresh upstream evidence when React Router publishes a major or supported-line
patch, ESLint changes its support policy, Node changes LTS lines, or before a
plugin release. Preserve the date and pins of historical application reports;
record a new run separately. Widen support only after package, integration,
and representative-application checks pass at the intended boundaries.
