# React Router ESLint Plugin — Implementation Plan

> **Implementation status — 2026-09-22:** Checkboxes marked `[x]` are
> implemented and covered by tests or package validation. Release decisions,
> external application feedback, and publishing tasks remain unchecked until
> they are completed by the maintainer.

## 1. Goal

Build a production-quality ESLint plugin that catches common mistakes in React Router framework-mode route modules and route configuration files. The plugin should be useful to beginners through a low-noise `recommended` config and to larger applications through an intentionally more opinionated `strict` config.

The initial target is the current `remix-run/react-router` framework API: route modules referenced by `app/routes.ts`, the helpers exported by `@react-router/dev/routes`, and the conventional root route at `app/root.*`. Data-mode and declarative-mode rules can be added later when a rule has a clear, mode-specific contract.

Success means:

- diagnostics explain the runtime failure being prevented and point to a safe remedy;
- default rules have very few false positives;
- JavaScript, TypeScript, JSX, and TSX are supported;
- flat config is first-class, with ESLint 10 compatibility verified;
- rules never execute an application's `routes.ts` or import application code;
- the npm tarball works in both ESM and CommonJS consumers;
- every rule has focused documentation, examples, and tests;
- publishing, licensing, security, and contribution processes are documented.

## 2. Decisions to settle before implementation

### Package identity

An authoritative npm/CDN check found that the unscoped name
`eslint-plugin-react-router` is already occupied by a legacy `0.0.1` package
(ISC licensed). It must not be reused or presented as the same project. The
name in this repository is therefore a provisional local/CI identifier only;
before an alpha release, select a maintainer-controlled scope or another
available name and update `package.json`, the exports metadata, README
installation examples, and release workflow together. The current
`pnpm publish` workflow is intentionally manual and must not be run until
that decision is recorded.

Do not publish as `@react-router/eslint-plugin` or describe the package as
official unless the React Router maintainers explicitly adopt it. Use
`react-router` as the ESLint namespace, independently of the final package
name:

```js
import reactRouter from "eslint-plugin-react-router";

export default [reactRouter.configs.recommended];
```

Add a short non-affiliation statement to the README when the package is
community-maintained. Before the first release, confirm the final name with
the package owner and reserve it with a minimal non-public dry run if
appropriate. The legacy package check is recorded here so a future release
review does not accidentally treat the provisional name as available.

### Supported versions

- Start with React Router framework-mode syntax used by the latest stable release and test the previous maintained major where practical.
- Treat `react-router` and `@react-router/dev` as fixture/dev dependencies, not runtime peer dependencies. AST-based rules should not force users to install packages they do not otherwise need.
- Set the ESLint peer range only after the compatibility matrix passes. The selected peer range is `^10.0.0`.
- The package supports the Node.js 22 and 24 LTS lines through `^22.23.2 || ^24.21.0`; development and release tooling prioritize Node.js 24, while CI retains Node.js 22 coverage.
- Keep `@types/node` development-only and aligned with the primary Node.js 24 development runtime. Node.js 22 compatibility must continue to be verified by CI rather than inferred from the type package version.
- Prefer flat config. Do not add legacy eslintrc configs to a brand-new package unless user demand justifies their ongoing test burden.

### License

The repository's existing Apache License 2.0 is a valid, permissive open-source license and may be retained. It is compatible with using MIT-licensed React Router as a development dependency and offers an explicit patent grant. The standard appendix placeholders in the current license text are part of the canonical license; they do not by themselves make the file incomplete.

Before publishing:

- set `"license": "Apache-2.0"` in `package.json`;
- include `LICENSE` in the npm tarball;
- add an SPDX identifier or license link to the README;
- decide the copyright holder name with the maintainer rather than inferring it from a Git or machine username;
- add a `NOTICE` file only if there are attribution notices that must or should ship, or if the owner wants one; for a non-ASF original project it is not automatically required merely because Apache-2.0 was selected;
- preserve licenses and notices for any copied third-party code, preferably avoiding copied implementations entirely;
- run a dependency-license check in CI and manually review exceptions before release.

MIT would also be reasonable and would match React Router, Vitest's plugin, and Storybook's plugin, but changing the existing license is an owner decision. Default implementation choice: retain Apache-2.0 unless the owner explicitly selects MIT. This section is project guidance, not legal advice.

