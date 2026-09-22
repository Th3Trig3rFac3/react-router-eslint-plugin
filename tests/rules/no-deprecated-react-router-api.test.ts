import rule from "../../src/rules/no-deprecated-react-router-api.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-deprecated-react-router-api", rule, {
  valid: [
    {
      filename: "app/routes/data.ts",
      code: `import { data } from "react-router"; export const loader = () => data({ ok: true });`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/data.ts",
      code: `import { json } from "react-router"; export const loader = () => json({ ok: true });`,
      errors: [{ messageId: "deprecatedApi" }],
    },
  ],
});
