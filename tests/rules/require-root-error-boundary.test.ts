import rule from "../../src/rules/require-root-error-boundary.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("require-root-error-boundary", rule, {
  valid: [
    {
      filename: "app/root.tsx",
      code: `
        export default function Root() { return <Outlet />; }
        export function ErrorBoundary() { return <h1>Error</h1>; }
      `,
    },
    {
      filename: "app/routes/home.tsx",
      code: `export default function Home() { return <h1>Home</h1>; }`,
    },
    {
      filename: "src/root.tsx",
      code: `
        export default function Root() { return null; }
        export function ErrorBoundary() { return null; }
      `,
      settings: {
        reactRouter: { rootRoute: "src/root.tsx", routeModuleFiles: ["src/**/*"] },
      },
    },
  ],
  invalid: [
    {
      filename: "app/root.tsx",
      code: `export default function Root() { return <Outlet />; }`,
      errors: [{ messageId: "missingRootErrorBoundary" }],
    },
    {
      filename: "src/root.tsx",
      code: `export default function Root() { return null; }`,
      settings: {
        reactRouter: { rootRoute: "src/root.tsx", routeModuleFiles: ["src/**/*"] },
      },
      errors: [{ messageId: "missingRootErrorBoundary" }],
    },
  ],
});
