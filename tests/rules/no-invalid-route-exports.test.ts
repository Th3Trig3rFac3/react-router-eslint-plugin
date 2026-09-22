import rule from "../../src/rules/no-invalid-route-exports.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-invalid-route-exports", rule, {
  valid: [
    {
      filename: "app/routes/home.tsx",
      code: `
        export const loader = () => ({ ok: true });
        export const middleware = [];
        export const clientMiddleware = [];
        export const ServerHydrateFallback = () => null;
        export const handle = { crumb: "Home" };
        export default function Home() { return null; }
      `,
    },
    {
      filename: "app/routes/future.tsx",
      code: `export const unstable_future = true;`,
    },
    {
      filename: "app/routes/extension.tsx",
      code: `export const customRouteMetadata = {};`,
      options: [{ allow: ["customRouteMetadata"] }],
    },
    {
      filename: "app/routes/reexport.tsx",
      code: `export * from "./shared";`,
    },
    {
      filename: "app/routes/auth.server.ts",
      code: `export const loginErrorMessage = () => ({});`,
    },
    {
      filename: "app/routes/+shared/forms.tsx",
      code: `export const FormSchema = {};`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/typo.tsx",
      code: `export const ErrorBoundry = () => null;`,
      errors: [{ messageId: "invalidExport", data: { name: "ErrorBoundry" } }],
    },
    {
      filename: "app/routes/typo.tsx",
      code: `const value = true; export { value as laoder };`,
      errors: [{ messageId: "invalidExport", data: { name: "laoder" } }],
    },
  ],
});
