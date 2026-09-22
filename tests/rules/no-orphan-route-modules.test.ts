import { ESLint } from "eslint";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import plugin from "../../src/index.js";

const routeSettings = {
  reactRouter: {
    appDirectory: "app",
    routeConfig: "app/routes.ts",
    rootRoute: ["app/root.*"],
    routeModuleFiles: ["app/routes/**/*"],
  },
};

async function makeProject(): Promise<string> {
  const project = await mkdtemp(path.join(os.tmpdir(), "react-router-orphans-"));
  await mkdir(path.join(project, "app", "routes"), { recursive: true });
  await writeFile(
    path.join(project, "app", "routes.ts"),
    `import { route } from "@react-router/dev/routes";
     export default [route("home", "./routes/home.tsx")];`,
  );
  await writeFile(
    path.join(project, "app", "root.tsx"),
    "export default function Root() { return null; }",
  );
  await writeFile(
    path.join(project, "app", "routes", "home.tsx"),
    "export default function Home() { return null; }",
  );
  await writeFile(
    path.join(project, "app", "routes", "unused.tsx"),
    "export default function Unused() { return null; }",
  );
  await writeFile(
    path.join(project, "app", "routes", "allowed.tsx"),
    "export default function Allowed() { return null; }",
  );
  await writeFile(
    path.join(project, "app", "routes", "ignored.tsx"),
    "export default function Ignored() { return null; }",
  );
  return project;
}

async function lintRouteConfig(
  project: string,
  options: Record<string, unknown> | undefined = undefined,
): Promise<Array<{ message: string }>> {
  const eslint = new ESLint({
    cwd: project,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
          parser,
          parserOptions: { ecmaVersion: "latest", sourceType: "module" },
        },
        plugins: { "react-router": plugin as never },
        settings: routeSettings,
        rules: {
          "react-router/no-orphan-route-modules": ["error", options ?? {}],
        } as never,
      },
    ],
  });
  const [result] = await eslint.lintFiles(["app/routes.ts"]);
  return result?.messages ?? [];
}

describe("no-orphan-route-modules", () => {
  it("reports unreferenced modules and honors allowFiles and ignore", async () => {
    const project = await makeProject();
    try {
      const messages = await lintRouteConfig(project);
      expect(messages).toHaveLength(3);
      expect(messages.map((message) => message.message)).toEqual(
        expect.arrayContaining([
          expect.stringContaining("app/routes/allowed.tsx"),
          expect.stringContaining("app/routes/ignored.tsx"),
          expect.stringContaining("app/routes/unused.tsx"),
        ]),
      );

      const exempted = await lintRouteConfig(project, {
        allowFiles: ["app/routes/allowed.tsx"],
        ignore: ["app/routes/ignored.tsx"],
      });
      expect(exempted).toHaveLength(1);
      expect(exempted[0]?.message).toContain("app/routes/unused.tsx");
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  }, 15000);

  it("does not guess when route graphs are dynamic, incomplete, malformed, or cyclic", async () => {
    const project = await makeProject();
    const routeConfig = path.join(project, "app", "routes.ts");
    try {
      await writeFile(routeConfig, "export default getRoutes();");
      expect(await lintRouteConfig(project)).toHaveLength(0);

      await writeFile(
        routeConfig,
        'import fragment from "./missing"; export default [...fragment];',
      );
      expect(await lintRouteConfig(project)).toHaveLength(0);

      await writeFile(
        routeConfig,
        'import fragment from "../outside"; export default [...fragment];',
      );
      expect(await lintRouteConfig(project)).toHaveLength(0);

      await writeFile(path.join(project, "app", "fragment.ts"), "export default [;");
      await writeFile(
        routeConfig,
        'import fragment from "./fragment"; export default [...fragment];',
      );
      expect(await lintRouteConfig(project)).toHaveLength(0);

      await writeFile(
        path.join(project, "app", "a.ts"),
        'import b from "./b"; export default [...b];',
      );
      await writeFile(
        path.join(project, "app", "b.ts"),
        'import a from "./a"; export default [...a];',
      );
      await writeFile(
        routeConfig,
        'import fragment from "./a"; export default [...fragment];',
      );
      expect(await lintRouteConfig(project)).toHaveLength(0);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  }, 15000);
});
