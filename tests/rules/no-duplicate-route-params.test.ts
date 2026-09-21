import rule from "../../src/rules/no-duplicate-route-params.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-duplicate-route-params", rule, {
  valid: [
    {
      filename: "app/routes.ts",
      code: `
        import { route } from "@react-router/dev/routes";
        export default [route("teams/:teamId/members/:memberId", "./member.tsx")];
      `,
    },
    {
      filename: "app/routes.ts",
      code: `
        import { route } from "@react-router/dev/routes";
        export default [route("teams/:id", "./team.tsx", [route("members/:memberId", "./member.tsx")])];
      `,
      options: [],
    },
  ],
  invalid: [
    {
      filename: "app/routes.ts",
      code: `
        import { route } from "@react-router/dev/routes";
        export default [route("teams/:id/members/:id", "./member.tsx")];
      `,
      errors: [
        {
          messageId: "duplicateRouteParam",
          data: { name: "id", path: "teams/:id/members/:id" },
        },
      ],
    },
    {
      filename: "app/routes.ts",
      code: `
        import { prefix, route } from "@react-router/dev/routes";
        export default [...prefix("teams/:id", [route("members/:id", "./member.tsx")])];
      `,
      errors: [
        {
          messageId: "duplicateRouteParam",
          data: { name: "id", path: "teams/:id/members/:id" },
        },
      ],
    },
  ],
});
