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
`^22.23.2 || ^24.21.0` and ESLint `^10.4.0`. CI uses the Node.js `22.x` and
`24.x` tags across operating systems and checks the minimum and current ESLint
versions. The `@types/node` dependency is development-only and follows the
primary Node.js 24 line; it does not change the Node.js versions accepted by the
published plugin.

Rules must be statically analyzable, tested with valid and invalid fixtures, and
documented. Avoid executing application route configuration or adding broad
autofixes that require application-specific intent.
