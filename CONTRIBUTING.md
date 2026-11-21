# Contributing

The project is being built in phases described in [PLAN.md](./docs/PLAN.md). Before
implementing a rule, open an issue with its runtime rationale, valid and invalid
examples, legitimate exceptions, and whether TypeScript or React Router already
provides the diagnostic.

Start with the [documentation index](./docs/README.md) for development-only
documentation (the `docs/` directory is not published to npm; consumers read
[README.md](./README.md)), current presets, settings, and analysis limits. The
plan includes future release requirements; unchecked tasks are not claims about
existing automation.

Run the local checks with:

```sh
pnpm install
pnpm run ci
pnpm run test:coverage
pnpm run package:check
```

The package metadata is the source of truth for the supported runtime: Node.js
`^22.23.5 || ^24.22.3 || ^26.13.1` and ESLint `^10.4.0`. CI uses the Node.js
`22.x`, `24.x`, and `26.x` tags across operating systems and checks ESLint
`10.4.0` and `10.15.0`.
The `@types/node` dependency is development-only and follows the Node.js 26
development line; it does not change the Node.js versions accepted by the
published plugin.

For development, use a supported Node.js line from `engines.node` and the pnpm
version in `devEngines` in `package.json`; keep those declarations as the source
of truth for tool versions.
`ci` includes formatting, linting, typechecking, tests, the documentation-index
check, and a build. Coverage and package validation are separate commands;
run them when changing rules or packaging respectively.

Rules must be statically analyzable, tested with valid and invalid fixtures, and
documented. Avoid executing application route configuration or adding broad
autofixes that require application-specific intent.
