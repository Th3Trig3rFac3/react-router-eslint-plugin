import rule from "../../src/rules/valid-prerender-paths.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("valid-prerender-paths", rule, {
  valid: [
    {
      filename: "react-router.config.ts",
      code: `export default { prerender: ["/docs", "/teams/acme"] };`,
    },
  ],
  invalid: [
    {
      filename: "react-router.config.ts",
      code: `export default { prerender: ["/teams/:teamId"] };`,
      errors: [{ messageId: "invalidPrerenderPath" }],
    },
    {
      filename: "react-router.config.ts",
      code: `export const prerender = ["/missing"];`,
      options: [{ routePaths: ["/docs"] }],
      errors: [{ messageId: "invalidPrerenderPath" }],
    },
  ],
});
