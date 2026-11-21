import { ESLint } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import plugin from "../../src/index.js";
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
      errors: [{ messageId: "multipleNext", data: { middlewareName: "middleware" } }],
    },
    {
      filename: "app/routes/client.ts",
      code: `export const clientMiddleware = async ({}, next) => { await next(); await next(); };`,
      errors: [
        { messageId: "multipleNext", data: { middlewareName: "clientMiddleware" } },
      ],
    },
  ],
});

describe("no-multiple-middleware-next schema", () => {
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
            "react-router/no-multiple-middleware-next": [
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
