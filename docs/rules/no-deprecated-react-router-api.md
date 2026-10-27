# no-deprecated-react-router-api

Report React Router APIs present in the maintained deprecation table and show
the documented replacement. The initial table includes `json` in the
`react-router` and `react-router-dom` packages in favor of `data`.

```ts
import { data } from "react-router";
```

Use the `apis` option to add version-reviewed project or compatibility entries,
and `allow` for a temporary migration exception. The rule does not guess that
an API is deprecated from its name or package alone.

`apis` adds to the built-in table and accepts `{ name, package?, replacement? }`;
`allow` lists API names. Named imports and non-computed namespace member reads
are checked in any linted file. The rule does not read the application's React
Router version or inspect JSX props/options. React Router 8.5's view-transition
deprecations are not covered by the default table; see the
[official changelog](https://reactrouter.com/changelog#v850) before extending a
project policy.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/changelog).
