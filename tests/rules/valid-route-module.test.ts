import rule from "../../src/rules/valid-route-module.js";
import { ruleTester } from "../rule-tester.js";

const fixtureSettings = {
  reactRouter: {
    appDirectory: "tests/fixtures/path-app/app",
    routeConfig: "tests/fixtures/path-app/app/routes.ts",
  },
};

const routeConfig = (modulePath: string) => `
  import { route } from "@react-router/dev/routes";
  export default [route("test", "${modulePath}")];
`;

ruleTester.run("valid-route-module", rule, {
  valid: [
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./home.tsx"),
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./loader.ts"),
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./reexport.ts"),
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./does-not-exist.tsx"),
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./allowed.ts"),
      options: [{ allowFiles: ["./allowed.ts"] }],
    },
  ],
  invalid: [
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./type-only.ts"),
      errors: [
        {
          messageId: "invalidRouteModule",
          data: { modulePath: "./type-only.ts" },
        },
      ],
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./comment-only.ts"),
      errors: [
        {
          messageId: "invalidRouteModule",
          data: { modulePath: "./comment-only.ts" },
        },
      ],
    },
    {
      filename: "tests/fixtures/path-app/app/routes.ts",
      settings: fixtureSettings,
      code: routeConfig("./allowed.ts"),
      errors: [
        {
          messageId: "invalidRouteModule",
          data: { modulePath: "./allowed.ts" },
        },
      ],
    },
  ],
});
