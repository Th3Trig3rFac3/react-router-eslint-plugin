import rule from "../../src/rules/splittable-route-module.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("splittable-route-module", rule, {
  valid: [
    {
      filename: "app/routes/client.tsx",
      code: `const value = 1; export const clientLoader = () => value;`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/client.tsx",
      code: `let requestCount = 0; export const clientLoader = () => ++requestCount;`,
      errors: [{ messageId: "unsplittableState", data: { name: "requestCount" } }],
    },
  ],
});