## 3. Scope and non-goals

### Version 1 scope

- React Router framework-mode route modules.
- `app/routes.ts` and statically analyzable route config fragments.
- Static ESM exports, including declarations, export specifiers, aliases, default exports, and re-exports where safely resolvable.
- Configurable app directory, root route path, route config paths, extensions, and intentional exceptions.
- Flat `recommended` and `strict` configs.

### Non-goals for version 1

- Executing or dynamically importing `routes.ts`.
- Proving arbitrary JavaScript return values at runtime.
- Replacing React Router's type generation or TypeScript.
- Following arbitrary computed paths, custom route-builder wrappers, or every third-party file-route convention.
- Modifying route behavior with broad autofixes. Adding a loader, component, redirect destination, or error UI requires application intent and should normally be a suggestion or documentation link.
- Claiming that every component route needs a loader or that every resource route must return a native `Response`.

## 4. Rule design principles

1. **Correctness before rule count.** A small rule set with predictable reports is more valuable than broad heuristics.
2. **Recognize React Router context.** Do not report on an unrelated function named `action`, `loader`, or `ErrorBoundary` in an arbitrary module.
3. **Static analysis only.** Inspect ASTs and files; never run user configuration or application modules.
4. **Explain the failure mode.** Each diagnostic should say what React Router may do and the available fixes.
5. **Safe fixes only.** Use autofixes only for semantics-preserving edits. Use suggestions for edits requiring a choice.
6. **Explicit uncertainty.** Skip dynamic constructs the rule cannot prove, or issue a separate, opt-in diagnostic; do not guess.
7. **Stable configs.** Rules with legitimate common exceptions start outside `recommended` or with conservative options.

### Route-module confidence model

Route-module rules need a shared classifier so a normal source file that happens to export `action` is not flagged. A file is considered a route module when at least one configured signal is present:

- it is the configured root route;
- its path matches configured route-module globs;
- it imports a generated `./+types/...` route type;
- it is referenced by a statically analyzed route config in the same ESLint run or a precomputed project index.

The initial shared configs should use conventional globs for `app/root.*` and `app/routes/**/*` and document how to override them. Cross-file discovery must not depend on file lint order; either pre-index route configs deterministically or keep graph-dependent checks attached to the `routes.ts` file that owns the reference.

## 5. Initial rule catalog

### MVP rules

#### `no-action-only-routes`

Report a recognized route module that exports `action` or `clientAction` but exports none of `loader`, `clientLoader`, or a default route component.

Why: visiting or refreshing such a route makes a `GET` request that it cannot serve. A common fix is a loader that redirects to a valid UI route.

Important exception: an action-only resource endpoint, such as a webhook, can be intentional. Therefore:

- ship the rule as `warn` in `recommended` initially, promoting it only after real-world validation;
- support an `allowFiles` glob option for intentional POST-only endpoints;
- document targeted ESLint disable comments as the clearest one-off escape hatch;
- do not autofix because neither a redirect target nor a UI component can be inferred;
- report on the action export and offer suggestions in the message, not generated code.

Test direct declarations, aliased exports, default exports, `clientAction`, type-only exports, re-exports, anonymous defaults, and intentional allowed files.

#### `require-root-error-boundary`

Report when the configured root route does not export a named `ErrorBoundary`.

Behavior:

- default root candidates: `app/root.{js,jsx,ts,tsx,mjs,mts}`;
- allow `rootRoute` and `appDirectory` settings for custom layouts/monorepos;
- recognize declarations, export lists, and statically resolvable re-exports;
- do not require a particular implementation or hook;
- do not autofix an error UI, because accessible and secure error presentation is application-specific.

Enable as `error` in `recommended`.

#### `valid-route-module-path`

On route config files, verify that each static module path passed to an imported React Router route helper resolves to a file.

Initial helper coverage:

- `route(path, module, children?)`;
- `index(module, options?)`;
- `layout(module, children?)`;
- helpers returned by `relative(directory)`;
- aliases of helpers imported from `@react-router/dev/routes`.

