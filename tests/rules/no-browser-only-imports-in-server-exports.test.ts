import rule from "../../src/rules/no-browser-only-imports-in-server-exports.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-browser-only-imports-in-server-exports", rule, {
  valid: [
    {
      filename: "app/routes/server.ts",
      code: `import { value } from "./value"; export const loader = () => value;`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/server.ts",
      code: `import value from "./widget.client"; export const loader = () => value;`,
      errors: [{ messageId: "browserOnlyImport" }],
    },
  ],
});
