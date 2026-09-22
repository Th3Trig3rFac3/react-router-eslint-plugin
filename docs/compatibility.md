# Compatibility baseline

**Verified:** 2026-09-22  
**Plugin revision:** working tree based on `git rev-parse HEAD` at validation time  
**Support mode:** React Router framework-mode static analysis; React Router is not a runtime peer dependency

This is the release baseline for the Phase 0 decision. “Latest” means the
upstream stable release visible on the verification date. “Previous” means the
previous maintained line that this prerelease intends to support. An app's
dependency declaration and the exact version used for a validation run are
recorded separately because a floating range is not a reproducible fixture.

## Version table

| Product      | Latest upstream stable           | Previous supported line and exact fixture pin                                                                                                                                                             | Project declaration                                                                                | Evidence and result                                                                                                                                                                                                                                                            |
| ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React Router | **8.4.0**, released 2026-09-15   | **7.18.x**; 7.18.2 in the Shopify fixture and 7.16.0 in the Epic Stack lockfile. The official docs version selector exposed 7.18.4 as the current v7 documentation build.                                 | Static rules target the framework route-module API in both lines. No React Router peer dependency. | [Official changelog](https://reactrouter.com/changelog), [framework version selector](https://reactrouter.com/start/framework/route-module), and the three pinned application reports in [`validation/mvp-semantics.md`](validation/mvp-semantics.md).                         |
| ESLint       | **10.11.0**, released 2026-09-18 | **10.0.0**, the minimum supported patch in the same current release line. ESLint 9.39.5 is recorded as an upstream previous line but is excluded from plugin support because the peer range is `^10.0.0`. | `peerDependencies.eslint: ^10.0.0`                                                                 | [ESLint version support](https://eslint.org/version-support/) and [10.11.0 release note](https://eslint.org/blog/2026/09/eslint-v10.11.0-released/). Local package/integration checks run on the installed 10.11.0; the minimum-version CI job is the required boundary check. |
| Node.js      | **24.21.0** (LTS, 2026-09-07)    | **22.23.2** (LTS, 2026-07-28)                                                                                                                                                                             | `engines.node: ^22.23.2 \|\| ^24.21.0`; development tooling prioritizes Node 24.                   | [Node release index](https://nodejs.org/dist/index.json) and [Node release policy](https://nodejs.org/en/about/previous-releases). CI runs both exact LTS boundary versions on Linux, Windows, and macOS.                                                                      |

React Router 6.x and older, ESLint 9.x and older, and Node.js 20.x and older
are outside this package's supported matrix. React Router 7.x remains a
supported previous major even where a fixture uses an earlier 7.x patch; update
the fixture pins before claiming a newer patch is tested.

## Reproducible checks

The package and plugin checks use the versions resolved by the lockfile. Run the
minimum and latest ESLint boundaries in clean checkouts with the corresponding
Node binary:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm run ci
```

The CI matrix is intentionally pinned to `22.23.2` and `24.21.0`; floating
`22.x`/`24.x` jobs are not sufficient evidence for a minimum boundary. The
`eslint-boundary` CI job installs both `eslint@10.0.0` and `eslint@10.11.0`
on Node 24.21.0 and runs the complete check suite. The framework application
run uses:

```text
pnpm run build
node_modules/.bin/tsx scripts/validate-mvp-apps.ts \
  --app official-default-template=/path/to/react-router-templates/default \
  --app epic-stack=/path/to/epic-stack \
  --app shopify-template=/path/to/shopify-app-template-react-router
```

The runner lints the full `app/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}` scope
twice: the three recommended MVP rules, then `no-invalid-route-exports` alone.
It emits JSON with file counts, fatal errors, diagnostics, and the effective
settings. Intentional resource endpoints and integration exports are rerun with
the documented `allowFiles`/`allow` options shown in the validation report.

## Maintenance rule

Refresh this table when React Router publishes a major or supported-line patch,
when ESLint changes its support policy, when Node changes LTS lines, or before a
plugin release. A release cannot widen the package metadata or README table from
an upstream version lookup alone: the exact boundary must pass the package,
integration, and representative-application checks and be linked here.
