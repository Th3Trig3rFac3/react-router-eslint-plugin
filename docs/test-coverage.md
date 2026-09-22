# Test coverage review

Reviewed on 2026-09-22 against the current working tree. This document records
the measured test baseline, the testing work completed from the review, and the
remaining improvements that are useful for this static-analysis plugin.

## Current result and measurement

`pnpm test` passes with **33 test files and 152 tests**. The test run used
Windows and Node.js 26.9.0. Node 26 is outside the package's declared support
range (`^22.23.2 || ^24.21.0`), so the local result does not replace the CI
compatibility matrix.

`pnpm test:coverage` runs the same 152 tests with the V8 provider and includes
all runtime TypeScript sources under `src/**/*.ts`. `src/types.ts` is excluded
because it contains type declarations and no runtime behavior. The current
baseline is:

| Metric     |                 Result |
| ---------- | ---------------------: |
| Statements | 81.49% (1,453 / 1,783) |
| Branches   | 73.72% (1,434 / 1,945) |
| Functions  |     91.53% (238 / 260) |
| Lines      | 86.90% (1,301 / 1,497) |

The [Vitest configuration](../vitest.config.ts) writes text, JSON summary, and
HTML reports. The `test:coverage` script is also run once on the Ubuntu/Node 24
CI matrix entry. No minimum threshold is enforced yet: the baseline should be
used to choose meaningful thresholds after the highest-value branches are
covered, rather than making a blanket 100% target that rewards duplicate cases.

There are **32 rule suites and 5 integration tests**. The plugin exports **33
rule names backed by 32 distinct implementations** because
`valid-resource-route` aliases `resource-route-returns-response`. Every distinct
implementation now has a dedicated test suite or equivalent integration
coverage.

## What is covered

The [RuleTester setup](../tests/rule-tester.ts) uses the TypeScript ESLint parser
with JSX enabled. Rule suites cover both accepted code and reported diagnostics.

| Area                                       | Current evidence                                                                                                                                                                                                                                                                                                                          | Remaining limit                                                                                                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route configuration and paths              | Helper calls, nested routes, object entries, namespace imports, aliases, relative paths, duplicate IDs/parameters, conflicting paths, missing files, imported fragments, and real filesystem paths are covered.                                                                                                                           | Some rare parser and route-shape branches remain; coverage is not proof that every React Router syntax variant is supported.                                                                                                           |
| Route module validity and orphan detection | `valid-route-module` covers component, loader, named re-export, type-only, missing, allowlisted, and comment/string false-positive cases. `no-orphan-route-modules` covers referenced, orphaned, root, allowlisted, ignored, dynamic, incomplete, malformed, outside-root, and cyclic graphs.                                             | These checks intentionally skip dynamic or uncertain graphs; they do not attempt to execute application route discovery.                                                                                                               |
| Route exports and lifecycle rules          | Action-only modules, conflicting/invalid exports, boundaries, hydration, resource responses, revalidation, middleware, navigation, and import boundaries have valid/invalid cases. Import-boundary tests now distinguish server/client reachability, helper chains, type-only imports, side effects, configured packages, and exemptions. | Lower branch coverage remains in rules with many syntax-specific paths, especially `no-action-form-default-method`, `no-resource-route-client-navigation`, `require-outlet-for-child-routes`, and `return-server-middleware-response`. |
| Cross-file behavior                        | The graph fixture and temporary-project tests cover shared fragments, cycles, malformed and missing imports, outside-root imports, and cache invalidation after a fragment changes in the same ESLint process.                                                                                                                            | Application-level module resolution and bundler behavior are outside this package's ownership.                                                                                                                                         |
| Public plugin contract                     | Integration tests assert the complete rule registry, alias identity, flat-config aliases, preset contents and severities, `all`, and representative `strict` and `rsc` lint behavior.                                                                                                                                                     | The package checks still run separately from Vitest; they should remain separate because they validate built artifacts and published metadata.                                                                                         |
| Shared utilities                           | Utility behavior is exercised through rules and integration tests. Coverage reports make remaining paths visible, including lower branch coverage in `ast.ts`, `exports.ts`, and parts of route analysis.                                                                                                                                 | Dedicated utility tests are only useful for a contract that cannot be expressed clearly through a rule.                                                                                                                                |

The graph analyzer now treats recursive imports as uncertain for orphan checks.
This prevents a cycle from making unrelated files appear orphaned while still
allowing the same fragment to be shared by multiple non-recursive imports.

## Improvements still worth making

### Target high-value rule branches

Add focused cases for the uncovered decisions in `no-action-form-default-method`,
`no-resource-route-client-navigation`, `require-outlet-for-child-routes`, and
`return-server-middleware-response`. Each case should represent a distinct
React Router construct or a false-positive boundary, such as aliased form
methods, resource paths with query/hash details, nested layouts with a valid
`Outlet`, or middleware responses returned through a helper. Do not add cosmetic
syntax variants that exercise the same decision.

### Exercise shared AST and export contracts where needed

If changes touch `src/utils/ast.ts`, `src/utils/exports.ts`, or
`src/utils/route-config.ts`, add a small focused test for the affected contract.
Useful examples are computed export names, destructured bindings, type-only
exports, cyclic binding references, and unsupported route-config expressions.
These cases protect several rules at once; broad utility tests with no concrete
consumer behavior would add noise.

### Keep coverage visible without freezing the baseline

Keep `pnpm test:coverage` in CI and review the per-file report when rules or
shared analysis change. Add thresholds only after the targeted branch cases above
are in place. A modest line and branch floor can then prevent accidental drops
without requiring tests for unreachable defensive code.

## Where no additional tests are needed

- Do not duplicate the resource-response suite for `valid-resource-route`; both
  names use the same implementation, and alias identity is already asserted.
- Do not add browser, UI snapshot, HTTP-server, database, or React rendering
  tests. The package performs static ESLint analysis and owns none of those
  runtime behaviors.
- Do not add autofix or suggestion tests until a rule declares an autofix or
  suggestion implementation.
- Do not add a dedicated test file for every utility merely to raise a number.
  Test a utility directly only when its contract is awkward to verify through a
  rule or when a regression demonstrates the need.
- Do not duplicate package-loading, build, publishing, and documentation checks
  in Vitest. `package:check`, `docs:check`, and the CI build already validate
  those boundaries.
- Do not add tests for dynamic route graphs that the rules intentionally skip.
  The important behavior is the existing conservative silence, which is covered
  by the dynamic, incomplete, malformed, outside-root, and cyclic cases.

The project now has a measured coverage baseline and regression protection for
the plugin-specific graph, rule, and preset behavior. Future tests should target
the remaining decision branches or a concrete bug, rather than increase the
test count by repetition.
