import rule from "../../src/rules/require-route-error-boundary.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("require-route-error-boundary", rule, {
  valid: [
    {
      filename: "app/routes/admin/layout.tsx",
      code: `export function ErrorBoundary() { return null; }`,
      options: [{ files: ["app/routes/admin/layout.tsx"] }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/admin/layout.tsx",
      code: `export default function Layout() { return null; }`,
      options: [{ files: ["app/routes/admin/layout.tsx"] }],
      errors: [{ messageId: "missingRouteErrorBoundary" }],
    },
  ],
});
