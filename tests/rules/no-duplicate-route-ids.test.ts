import rule from "../../src/rules/no-duplicate-route-ids.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-duplicate-route-ids", rule, {
  valid: [
    {
      filename: "app/routes.ts",
      code: `
        export default [
          { id: "home", file: "./home.tsx" },
          { id: getId(), file: "./settings.tsx" },
        ];
      `,
    },
  ],
  invalid: [
    {
      filename: "app/routes.ts",
      code: `
        export default [
          { id: "settings", path: "settings", file: "./settings.tsx" },
          { id: "settings", path: "preferences", file: "./preferences.tsx" },
        ];
      `,
      errors: [
        { messageId: "duplicateRouteId", data: { id: "settings" } },
        { messageId: "duplicateRouteId", data: { id: "settings" } },
      ],
    },
    {
      filename: "app/routes.ts",
      code: `
        export default [{ file: "./parent.tsx", children: [
          { id: "nested", file: "./one.tsx" },
          { id: "nested", file: "./two.tsx" },
        ] }];
      `,
      errors: [{ messageId: "duplicateRouteId" }, { messageId: "duplicateRouteId" }],
    },
  ],
});
