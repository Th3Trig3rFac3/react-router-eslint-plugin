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
