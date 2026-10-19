# Compatibility baseline

**Verified:** 2026-10-06 (ESLint support row refreshed; application evidence remains dated in its report)
**Plugin revision:** working tree based on `git rev-parse HEAD` at validation time  
**Support mode:** React Router framework-mode static analysis; React Router is not a runtime peer dependency

This is the release baseline for the Phase 0 decision. “Latest” means the
upstream stable release visible on the verification date. “Previous” means the
previous maintained line that this prerelease intends to support. An app's
dependency declaration and the exact version used for a validation run are
recorded separately because a floating range is not a reproducible fixture.

## Version table

| Product      | Latest upstream stable           | Previous supported line and exact fixture pin                                                                                                                             | Project declaration                                                                                | Evidence and result                                                                                                                                                                                                                                                              |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Router | **8.4.0**, released 2026-09-15   | **7.18.x**; 7.18.2 in the Shopify fixture and 7.16.0 in the Epic Stack lockfile. The official docs version selector exposed 7.18.4 as the current v7 documentation build. | Static rules target the framework route-module API in both lines. No React Router peer dependency. | [Official changelog](https://reactrouter.com/changelog), [framework version selector](https://reactrouter.com/start/framework/route-module), and the three pinned application reports in [`validation/mvp-semantics.md`](validation/mvp-semantics.md).                           |
| ESLint       | **10.12.0**, released 2026-10-02 | **10.4.0**, the plugin's minimum peer-supported version. ESLint 9.x is outside the plugin's support range.                                                                | `peerDependencies.eslint: ^10.4.0`                                                                 | [ESLint 10.12.0 release note](https://eslint.org/blog/2026/10/eslint-v10.12.0-released/) and [10.4.0 release note](https://eslint.org/blog/2026/05/eslint-v10.4.0-released/). Local package/integration checks use 10.12.0; the Node tags and ESLint versions are checked in CI. |
| Node.js      | **24.21.0** (LTS, 2026-09-07)    | **22.23.2** (LTS, 2026-07-28)                                                                                                                                             | `engines.node: ^22.23.2 \|\| ^24.21.0`; development tooling prioritizes Node 24.                   | [Node release index](https://nodejs.org/dist/index.json) and [Node release policy](https://nodejs.org/en/about/previous-releases). CI uses the `22.x` and `24.x` tags across Linux, Windows, and macOS, including the ESLint compatibility matrix.                               |

React Router 6.x and older, ESLint 9.x and older, and Node.js 20.x and older
are outside this package's supported matrix. React Router 7.x remains a
supported previous major even where a fixture uses an earlier 7.x patch; update
the fixture pins before claiming a newer patch is tested.

## Reproducible checks

The package and plugin checks use the versions resolved by the lockfile. CI
uses the `22.x` and `24.x` Node tags when checking the minimum and current ESLint
versions:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm run ci
```

The regular CI matrix covers Node `22.x` and `24.x` across Linux, Windows, and
macOS. The `eslint-boundary` job runs the complete check suite for both Node tags
with ESLint `10.4.0` and `10.12.0`. The framework application run uses:

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
