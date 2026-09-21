import rule from "../../src/rules/no-conflicting-route-paths.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-conflicting-route-paths", rule, {
  valid: [
    {
      filename: "app/routes.ts",
      code: `
        import { route } from "@react-router/dev/routes";
        export default [route("users", "./users.tsx"), route("settings", "./settings.tsx")];
      `,
    },
    {
      filename: "app/routes.ts",
      code: `
        export default [{ path: "Users", caseSensitive: true, file: "./one.tsx" },
          { path: "users", caseSensitive: true, file: "./two.tsx" }];
      `,
    },
    {
      filename: "app/routes.ts",
      code: `
        import { layout, route } from "@react-router/dev/routes";
        export default [layout("./one.tsx", [route("users", "./users.tsx")]),
          layout("./two.tsx", [route("settings", "./other-settings.tsx")])];
      `,
    },
  ],
  invalid: [
    {
      filename: "app/routes.ts",
      code: `
        import { route } from "@react-router/dev/routes";
        export default [route("users", "./one.tsx"), route("users", "./two.tsx")];
      `,
      errors: [
        { messageId: "conflictingRoutePath", data: { path: "users" } },
        { messageId: "conflictingRoutePath", data: { path: "users" } },
      ],
    },
    {
      filename: "app/routes.ts",
      code: `
        import { prefix, route } from "@react-router/dev/routes";
        export default [
          ...prefix("admin", [route("users", "./one.tsx")]),
          ...prefix("admin", [route("users", "./two.tsx")]),
        ];
      `,
      errors: [
        { messageId: "conflictingRoutePath", data: { path: "admin/users" } },
        { messageId: "conflictingRoutePath", data: { path: "admin/users" } },
      ],
    },
    {
      filename: "app/routes.ts",
      code: `
        export default [
          { path: "Users", file: "./one.tsx" },
          { path: "users", file: "./two.tsx" },
        ];
      `,
      errors: [
        { messageId: "conflictingRoutePath", data: { path: "Users" } },
        { messageId: "conflictingRoutePath", data: { path: "users" } },
      ],
    },
  ],
});
