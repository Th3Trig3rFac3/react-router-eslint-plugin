import rule from "../../src/rules/no-broad-action-origin.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-broad-action-origin", rule, {
  valid: [
    {
      filename: "react-router.config.ts",
      code: `export default { allowedActionOrigins: ["https://example.com"] };`,
    },
    {
      filename: "react-router.config.ts",
      code: `const allowedActionOrigins = ["*"]; export default { allowedActionOrigins: ["example.com"] };`,
    },
    {
      filename: "react-router.config.ts",
      code: `export const allowedActionOrigins = ["*"];`,
    },
    {
      filename: "react-router.config.ts",
      code: `const defaults = { allowedActionOrigins: ["*"] }; export default { ...defaults, allowedActionOrigins: ["example.com"] };`,
    },
    {
      filename: "react-router.config.ts",
      code: `const origins = ["*"]; export default { allowedActionOrigins: origins };`,
      options: [{ allow: ["*"] }],
    },
  ],
  invalid: [
    {
      filename: "react-router.config.ts",
      code: `export default { allowedActionOrigins: ["*"] };`,
      errors: [{ messageId: "broadOrigin" }],
    },
    {
      filename: "react-router.config.ts",
      code: `const origins = ["**.example.com"]; const config = { allowedActionOrigins: origins }; export default config;`,
      errors: [{ messageId: "broadOrigin" }],
    },
    {
      filename: "react-router.config.ts",
      code: `export default { allowedActionOrigins: ["example.com", "https://*.example.com"] };`,
      errors: [{ messageId: "broadOrigin" }],
    },
    {
      filename: "react-router.config.ts",
      code: `export default { allowedActionOrigins: ["*", process.env.ORIGIN] };`,
      errors: [{ messageId: "broadOrigin" }],
    },
  ],
});
