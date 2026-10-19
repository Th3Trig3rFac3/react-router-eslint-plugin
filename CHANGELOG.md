# Changelog

## Unreleased

### Fixed

- Restrict framework-config rule analysis to the default-exported config and
  recognize nested route-discovery manifests and object-form prerender paths.
- Detect all literal wildcard action-origin patterns, including multi-segment
  globs, while skipping ambiguous configuration expressions.

### Documentation

- Add TypeScript and TSX flat-config setup guidance and make the rule index and
  compatibility claims follow the exported plugin and package metadata.

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
