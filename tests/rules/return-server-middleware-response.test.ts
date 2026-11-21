import { ESLint } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import plugin from "../../src/index.js";
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

describe("return-server-middleware-response schema", () => {
  it("declares no rule options and rejects legacy allow options", async () => {
    expect(rule.meta.schema).toEqual([]);
    expect(rule.defaultOptions).toEqual([]);

    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ["**/*.ts"],
          languageOptions: { parser },
          plugins: { "react-router": plugin as never },
          rules: {
            "react-router/return-server-middleware-response": [
              "error",
              { allow: ["auth"] },
            ] as never,
          },
        },
      ],
    });

    await expect(
      eslint.lintText("export const middleware = [];", {
        filePath: "app/routes/auth.ts",
      }),
    ).rejects.toThrow();
  });
});
