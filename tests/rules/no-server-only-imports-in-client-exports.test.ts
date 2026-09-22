import rule from "../../src/rules/no-server-only-imports-in-client-exports.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-server-only-imports-in-client-exports", rule, {
  valid: [
    {
      filename: "app/routes/client.tsx",
      code: `import { value } from "./value"; export const clientLoader = () => value;`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/client.tsx",
      code: `import fs from "node:fs"; export const clientLoader = () => fs.existsSync(".");`,
      errors: [{ messageId: "serverOnlyImport" }],
    },
  ],
});
