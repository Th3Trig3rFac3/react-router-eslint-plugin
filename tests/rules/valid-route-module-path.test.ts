import rule from "../../src/rules/valid-route-module-path.js";
import { ruleTester } from "../rule-tester.js";

const fixtureSettings = {
  reactRouter: {
    appDirectory: "tests/fixtures/path-app/app",
    routeConfig: "tests/fixtures/path-app/app/routes.ts",
  },
};

const missingCandidates =
  "tests/fixtures/path-app/app/does-not-exist.js, " +
  "tests/fixtures/path-app/app/does-not-exist.jsx, " +
  "tests/fixtures/path-app/app/does-not-exist.ts, " +
  "tests/fixtures/path-app/app/does-not-exist.tsx, " +
  "tests/fixtures/path-app/app/does-not-exist.mjs, " +
  "tests/fixtures/path-app/app/does-not-exist.cjs, " +
  "tests/fixtures/path-app/app/does-not-exist.mts, " +
  "tests/fixtures/path-app/app/does-not-exist.cts";

ruleTester.run("valid-route-module-path", rule, {
  valid: [
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import { route, index, layout } from "@react-router/dev/routes";
        export default [
          index("./home.tsx"),
          route("about", "./about"),
          layout("./layout.tsx", [route("nested", "./nested.tsx")]),
        ];
      `,
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import { relative } from "@react-router/dev/routes";
        const routes = relative("features");
        export default [routes.route("reports", "./reports.tsx")];
      `,
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import * as rr from "@react-router/dev/routes";
        export default [rr.relative("features").route("reports", "./reports.tsx")];
      `,
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import * as rr from "@react-router/dev/routes";
        const routes = rr.relative("features");
        export default [routes.route("reports", "./reports.tsx")];
      `,
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import { route as makeRoute } from "@react-router/dev/routes";
        const file = getRouteFile();
        export default [makeRoute("dynamic", file)];
      `,
    },
  ],
  invalid: [
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import { route } from "@react-router/dev/routes";
        export default [route("missing", "./does-not-exist")];
      `,
      errors: [
        {
          messageId: "unresolvedRouteModule",
          data: { modulePath: "./does-not-exist", candidates: missingCandidates },
        },
      ],
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: `
        import { relative } from "@react-router/dev/routes";
        const { route } = relative("missing");
        export default [route("missing", "./route.tsx")];
      `,
      errors: [
        {
          messageId: "unresolvedRouteModule",
          data: {
            modulePath: "./route.tsx",
            candidates: "tests/fixtures/path-app/app/missing/route.tsx",
          },
        },
      ],
    },
  ],
});