Support `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`, plus explicitly documented extensionless resolution. Resolve paths according to React Router's app-directory semantics, not Node package resolution. Follow static route-config fragments imported by relative path only if this can be done without executing them.

Skip computed strings and custom wrappers in version 1. Report the literal path, attempted base directory, and a concise list of candidates. Correcting a typo may be offered as a suggestion only when there is exactly one high-confidence candidate.

Enable as `error` in `recommended`.

#### `no-invalid-route-exports`

Catch misspelled or unsupported exports in a recognized route module, such as `ErrorBoundry` or `Load`, while permitting React Router's documented exports and user-defined non-exported helpers.

The allowlist must be versioned from official React Router route-module documentation and include server/client variants, `default`, error/hydration boundaries, metadata/link/header handlers, middleware, and other currently supported exports. Provide an `allow` option for ecosystem extensions and future flags. A React Router upgrade must not turn new official exports into false positives; release and compatibility policy should cover this.

Enable as `error` in `recommended` only after testing against representative public applications. Until then, include it in `strict`.

### Rule requiring a narrower contract

#### `resource-route-returns-response`

This is the precise replacement for the proposed blanket `valid-resource-route` rule. React Router documents two legitimate resource-route styles:

- externally consumed resources should return/throw a `Response`;
- routes consumed through fetchers or form submissions may return `data()`.

Because source code cannot always infer the consumer, keep this rule out of `recommended`. In `strict`, require the user to select files or a mode:

```js
"react-router/resource-route-returns-response": [
  "error",
  { files: ["app/routes/api/**/*"], allowData: false }
]
```

Recognize `new Response(...)`, returned or thrown `Response` values, React Router `redirect(...)`, and configured response-producing helpers. For indirect calls or complex control flow, use TypeScript type information when available; otherwise avoid claiming certainty. Ensure every reachable, statically understood branch complies. Do not evaluate the function.

### High-value follow-up rules

The expanded implementation status and intentionally deferred ideas are
maintained in [RULE_IDEAS.md](./RULE_IDEAS.md). The initial shortlist is now
implemented with conservative static contracts:

- [x] `require-hydrate-fallback`: when client-loader hydration opts in, require the route's documented hydration fallback contract.
- [x] `no-conflicting-route-paths`: detect duplicate static sibling paths or indistinguishable route entries in `routes.ts`.
- [x] `valid-route-module`: extend path validation by parsing the target and verifying that it has at least one meaningful route-module export; keep this separate from path existence so diagnostics remain focused.
- [x] `require-route-error-boundary`: optionally require boundaries at configured application boundaries, not every route.
- [x] `no-duplicate-route-ids`: detect explicit duplicate IDs when route config APIs expose them.
- [x] `prefer-link-for-internal-navigation`: detect plain anchors to known internal routes, with exceptions for resource routes and `reloadDocument` use cases. This needs a careful JSX and URL contract and should not be an early rule.
- [x] `no-server-only-imports-in-client-exports`: trace dependencies of `clientLoader`/`clientAction` only if React Router's build checks do not already give a better diagnostic.

Reject ideas that merely restate TypeScript errors, duplicate React Router build-time checks, or require application-specific policy without configurable scope.

## 6. Shared configurations

Export a default plugin object with `meta`, `rules`, and `configs`, following current ESLint plugin conventions. Include `meta.name`, `meta.version`, and `meta.namespace`.

### `recommended`

Low-noise correctness checks:

- `require-root-error-boundary`: `error`;
- `valid-route-module-path`: `error`;
- `no-action-only-routes`: `warn` for the initial release;
- `no-invalid-route-exports`: add only after ecosystem validation.

The flat config should register the plugin itself and use documented file patterns. Provide both of these supported forms in tests and README:

```js
import reactRouter from "eslint-plugin-react-router";

export default [reactRouter.configs.recommended];
```

```js
import { defineConfig } from "eslint/config";
import reactRouter from "eslint-plugin-react-router";

export default defineConfig({
  plugins: { "react-router": reactRouter },
  extends: ["react-router/recommended"],
});
```

### `strict`

Extend all recommended checks and add opinionated or context-dependent rules. Initially this may add `no-invalid-route-exports` and opt-in route conventions, but it must not silently enable `resource-route-returns-response` without a meaningful file scope. If a strict rule requires options, either provide conservative defaults or document a `strict` base plus an example override.

