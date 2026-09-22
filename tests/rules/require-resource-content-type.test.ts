import rule from "../../src/rules/require-resource-content-type.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("require-resource-content-type", rule, {
  valid: [
    {
      filename: "app/routes/api/feed.ts",
      code: `export function loader() { return new Response("feed", { headers: { "Content-Type": "text/plain" } }); }`,
      options: [{ files: ["app/routes/api/**/*"] }],
    },
    {
      filename: "app/routes/api/empty.ts",
      code: `export function loader() { return new Response(); }`,
      options: [{ files: ["app/routes/api/**/*"] }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/api/feed.ts",
      code: `export function loader() { return new Response("feed"); }`,
      options: [{ files: ["app/routes/api/**/*"] }],
      errors: [{ messageId: "missingContentType" }],
    },
  ],
});
