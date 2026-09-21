# Repair backlog

These are concrete mismatches or misleading contracts found while reviewing
[RULE_IDEAS.md](RULE_IDEAS.md). Verify behavior with focused tests before
changing a rule. Keep this list separate from speculative new-rule ideas.

## 1. Match plugin metadata to the package version

**Evidence:** `package.json` previously declared `0.2.0`, while `src/index.ts`
hard-coded `meta.version` to `0.1.0`. Consumers inspecting the ESLint plugin
received the wrong version.

**Repair:** Generate or import the version from package metadata during the
build, and check in an integration test that `plugin.meta.version` equals
`package.json#version` in both ESM and CommonJS output. Avoid a second version
literal that needs manual updates.

**Status:** Implemented. The source metadata reads the package version, the
source integration test compares it, and the packed-entry verification checks
both ESM and CommonJS builds.

The repository uses `0.1.0` for its first unreleased development package, as
documented in `CHANGELOG.md` and `docs/PLAN.md`. The unrelated legacy npm
package's `0.0.1` version does not apply to this project.

## 2. Make the route graph's scope explicit

**Evidence:** `src/utils/route-config.ts` collects bindings from the current
program. Its `resolveArray` follows local identifiers but does not resolve
imported route-config fragments. The route-config rules consume that analyzer,
so duplicate IDs, paths, and params in an imported fragment are not checked as
part of the combined graph. The old rule-ideas text implied this was already
covered.

**Repair:** Keep the current file-local scope in rule docs until a shared
project index exists. Then resolve only local imports inside the configured
project root, cache parsed files, detect cycles, and report each declaration
once regardless of ESLint file order. Add fixtures with two imported fragments,
one duplicate across them, and one unresolved dynamic fragment that is skipped.
Never import or execute application code.

**Status:** The documentation scope correction is implemented. The
project-wide index remains deferred until the plugin has a parser-backed,
file-order-independent analyzer; the current rules intentionally stay
file-local and do not claim cross-file coverage.

## 3. Clarify the hydration fallback policy

**Evidence:** `require-hydrate-fallback` reports every statically recognized
`clientLoader.hydrate = true` without a `HydrateFallback`. React Router's
[client-data guide](https://reactrouter.com/how-to/client-data) also documents a
cache-priming pattern that intentionally omits the fallback and renders the
server route component during hydration. The rule is currently in `strict`, but
its docs label that pattern “Incorrect,” and its diagnostic suggests removing
the hydrate assignment merely because no fallback UI is wanted.

**Repair:** Describe the rule as an optional UI policy, not a universal React
Router validity requirement. Document the cache-priming pattern and the
existing `allowFiles` option. Change the diagnostic to suggest either adding a
fallback or explicitly exempting an intentional SSR pattern. Add a valid test
case for the exemption. Keep it out of `recommended` unless broader evidence
supports that policy.

**Status:** Implemented. The rule page and diagnostic describe the optional
policy, include SSR/cache-priming guidance, and cover an explicit exemption in
the rule tests. It remains `strict` only.

## 4. Align version support text with package metadata

**Evidence:** the README says Node.js `>=22.23.2`, while `package.json` declares
`^22.23.2 || ^24.21.0`. The README implies support for versions outside the
declared engine range.

**Repair:** Derive the README compatibility row from the package engine range
or keep an exact, reviewable copy. Add a documentation check so the two cannot
drift before release.

**Status:** Implemented. The README uses the package's exact Node.js engine
range, and `docs:check` now verifies that row against `package.json`.

## Completion checks

- Focused regression tests cover each changed rule contract.
- `pnpm docs:check`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, and the normal
  test suite pass after implementation changes.
- Rule pages and the README describe the behavior actually shipped.