### `all`

Optionally expose `all` for maintainers and rule exploration. Clearly state that it is unstable as a policy bundle and is unsuitable for CI without review.

Configuration changes that create new diagnostics require deliberate semver treatment. Adding a rule without enabling it is normally minor; enabling a new rule in `recommended` or making an existing rule stricter should be reserved for a major release, or staged first as a warning with release notes.

## 7. Proposed repository structure

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/ci.yml
│   └── workflows/release.yml
├── docs/
│   ├── PLAN.md
│   ├── RULE_IDEAS.md
│   ├── compatibility.md
│   ├── rfcs/
│   │   ├── README.md
│   │   └── <mvp-rule>.md
│   ├── validation/
│   │   └── mvp-semantics.md
│   └── rules/
│       ├── no-action-only-routes.md
│       ├── no-invalid-route-exports.md
│       ├── require-root-error-boundary.md
│       ├── resource-route-returns-response.md
│       └── valid-route-module-path.md
├── scripts/
│   ├── generate-rule-docs.ts
│   ├── validate-mvp-apps.ts
│   └── verify-rule-index.ts
├── src/
│   ├── configs/
│   │   ├── recommended.ts
│   │   └── strict.ts
│   ├── rules/
│   │   └── <one-file-per-rule>.ts
│   ├── utils/
│   │   ├── create-rule.ts
│   │   ├── exports.ts
│   │   ├── project-settings.ts
│   │   ├── route-config.ts
│   │   ├── route-module.ts
│   │   └── path-resolution.ts
│   ├── index.ts
│   └── types.ts
├── tests/
│   ├── fixtures/
│   ├── integration/
│   ├── rules/
│   └── package/
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

Keep rule metadata in the rule source as the single source of truth. Generate the README rule table and rule-doc headers, then fail CI if generated documentation is stale.

## 8. Technical architecture

### Tooling

- TypeScript with strict compiler options.
- `@typescript-eslint/utils` for typed rule construction and AST types.
- `@typescript-eslint/rule-tester` with the parser as test/dev dependencies.
- Vitest for unit/integration tests, unless RuleTester compatibility proves simpler with another runner.
- `tsdown` or an equivalent maintained bundler to emit ESM, CJS, and declaration files.
- ESLint for this repository, Prettier for formatting, and `eslint-plugin-eslint-plugin` for plugin-authoring mistakes.
- `publint` and `@arethetypeswrong/cli` for package export validation.

Do not add React Router as a runtime dependency unless a later rule genuinely imports a stable public API. Keep the production dependency surface small.

### Shared export analysis

Build one utility that records:

- named function/class/variable exports;
- export specifiers and aliases;
- default declarations and expressions;
- re-exports with source locations;
- assignment metadata such as `clientLoader.hydrate = true`;
- whether an export is type-only.

Rules should consume this normalized model rather than each implementing incomplete AST handling.

### Route config analysis

Identify helpers by their imports from `@react-router/dev/routes`, including local aliases. Parse only statically understandable arrays, spreads, and calls. For `relative()`, carry the declared base directory into returned helper calls. Keep dynamic nodes as “unknown” and skip them with optional debug output; never evaluate them.

If imported local config fragments are supported, resolve and parse only relative source files within the project root. Add cycle detection, a maximum traversal depth, and caching keyed by real path plus settings. Do not follow package imports or cross the project root by default.

### Settings

Use a single documented settings namespace:

```js
settings: {
  reactRouter: {
    appDirectory: "app",
    rootRoute: "app/root.tsx",
    routeConfig: ["app/routes.ts"],
    routeModuleFiles: ["app/root.tsx", "app/routes/**/*.{js,jsx,ts,tsx}"],
    extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"]
  }
}
```

Defaults should work for a newly created React Router app. Resolve relative settings from ESLint's working directory, normalize Windows and POSIX separators, respect symlinks safely, and prevent traversal outside the project root unless explicitly configured.

### Performance and security

