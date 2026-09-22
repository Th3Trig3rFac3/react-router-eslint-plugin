import rule from "../../src/rules/valid-route-params.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("valid-route-params", rule, {
  valid: [
    {
      filename: "app/routes/team.tsx",
      code: `export function loader({ params }) { return params.teamId; }`,
      options: [{ routePath: "/teams/:teamId" }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/team.tsx",
      code: `export function loader({ params }) { return params.teamID; }`,
      options: [{ routePath: "/teams/:teamId" }],
      errors: [
        {
          messageId: "invalidRouteParam",
          data: { name: "teamID", declared: "'teamId'" },
        },
      ],
    },
    {
      filename: "app/routes/team.tsx",
      code: `export function loader({ params: { teamID } }) { return teamID; }`,
      options: [{ routePath: "/teams/:teamId" }],
      errors: [
        {
          messageId: "invalidRouteParam",
          data: { name: "teamID", declared: "'teamId'" },
        },
      ],
    },
  ],
});
