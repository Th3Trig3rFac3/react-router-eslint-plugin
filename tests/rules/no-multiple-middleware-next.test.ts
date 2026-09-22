import rule from "../../src/rules/no-multiple-middleware-next.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-multiple-middleware-next", rule, {
  valid: [
    {
      filename: "app/routes/auth.ts",
      code: `export const middleware = [async ({}, next) => { await next(); return null; }];`,
    },
    {
      filename: "app/routes/conditional.ts",
      code: `export const middleware = async ({}, next) => { if (ok) await next(); await next(); };`,
    },
    {
      filename: "app/routes/local.ts",
      code: `const auth = async ({}, next) => { await next(); }; export const middleware = [auth];`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/auth.ts",
      code: `export const middleware = async ({}, next) => { await next(); await next(); };`,
      errors: [{ messageId: "multipleNext" }],
    },
  ],
});
