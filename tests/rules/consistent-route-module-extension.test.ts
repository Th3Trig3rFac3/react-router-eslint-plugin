import rule from "../../src/rules/consistent-route-module-extension.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("consistent-route-module-extension", rule, {
  valid: [
    {
      filename: "app/routes.ts",
      code: `import { route } from "@react-router/dev/routes"; export default [route("home", "./home")];`,
      options: [{ mode: "never" }],
    },
  ],
  invalid: [
    {
      filename: "app/routes.ts",
      code: `import { route } from "@react-router/dev/routes"; export default [route("home", "./home")];`,
      options: [{ mode: "always", extension: ".tsx" }],
      errors: [{ messageId: "inconsistentExtension" }],
    },
  ],
});
