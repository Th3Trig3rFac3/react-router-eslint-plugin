import rule from "../../src/rules/valid-route-config.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("valid-route-config", rule, {
  valid: [
    {
      filename: "app/routes.ts",
      code: `
        import { index, layout, prefix, route } from "@react-router/dev/routes";
        export default [
          index("./home.tsx"),
          route("settings", "./settings.tsx", [index("./settings-home.tsx")]),
          layout("./layout.tsx", [
            ...prefix("admin", [route("users", "./users.tsx")]),
          ]),
        ] satisfies RouteConfig;
      `,
    },
    {
      filename: "app/routes.ts",
      code: `
        import * as rr from "@react-router/dev/routes";
        const children = [{ path: "reports", file: "./reports.tsx", id: "reports" }];
        const routes = rr.relative("features");
        export default [...children, routes.route("settings", "./settings.tsx")];
      `,
    },
    {
      filename: "app/routes.ts",
      code: `
        import { flatRoutes } from "@react-router/fs-routes";
        export default [...flatRoutes()];
      `,
    },
    {
      filename: "app/routes.ts",
      code: `
        import { flatRoutes } from "@react-router/fs-routes";
        export default flatRoutes();
      `,
    },
  ],
  invalid: [
    {
      filename: "app/routes.ts",
      code: `
        import { index } from "@react-router/dev/routes";
        export default [index("./home.tsx", [])];
      `,
      errors: [{ messageId: "indexChildren" }],
    },
    {
      filename: "app/routes.ts",
      code: `
        export default [{ path: "settings", file: getFile() }];
      `,
      errors: [{ messageId: "invalidFile" }],
    },
    {
      filename: "app/routes.ts",
      code: `
        export default [{ path: "settings", file: "./settings.tsx", children: {} }];
      `,
      errors: [{ messageId: "invalidChildren" }],
    },
    {
      filename: "app/routes.ts",
      code: `export default [42];`,
      errors: [{ messageId: "invalidEntry" }],
    },
  ],
});
