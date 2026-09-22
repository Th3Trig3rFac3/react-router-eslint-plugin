import rule from "../../src/rules/return-server-middleware-response.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("return-server-middleware-response", rule, {
  valid: [
    {
      filename: "app/routes/auth.ts",
      code: `export const middleware = async ({}, next) => { const response = await next(); return response; };`,
    },
    {
      filename: "app/routes/client.ts",
      code: `export const clientMiddleware = async ({}, next) => { await next(); };`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/auth.ts",
      code: `export const middleware = async ({}, next) => { await next(); };`,
      errors: [{ messageId: "discardedNextResponse" }],
    },
  ],
});