- No network access and no application-code execution.
- Cache file existence, parsed exports, and route config results within a lint process.
- Invalidate caches by real path and modification metadata where necessary.
- Avoid parsing an entire repository for a rule attached to one file.
- Add a representative performance fixture and a documented budget, such as less than 20% overhead over parser-only linting for 1,000 route modules on CI hardware.
- Treat malformed files, permission errors, and missing parser services as normal diagnostics or safe skips, never crashes.

## 9. Testing strategy

### Rule tests

For every rule, include valid and invalid cases for:

- JavaScript, TypeScript, JSX, and TSX;
- direct exports, export lists, aliases, default declarations, and re-exports;
- CRLF and LF source text;
- Windows and POSIX paths;
- custom `appDirectory`, root path, route config name, and extensions;
- syntax errors or unknown/dynamic constructs that must not crash;
- message IDs, exact report locations, suggestions, and fixes where applicable;
- false-positive regression cases taken from real React Router patterns.

### Integration tests

- Run ESLint against fixture applications using both exported config syntax forms.
- Test conventional routes, custom app directories, split route configs using `relative()`, and monorepo packages.
- Verify that unrelated modules exporting similarly named functions are ignored.
- Verify ESLint 10 in CI, including the lowest supported version.
- Test supported Node.js versions and Windows plus Linux runners for path behavior.

### Package tests

- Build and import from ESM and CommonJS.
- Assert default export, rule names, configs, plugin metadata, and declaration usability.
- Run `npm pack --dry-run` and inspect that only intended files ship, including README and LICENSE.
- Install the packed tarball in a minimal fixture and run ESLint without workspace resolution helping it.
- Run `publint` and `attw` against the packed package.

### Quality gates

Required CI checks: format, lint, typecheck, unit tests, integration tests, build, package validation, generated-doc consistency, and dependency/license audit. Set branch protection only after the checks are stable.

## 10. README deliverable

Expand the initial planning README into release-ready documentation during the first implementation phase. It should contain:

1. project purpose and community/non-affiliation status;
2. supported React Router modes and versions;
3. installation commands for npm, pnpm, Yarn, and Bun;
4. a copy-paste flat-config quick start;
5. `recommended` and `strict` examples;
6. a generated rule table with description, config membership, fixability, suggestions, and type-information requirement;
7. settings and monorepo/custom-app-directory examples;
8. short valid/invalid examples for the four initial concepts;
9. known static-analysis limitations and how to opt out intentionally;
10. version/compatibility table for Node.js and ESLint;
11. contributing, security, changelog, and issue links;
12. Apache-2.0 license statement and trademark/non-affiliation note.

Each rule gets a dedicated page with: summary, rationale, when not to use it, options schema, default behavior, correct/incorrect examples, config membership, fix/suggestion behavior, limitations, and links to the relevant React Router documentation.

## 11. Release and maintenance

- Start at `0.1.0`; keep rules and option schemas explicitly experimental until enough fixture and community feedback exists.
- Use Changesets or an equally transparent changelog workflow.
- Publish through npm trusted publishing with provenance, protected environments, and required review. Require 2FA for maintainers.
- Add `repository`, `homepage`, `bugs`, `funding` if applicable, `keywords`, `engines`, `peerDependencies`, `exports`, `files`, and `sideEffects: false` to `package.json`.
- Add Dependabot/Renovate only after CI exists and group noisy development updates.
- Document the security-reporting channel in `SECURITY.md`; filesystem traversal and config parsing deserve explicit security tests.
- Create issue templates for bug reports, false positives, rule proposals, and React Router compatibility reports.
- Validate new React Router releases against fixture apps before expanding the supported-version table.

## 12. Phased implementation checklist

### Phase 0 — validate assumptions

- [x] Check the provisional unscoped name and record that it is occupied by a
      legacy package; owner-controlled scope/name selection remains a release
      decision.
- [ ] Confirm owner, final package name, npm scope, and community/official
      status.
- [ ] Confirm Apache-2.0 versus an owner-approved switch to MIT.
- [x] Record latest and previous supported React Router, ESLint, and Node versions.
- [x] Write short rule RFCs with examples for the MVP set.
- [x] Validate rule semantics against official React Router docs and at least three representative applications.

Exit criterion: naming, licensing, supported versions, and MVP behavior are unambiguous.

