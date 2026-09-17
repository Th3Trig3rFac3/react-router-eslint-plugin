import { ESLint } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import plugin from "../../src/index.js";

describe("plugin package", () => {
  it("exports the documented rules and flat configs", () => {
    expect(plugin.meta).toMatchObject({
      name: "eslint-plugin-react-router",
      namespace: "react-router",
    });
    expect(Object.keys(plugin.rules)).toEqual(
      expect.arrayContaining([
        "no-action-only-routes",
        "no-invalid-route-exports",
        "require-root-error-boundary",
        "resource-route-returns-response",
        "valid-resource-route",
        "valid-route-module-path",
      ]),
    );
    expect(plugin.configs).toHaveProperty("recommended");
    expect(plugin.configs).toHaveProperty("strict");
  });

  it("loads through ESLint flat config", async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        plugin.configs.recommended as never,
        {
          files: ["**/*.tsx"],
          languageOptions: {
            parser,
            parserOptions: {
              ecmaVersion: "latest",
              sourceType: "module",
              ecmaFeatures: { jsx: true },
            },
          },
        },
      ],
    });

    const [result] = await eslint.lintText(
      "export default function Root() { return <main />; }",
      { filePath: "app/root.tsx" },
    );

    expect(result?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "react-router/require-root-error-boundary" }),
      ]),
    );
  });
});
