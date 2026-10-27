# Compatibility baseline

**Documentation and upstream lookup:** 2026-10-26

**Local checks:** Windows, Node.js 24.22.1, ESLint 10.13.0, TypeScript ESLint parser 8.72.0

**Application evidence:** 2026-09-22; see the [pinned report](./validation/mvp-semantics.md)

**Support mode:** React Router framework-mode static analysis; React Router is not a runtime peer dependency

Upstream release availability, package support declarations, CI configuration,
and completed validation are separate evidence. An upstream lookup does not
establish that this plugin was tested against that release.

## Version table

| Product      | Upstream snapshot on 2026-10-26                                                                                                            | Project declaration                                                                              | Validation evidence                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Router | **8.5.0**, released 2026-10-16; the previous-major docs selector shows **7.18.4**.                                                         | Framework route-module and route-helper analysis; no React Router peer dependency.               | The application report used **8.4.0**, **7.18.2**, and **7.16.0**. Applications have not been rerun for 8.5.0 or 7.18.4 in this review.                   |
| ESLint       | **10.13.0**, released 2026-10-16.                                                                                                          | `peerDependencies.eslint: ^10.4.0`                                                               | The local 172-test run uses 10.13.0. CI is configured for **10.4.0** and **10.13.0** on Node 22 and 24. A configured job is not evidence of a new CI run. |
| Node.js      | **26.12.1** is Current; **24.22.1** and **22.23.4** are the latest patches in the project's supported LTS lines, both released 2026-10-20. | `engines.node: ^22.23.4 \|\| ^24.22.1`; development uses `devEngines.runtime.version: ^24.22.1`. | Local checks use **24.22.1**. CI is configured for the moving `22.x` and `24.x` tags on Linux, Windows, and macOS. Node 26 is outside the declared range. |

Primary sources: [React Router changelog](https://reactrouter.com/changelog),
[framework version selector](https://reactrouter.com/start/framework/route-module),
[ESLint 10.13.0 release note](https://eslint.org/blog/2026/10/eslint-v10.13.0-released/),
[Node release index](https://nodejs.org/dist/index.json), and
[Node release policy](https://nodejs.org/en/about/previous-releases).

React Router 6.x and older, ESLint 9.x and older, and Node.js versions outside
the declared 22/24 ranges are outside this package's support policy. The
previous React Router major remains a compatibility target, but the exact
fixture pins must be updated and rerun before a newer patch is called tested.
The [deprecation rule](./rules/no-deprecated-react-router-api.md) uses a small
maintained table and does not automatically cover every upstream deprecation.

## Reproducible checks

Install pnpm and use the engine versions declared in `package.json`.
`devEngines` selects the development runtime and package manager; it is
separate from the published plugin's supported Node range. The lockfile
records dependency resolutions.

```sh
pnpm install --frozen-lockfile
pnpm run ci
pnpm run test:coverage
pnpm run package:check
```

The regular [CI matrix](../.github/workflows/ci.yml) is configured for Node
`22.x` and `24.x` across Linux, Windows, and macOS. The `eslint-boundary` job
runs `ci` on Ubuntu with both Node tags and ESLint `10.4.0` and `10.13.0`.
Coverage runs on Ubuntu/Node 24; package validation runs on both Ubuntu Node
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
