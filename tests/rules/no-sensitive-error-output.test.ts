import rule from "../../src/rules/no-sensitive-error-output.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-sensitive-error-output", rule, {
  valid: [
    {
      filename: "app/root.tsx",
      code: `export function ErrorBoundary({ error }) { return <p>Something went wrong</p>; }`,
    },
  ],
  invalid: [
    {
      filename: "app/root.tsx",
      code: `export function ErrorBoundary({ error }) { return <pre>{error.stack}</pre>; }`,
      errors: [{ messageId: "sensitiveErrorOutput" }],
    },
  ],
});
