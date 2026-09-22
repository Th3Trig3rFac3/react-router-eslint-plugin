import rule from "../../src/rules/no-route-manifest-collision.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-route-manifest-collision", rule, {
  valid: [
    {
      filename: "react-router.config.ts",
      code: `export default { manifestPath: "/__manifest" };`,
      options: [{ routePaths: ["/home"] }],
    },
  ],
  invalid: [
    {
      filename: "react-router.config.ts",
      code: `export default { manifestPath: "/home" };`,
      options: [{ routePaths: ["/home"] }],
      errors: [{ messageId: "manifestCollision" }],
    },
  ],
});
