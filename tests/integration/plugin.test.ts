import { ESLint } from "eslint";
import path from "node:path";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import plugin from "../../src/index.js";
import packageJson from "../../package.json";

describe("plugin package", () => {
  it("exports the documented rules and flat configs", () => {
    expect(plugin.meta).toMatchObject({
      name: "eslint-plugin-react-router",
      version: packageJson.version,
      namespace: "react-router",
    });
    expect(Object.keys(plugin.rules)).toEqual(
      expect.arrayContaining([
        "no-action-only-routes",
        "no-conflicting-route-exports",
        "no-conflicting-route-paths",
        "no-duplicate-route-ids",
        "no-duplicate-route-params",
        "no-invalid-route-exports",
        "require-hydrate-fallback",
        "require-root-error-boundary",
        "resource-route-returns-response",
        "safe-should-revalidate",
        "valid-resource-route",
        "valid-route-config",
        "valid-route-module-path",
      ]),
    );
    expect(plugin.configs).toHaveProperty("recommended");
    expect(plugin.configs).toHaveProperty("strict");
    expect(plugin.configs).toHaveProperty("all");
    expect(plugin.configs).toHaveProperty("rsc");
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

  it("indexes safe relative route-config fragments", async () => {
    const fixture = path.resolve("tests/fixtures/graph-app");
    const eslint = new ESLint({
      cwd: fixture,
      overrideConfigFile: true,
      overrideConfig: [
        plugin.configs.recommended as never,
        {
          files: ["**/*.ts"],
          languageOptions: {
            parser,
            parserOptions: { ecmaVersion: "latest", sourceType: "module" },
          },
        },
      ],
    });

    const [result] = await eslint.lintFiles(["app/routes.ts"]);
    const ruleIds = result?.messages.map((message) => message.ruleId);
    expect(ruleIds).toEqual(
      expect.arrayContaining([
        "react-router/no-conflicting-route-paths",
        "react-router/no-duplicate-route-params",
      ]),
    );
  });
});
