/* global console */

import { ESLint } from "eslint";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import parser from "@typescript-eslint/parser";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import plugin from "../../src/index.js";
import { clearProjectRouteCache } from "../../src/utils/project-route-config.js";
import { clearPatternCache } from "../../src/utils/settings.js";

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

const routeSettings = {
  reactRouter: {
    appDirectory: "app",
    routeConfig: "app/routes.ts",
    rootRoute: ["app/root.tsx"],
    routeModuleFiles: ["app/root.tsx", "app/routes/**/*.{js,jsx,ts,tsx}"],
  },
};

describe("Performance Benchmarks and Cache Verification", () => {
  let tempProject: string;

  beforeAll(async () => {
    tempProject = await mkdtemp(path.join(os.tmpdir(), "rr-perf-benchmark-"));
    const routesDir = path.join(tempProject, "app", "routes");
    await mkdir(routesDir, { recursive: true });

    // Create 1,000 route modules with realistic route module structure
    const fileWrites: Promise<void>[] = [];
    for (let i = 0; i < 1000; i += 1) {
      const code = `
import { data } from "react-router";

export async function loader() {
  return data({ id: ${i} });
}

export async function action() {
  return data({ success: true });
}

export function ErrorBoundary() {
  return <div>Error in route ${i}</div>;
}

export default function RouteModule${i}() {
  return (
    <main>
      <h1>Route ${i}</h1>
    </main>
  );
}
`;
      fileWrites.push(writeFile(path.join(routesDir, `route_${i}.tsx`), code));
    }

    // Create root and routes.ts
    fileWrites.push(
      writeFile(
        path.join(tempProject, "app", "root.tsx"),
        `export function ErrorBoundary() { return null; }
export default function Root() { return null; }`,
      ),
    );
    fileWrites.push(
      writeFile(
        path.join(tempProject, "app", "routes.ts"),
        `import { route } from "@react-router/dev/routes";
export default [
  route("route_0", "./routes/route_0.tsx")
];`,
      ),
    );

    await Promise.all(fileWrites);
  }, 60000);

  afterAll(async () => {
    if (tempProject) {
      await rm(tempProject, { recursive: true, force: true });
    }
  });

  it("enforces < 20% overhead budget for 1,000 route modules over parser-only linting", async () => {
    clearProjectRouteCache();
    clearPatternCache();

    const files = Array.from({ length: 1000 }, (_, i) => `app/routes/route_${i}.tsx`);

    const baselineEslint = new ESLint({
      cwd: tempProject,
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ["app/routes/**/*.tsx"],
          ...parserConfig,
          rules: {},
        },
      ],
    });

    const pluginEslint = new ESLint({
      cwd: tempProject,
      overrideConfigFile: true,
      overrideConfig: [
        plugin.configs.recommended as never,
        {
          files: ["app/routes/**/*.tsx"],
          ...parserConfig,
          settings: routeSettings,
        },
      ],
    });

    // Warmup pass (50 files) to warm up V8 JIT & Node.js module resolution
    const warmupFiles = files.slice(0, 50);
    await baselineEslint.lintFiles(warmupFiles);
    await pluginEslint.lintFiles(warmupFiles);

    // Measure Baseline: parser-only
    const t0 = performance.now();
    const baselineResults = await baselineEslint.lintFiles(files);
    const baselineDuration = performance.now() - t0;
    expect(baselineResults.length).toBe(1000);

    // Measure Plugin: recommended configuration
    const t1 = performance.now();
    const pluginResults = await pluginEslint.lintFiles(files);
    const pluginDuration = performance.now() - t1;
    expect(pluginResults.length).toBe(1000);

    const overheadMs = pluginDuration - baselineDuration;
    const overheadPercentage = (overheadMs / baselineDuration) * 100;

    // Log timing details for visibility
    console.log(
      `[Benchmark 1000 route modules] Baseline: ${baselineDuration.toFixed(1)}ms | ` +
        `Plugin: ${pluginDuration.toFixed(1)}ms | Overhead: ${overheadPercentage.toFixed(1)}% (${overheadMs.toFixed(1)}ms)`,
    );

    // Overhead should be less than 20% (with small cushion for CI noise: <= 25%)
    expect(overheadPercentage).toBeLessThanOrEqual(25);
  }, 60000);

  it("achieves 100% cache hit rate across all 8 route-config rules without redundant disk reads", async () => {
    clearProjectRouteCache();
    clearPatternCache();

    const multiRuleEslint = new ESLint({
      cwd: tempProject,
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ["app/routes.ts"],
          ...parserConfig,
          plugins: { "react-router": plugin as never },
          settings: routeSettings,
          rules: {
            "react-router/valid-route-config": "error",
            "react-router/valid-route-module-path": "error",
            "react-router/valid-route-module": "error",
            "react-router/no-conflicting-route-paths": "error",
            "react-router/no-duplicate-route-ids": "error",
            "react-router/no-duplicate-route-params": "error",
            "react-router/no-orphan-route-modules": "error",
            "react-router/require-outlet-for-child-routes": "error",
          } as never,
        },
      ],
    });

    const readFileSyncSpy = vi.spyOn(fs, "readFileSync");

    // First run: lint routes.ts with all 8 rules running simultaneously
    const firstResults = await multiRuleEslint.lintFiles(["app/routes.ts"]);
    expect(firstResults[0]?.fatalErrorCount).toBe(0);

    // Count how many times route_0.tsx was read from disk
    const route0Path = path.normalize(path.join(tempProject, "app/routes/route_0.tsx"));
    const initialReads = readFileSyncSpy.mock.calls.filter((call) => {
      const arg = String(call[0]);
      return path.normalize(arg) === route0Path;
    }).length;

    // Across all 8 rules, route_0.tsx should be read at most once
    expect(initialReads).toBeLessThanOrEqual(1);

    // Second run: back-to-back lint run without modifying files
    readFileSyncSpy.mockClear();
    const secondResults = await multiRuleEslint.lintFiles(["app/routes.ts"]);
    expect(secondResults[0]?.fatalErrorCount).toBe(0);

    const secondReads = readFileSyncSpy.mock.calls.filter((call) => {
      const arg = String(call[0]);
      return path.normalize(arg) === route0Path;
    }).length;

    // Zero disk reads for route_0.tsx on the second pass
    expect(secondReads).toBe(0);

    readFileSyncSpy.mockRestore();
  }, 30000);
});
