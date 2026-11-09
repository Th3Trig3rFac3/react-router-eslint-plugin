# Changelog

## Unreleased

## 0.2.0

### Added

- **Fault-Injection & Resilience Tests**: Dedicated test suite (`tests/mocks/fault-injection.test.ts`) ensuring graceful degradation and non-crashing diagnostics/skips for filesystem permission errors (`EACCES`/`EPERM`), broken or cyclic symlinks (`ELOOP`/`ENOENT`), and missing parser fallbacks.
- **Performance Benchmarks & Cache Verification**: Dedicated performance test suite (`tests/performance/benchmark.test.ts`) verifying overhead stays below 20% on a 1,000 route modules fixture and confirming a 100% cache hit rate with zero redundant disk reads across all 8 route-config rules.
- **Security & Boundary Test Suite**: Dedicated security suite (`tests/security/security.test.ts`) asserting strict project-boundary containment, path traversal prevention (`../../`), null-byte injection rejection (`\0`), symlink escape protection, recursion bounds (`maxDepth = 16`), and zero user code execution guarantees during AST parsing.
- **Rule Index Verification**: Added `scripts/rule-index.ts` and `scripts/verify-rule-index.ts` alongside integration tests (`tests/integration/rule-index.test.ts`) to validate in CI that rule documentation, README entries, preset memberships, and engine boundaries remain synchronized.
- **Exported Caching Utilities**: Exported `readCachedFile`, `getCachedExports`, `clearProjectRouteCache`, and `clearPatternCache` from project route configuration and settings utilities.
- **Node.js 26 Support**: Expanded supported engines and development runtime to include Node.js 26.x (`^26.13.0`), upgrading `@types/node` to `^26.6.6`.

### Changed

- **Route Configuration Caching**: Optimized `analyzeProjectRouteConfig` with AST Program-level `WeakMap` memoization and `statSync`-before-read cache invalidation (`mtimeMs` + `size`), preventing redundant file reads and re-parsing across multi-rule lint passes.
- **Centralized File & Export Resolution**: Refactored `valid-route-module` and `require-outlet-for-child-routes` to utilize the shared route cache and exports resolver.
- **Expanded Test Suite**: Grown to 193 tests across 37 test suites with full V8 coverage reporting.

### Fixed

- Restrict framework-config rule analysis to the default-exported config and recognize nested route-discovery manifests and object-form prerender paths.
- Detect all literal wildcard action-origin patterns, including multi-segment globs, while skipping ambiguous configuration expressions.
- Aligned `eslint-boundary` CI job matrix to target supported LTS lines Node 22.x and 24.x with ESLint 10.4.0 and 10.14.0.

### Security

- **ReDoS & Glob Protection**: Added bounded brace expansion (`MAX_BRACE_EXPANSIONS = 64`), collapsed redundant `**/**` wildcards, and introduced a bounded pattern compilation cache (`REGEX_CACHE_LIMIT = 512`) in settings pattern matching.
- **Recursion Exhaustion Bounds**: Enforced strict `maxDepth = 16` recursion limits on imported route-config fragment chains to prevent stack exhaustion on deep or cyclic graphs.

### Documentation

- Added comprehensive documentation index (`docs/README.md`) detailing preset mechanics, required context for strict rules, shared settings, and static-analysis architectural limits.
- Added TypeScript and TSX flat-config setup guidance, aligning rule index and compatibility claims with package metadata.
- Updated `docs/compatibility.md` and `docs/test-coverage.md` to reflect Node 26 runtimes, current ESLint/parser versions, and benchmark metrics.
- Updated `docs/RULE_IDEAS.md` to catalog all 32 implemented rules, adding `prefer-link-for-internal-navigation` and `require-route-error-boundary`.
- Updated `docs/PLAN.md` to record completion of performance, resilience, and security test milestones.

## 0.1.1

### Added

- Added MVP rule RFCs and validation guidance, plus a compatibility baseline for
  supported React Router, ESLint, and Node.js versions.
- Added CI coverage across supported Node.js versions and a package type check
  for the published entry points.

### Changed

- Improved route-module and route-config path resolution, including project
  boundary handling and more conservative orphan detection for uncertain or
  cyclic route graphs.
- Expanded rule and integration coverage, with test coverage reporting in CI.

## 0.1.0

Initial development release. The package foundation and rule contracts are
available for validation; the project is not yet considered a stable 1.0 API.

The prerelease implementation now includes the route-config project index and
the static follow-up rules documented in `RULE_IDEAS.md`: middleware continuation
checks, route parameter/outlet/navigation policies, resource-response headers,
framework-config security checks, client/server import checks, and route-module
policy diagnostics. Context-dependent rules remain opt-in or strict-only.
