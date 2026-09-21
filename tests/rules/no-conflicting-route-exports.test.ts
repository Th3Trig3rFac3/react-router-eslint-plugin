import rule from "../../src/rules/no-conflicting-route-exports.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-conflicting-route-exports", rule, {
  valid: [
    {
      filename: "app/routes/product.tsx",
      code: `
        export default function Product() { return <div />; }
        export function ErrorBoundary() { return <p>Error</p>; }
      `,
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        export default function Product() { return <div />; }
        export function ServerComponent() { return <div />; }
      `,
      options: [{ rsc: false }],
    },
    {
      filename: "app/routes/product.tsx",
      code: `export * from "./shared"; export default function Product() { return null; }`,
      options: [{ rsc: true }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/product.tsx",
      code: `
        export default function Product() { return <div />; }
        export function ServerComponent() { return <div />; }
      `,
      options: [{ rsc: true }],
      errors: [
        {
          messageId: "conflictingExports",
          data: { clientExport: "default", serverExport: "ServerComponent" },
        },
        {
          messageId: "conflictingExports",
          data: { clientExport: "default", serverExport: "ServerComponent" },
        },
      ],
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        export const ErrorBoundary = () => null;
        export const ServerErrorBoundary = () => null;
        export const Layout = () => null;
        export const ServerLayout = () => null;
      `,
      options: [{ rsc: true }],
      errors: [
        { messageId: "conflictingExports" },
        { messageId: "conflictingExports" },
        { messageId: "conflictingExports" },
        { messageId: "conflictingExports" },
      ],
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        function Boundary() { return null; }
        export { Boundary as HydrateFallback, Boundary as ServerHydrateFallback };
      `,
      options: [{ rsc: true }],
      errors: [{ messageId: "conflictingExports" }, { messageId: "conflictingExports" }],
    },
  ],
});
