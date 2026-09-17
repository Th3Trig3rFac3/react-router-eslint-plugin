# Contributing

The project is being built in phases described in [PLAN.md](./docs/PLAN.md). Before
implementing a rule, open an issue with its runtime rationale, valid and invalid
examples, legitimate exceptions, and whether TypeScript or React Router already
provides the diagnostic.

Run the local checks with:

```sh
pnpm install
pnpm run ci
```

The package metadata is the source of truth for the supported runtime: Node.js
`>=22.23.2` and ESLint `^10.0.0`. The `@types/node` dependency is development-
only and controls compile-time declarations; it does not change the Node.js
versions accepted by the published plugin. The current v25 declaration set was
an incidental scaffolding choice, not a requirement. Before release, prefer the
latest v22 declaration line (the lowest supported runtime major) unless the
source intentionally uses a Node 25-only API.

Rules must be statically analyzable, tested with valid and invalid fixtures, and
documented. Avoid executing application route configuration or adding broad
autofixes that require application-specific intent.
