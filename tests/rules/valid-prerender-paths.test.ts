import rule from "../../src/rules/valid-prerender-paths.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("valid-prerender-paths", rule, {
  valid: [
    {
      filename: "react-router.config.ts",
      code: `export default { prerender: ["/docs", "/teams/acme"] };`,
    },
    {
      filename: "react-router.config.ts",
      code: `const paths = ["/docs"]; export default { prerender: { paths } };`,
    },
    {
      filename: "react-router.config.ts",
      code: `export default { prerender: { paths: ["/docs"] } };`,
      options: [{ routePaths: ["/docs"] }],
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
      code: `export default { prerender: { paths: ["/missing"] } };`,
      options: [{ routePaths: ["/docs"] }],
      errors: [{ messageId: "invalidPrerenderPath" }],
    },
  ],
});