### Phase 1 — package foundation and README

- [x] Add package metadata, TypeScript/build configs, exports, and scripts.
- [x] Add plugin entry point, metadata, `createRule`, configs, and package smoke fixtures.
- [x] Configure linting, formatting, typechecking, tests, and package validation.
- [x] Expand the planning README into release-oriented documentation and add contribution/security documents.
- [x] Add CI on Linux and Windows.

Exit criterion: the packed package imports in ESM/CJS and a fixture ESLint run can load it.

### Phase 2 — shared analyzers

- [x] Implement and test export normalization.
- [x] Implement project settings and route-module recognition.
- [x] Implement route-helper import tracking and static config traversal.
- [x] Implement safe path resolution with project-boundary checks.

Exit criterion: analyzers cover all documented static examples without executing application code.

### Phase 3 — recommended rules

- [x] Implement `require-root-error-boundary`.
- [x] Implement `valid-route-module-path`.
- [x] Implement `no-action-only-routes` with intentional-resource exceptions.
- [x] Run against representative apps; classify and fix every false positive.
- [x] Add rule docs and verify the README rule table in CI.

Exit criterion: `recommended` produces actionable results with an agreed false-positive threshold and no crashes.

### Phase 4 — strict and advanced rules

- [x] Implement and validate the static `no-invalid-route-exports` rule.
- [x] Prototype `resource-route-returns-response` with scoped options and static tests.
  - [x] Implement the follow-up candidates with explicit scope and uncertainty handling.
- [x] Publish strict config semantics and migration examples in the README/docs.

Exit criterion: every strict diagnostic represents a documented policy, and context-dependent rules require explicit scope.

### Implementation status

- [x] Implement all actionable rule ideas from `RULE_IDEAS.md`.
- [x] Implement all repairs listed in `repair.md`.
- [x] Add the parser-backed, project-bounded route-config graph with caching and cycle/depth protection.
- [x] Add rule documentation, README entries, focused tests, and the `all` configuration.
- [x] Verify formatting, linting, typechecking, tests, documentation indexes, and package publishability.

### Phase 5 — prerelease and stable release

- [ ] Publish an alpha from the packed artifact with npm provenance.
- [ ] Test installation in fresh React Router apps and one monorepo.
- [ ] Collect feedback specifically on false positives, path resolution, and config ergonomics.
- [ ] Freeze v1 rule names/options, complete changelog and compatibility table, and audit the tarball/license.
- [ ] Publish `1.0.0` only after the support and semver policy are credible.

## 13. Definition of done for version 1

- The package can be installed and configured from the README in under five minutes.
- `recommended` detects the root-boundary, missing-route-path, and accidental action-only cases described above without flagging intentional documented resource-route patterns unexpectedly.
- Configs, rules, metadata, types, ESM, and CommonJS entry points work from the packed tarball.
- Supported ESLint/Node/React Router combinations pass CI.
- Every rule has complete documentation and test coverage of its options and known limitations.
- No rule executes user code or reads outside the configured project boundary by default.
- README, LICENSE/package metadata, changelog, contributing guide, code of conduct, and security policy ship in the repository as appropriate.
- A clean clone can reproduce build, tests, docs, and package contents using documented commands.

## 14. Primary references

- [ESLint: Create Plugins](https://eslint.org/docs/latest/extend/plugins)
- [ESLint: Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
- [React Router: Route Modules](https://reactrouter.com/start/framework/route-module)
- [React Router: Routing](https://reactrouter.com/start/framework/routing)
- [React Router: `routes.ts`](https://reactrouter.com/api/framework-conventions/routes.ts)
- [React Router: Error Boundaries](https://reactrouter.com/how-to/error-boundary)
- [React Router: Resource Routes](https://reactrouter.com/how-to/resource-routes)
- [`@vitest/eslint-plugin`](https://github.com/vitest-dev/eslint-plugin-vitest)
- [`eslint-plugin-storybook`](https://github.com/storybookjs/eslint-plugin-storybook)
- [Existing npm package with the unscoped name](https://www.jsdelivr.com/package/npm/eslint-plugin-react-router)
- [Apache License 2.0 application guidance](https://www.apache.org/foundation/license-faq.html#apply)
