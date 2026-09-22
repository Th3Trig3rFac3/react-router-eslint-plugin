import rule from "../../src/rules/no-broad-action-origin.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-broad-action-origin", rule, {
  valid: [
    {
      filename: "react-router.config.ts",
      code: `export default { allowedActionOrigins: ["https://example.com"] };`,
    },
  ],
  invalid: [
    {
      filename: "react-router.config.ts",
      code: `export default { allowedActionOrigins: ["*"] };`,
      errors: [{ messageId: "broadOrigin" }],
    },
  ],
});
