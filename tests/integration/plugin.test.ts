import { ESLint } from "eslint";
import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import plugin from "../../src/index.js";
import packageJson from "../../package.json";

const parserConfig = {
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
};

const ruleNames = [
  "consistent-route-module-extension",
  "no-action-form-default-method",
  "no-action-only-routes",
  "no-browser-only-imports-in-server-exports",
  "no-broad-action-origin",
  "no-conflicting-route-paths",
  "no-conflicting-route-exports",
  "no-duplicate-route-ids",
  "no-duplicate-route-params",
  "no-deprecated-react-router-api",
  "no-invalid-route-exports",
  "no-multiple-middleware-next",
  "no-orphan-route-modules",
  "no-resource-route-client-navigation",
  "no-route-manifest-collision",
  "no-sensitive-error-output",
  "no-server-only-imports-in-client-exports",
  "prefer-link-for-internal-navigation",
  "require-hydrate-fallback",
  "require-outlet-for-child-routes",
  "require-resource-content-type",
  "require-route-error-boundary",
  "require-root-error-boundary",
  "return-server-middleware-response",
  "resource-route-returns-response",
  "safe-should-revalidate",
  "splittable-route-module",
  "valid-prerender-paths",
  "valid-resource-route",
  "valid-route-config",
  "valid-route-module",
  "valid-route-module-path",
  "valid-route-params",
] as const;

function projectEslint(cwd: string, rules: Record<string, unknown>): ESLint {
  return new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        ...parserConfig,
        plugins: { "react-router": plugin as never },
        settings: {
          reactRouter: {
            appDirectory: "app",
            routeConfig: "app/routes.ts",
            rootRoute: ["app/root.*"],
            routeModuleFiles: ["app/routes/**/*"],
          },
        },
        rules: rules as never,
      },
    ],
  });
}

describe("plugin package", () => {
  it("exports the documented rules and flat configs", () => {
    expect(plugin.meta).toMatchObject({
      name: "eslint-plugin-react-router",
      version: packageJson.version,
      namespace: "react-router",
    });
    expect(Object.keys(plugin.rules)).toEqual([...ruleNames]);
    expect(plugin.rules["valid-resource-route"]).toBe(
      plugin.rules["resource-route-returns-response"],
    );
    expect(plugin.configs).toHaveProperty("recommended");
    expect(plugin.configs).toHaveProperty("strict");
    expect(plugin.configs).toHaveProperty("all");
    expect(plugin.configs).toHaveProperty("rsc");
    expect(plugin.configs["flat/recommended"]).toBe(plugin.configs.recommended);
    expect(plugin.configs["flat/strict"]).toBe(plugin.configs.strict);
    expect(plugin.configs["flat/all"]).toBe(plugin.configs.all);
    expect(plugin.configs["flat/rsc"]).toBe(plugin.configs.rsc);

    const allConfig = plugin.configs.all as { rules?: Record<string, unknown> };
    const recommendedConfig = plugin.configs.recommended as {
      rules?: Record<string, unknown>;
    };
    const strictConfig = plugin.configs.strict as { rules?: Record<string, unknown> };
    const rscConfig = plugin.configs.rsc as { rules?: Record<string, unknown> };
    const allRuleNames = Object.keys(allConfig.rules ?? {}).map((name) =>
      name.replace(/^react-router\//u, ""),
    );
    expect(allRuleNames.sort()).toEqual([...ruleNames].sort());
    expect(recommendedConfig.rules?.["react-router/valid-route-config"]).toBe("error");
    expect(strictConfig.rules?.["react-router/no-action-only-routes"]).toBe("error");
    expect(rscConfig.rules?.["react-router/no-conflicting-route-exports"]).toEqual([
      "error",
      { rsc: true },
    ]);
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

  it("applies strict and RSC presets through ESLint", async () => {
    const strictEslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        plugin.configs.strict as never,
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
    const [strictResult] = await strictEslint.lintText(
      "export const action = () => null;",
      { filePath: "app/routes/action.tsx" },
    );
    expect(strictResult?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "react-router/no-action-only-routes",
          severity: 2,
        }),
      ]),
    );

    const rscEslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        plugin.configs.rsc as never,
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
    const [rscResult] = await rscEslint.lintText(
      "export default function Route() { return null; } export function ServerComponent() { return null; }",
      { filePath: "app/routes/rsc.tsx" },
    );
    expect(rscResult?.messages).toHaveLength(2);
    expect(
      rscResult?.messages.every(
        (message) => message.ruleId === "react-router/no-conflicting-route-exports",
      ),
    ).toBe(true);
  });

  it("invalidates cached route fragments when their contents change", async () => {
    const project = await mkdtemp(path.join(os.tmpdir(), "react-router-cache-"));
    try {
      await mkdir(path.join(project, "app", "routes"), { recursive: true });
      await writeFile(
        path.join(project, "app", "routes.ts"),
        'import fragment from "./fragment"; export default [...fragment];',
      );
      await writeFile(
        path.join(project, "app", "fragment.ts"),
        'import { route } from "@react-router/dev/routes"; export default [route("home", "./routes/home.tsx")];',
      );
      await writeFile(
        path.join(project, "app", "routes", "home.tsx"),
        "export default function Home() { return null; }",
      );

      const eslint = projectEslint(project, {
        "react-router/valid-route-module-path": "error",
      });
      const first = await eslint.lintFiles(["app/routes.ts"]);
      expect(first[0]?.messages).toHaveLength(0);

      const fragment = path.join(project, "app", "fragment.ts");
      await writeFile(
        fragment,
        'import { route } from "@react-router/dev/routes"; export default [route("missing", "./routes/does-not-exist.tsx")];',
      );
      const future = new Date(Date.now() + 2_000);
      await utimes(fragment, future, future);

      const second = await eslint.lintFiles(["app/routes.ts"]);
      expect(second[0]?.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: "react-router/valid-route-module-path",
            messageId: "unresolvedRouteModule",
          }),
        ]),
      );
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });
});
