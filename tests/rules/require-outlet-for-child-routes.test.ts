import rule from "../../src/rules/require-outlet-for-child-routes.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("require-outlet-for-child-routes", rule, {
  valid: [
    {
      filename: "app/routes/layout.tsx",
      code: `export default function Layout() { return <Outlet />; }`,
      options: [{ files: ["app/routes/layout.tsx"] }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/layout.tsx",
      code: `export default function Layout() { return <main />; }`,
      options: [{ files: ["app/routes/layout.tsx"] }],
      errors: [{ messageId: "missingOutlet" }],
    },
  ],
});
