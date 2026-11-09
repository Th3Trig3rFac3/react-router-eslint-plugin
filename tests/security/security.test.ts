import { ESLint } from "eslint";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import parser from "@typescript-eslint/parser";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import plugin from "../../src/index.js";
import {
  isPathInsideProject,
  resolveRouteModule,
} from "../../src/utils/path-resolution.js";
import {
  analyzeProjectRouteConfig,
  clearProjectRouteCache,
} from "../../src/utils/project-route-config.js";
import { clearPatternCache, matchesPattern } from "../../src/utils/settings.js";

function createMockContext(options: {
  filename?: string;
  cwd?: string;
  settings?: Record<string, unknown>;
}): TSESLint.RuleContext<string, readonly unknown[]> {
  const cwd = options.cwd ?? path.resolve("tests/fixtures/path-app");
  const filename = options.filename ?? path.join(cwd, "app/routes.ts");
  return {
    id: "security-check",
    options: [] as readonly unknown[],
    settings: options.settings ?? {
      reactRouter: {
        appDirectory: "app",
        routeConfig: "app/routes.ts",
        rootRoute: ["app/root.*"],
        routeModuleFiles: ["app/routes/**/*"],
      },
    },
    filename,
    getFilename: () => filename,
    getCwd: () => cwd,
    cwd,
    report: vi.fn(),
  } as unknown as TSESLint.RuleContext<string, readonly unknown[]>;
}

describe("Security Boundaries & Static Analysis Guarantees", () => {
  let projectDir: string;
  let outsideDir: string;

  beforeEach(async () => {
    clearProjectRouteCache();
    clearPatternCache();
    projectDir = await mkdtemp(path.join(os.tmpdir(), "rr-sec-project-"));
    outsideDir = await mkdtemp(path.join(os.tmpdir(), "rr-sec-outside-"));
    await mkdir(path.join(projectDir, "app", "routes"), { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    clearProjectRouteCache();
    clearPatternCache();
    if (projectDir) await rm(projectDir, { recursive: true, force: true });
    if (outsideDir) await rm(outsideDir, { recursive: true, force: true });
  });

  describe("Path Traversal & Boundary Protection", () => {
    it("rejects path traversal attempting to escape project root", () => {
      const context = createMockContext({ cwd: projectDir });

      // Relative escapes stepping out of projectDir
      expect(resolveRouteModule(context, "../../etc/passwd").candidates).toEqual([]);
      expect(resolveRouteModule(context, "../../outside.tsx").candidates).toEqual([]);
      expect(resolveRouteModule(context, "../../../secrets.json").candidates).toEqual([]);

      // Home directory alias
      expect(resolveRouteModule(context, "~/secret.tsx").candidates).toEqual([]);

      // Absolute paths outside project
      const outsideFile = path.join(outsideDir, "secret.txt");
      expect(resolveRouteModule(context, outsideFile).candidates).toEqual([]);
    });

    it("rejects query and hash smuggling designed to escape boundaries", () => {
      const context = createMockContext({ cwd: projectDir });

      // Queries/hashes that resolve safely within project directory
      expect(resolveRouteModule(context, "./valid.tsx?param=123").candidates).toEqual(
        expect.arrayContaining([
          expect.stringContaining(path.join(projectDir, "app", "valid.tsx")),
        ]),
      );

      // Smuggled queries/hashes attempting to traverse out of project
      expect(resolveRouteModule(context, "../../outside.tsx?foo=bar").candidates).toEqual(
        [],
      );
      expect(resolveRouteModule(context, "../../outside.tsx#section").candidates).toEqual(
        [],
      );
    });

    it("neutralizes null-byte injections without calling filesystem APIs", () => {
      const context = createMockContext({ cwd: projectDir });
      const statSpy = vi.spyOn(fs, "statSync");

      const result = resolveRouteModule(context, "./routes/home.tsx\0.js");
      expect(result.candidates).toEqual([]);
      expect(result.absolutePath).toBeUndefined();
      expect(statSpy).not.toHaveBeenCalled();
    });
  });

  describe("Symlink Escape Protection", () => {
    it("rejects symlinks that point outside the project root", async () => {
      const sensitiveFile = path.join(outsideDir, "credentials.env");
      await writeFile(sensitiveFile, "API_SECRET=leak");

      const symlinkTarget = path.join(projectDir, "app", "routes", "leak.tsx");
      let symlinkCreated = false;
      try {
        await symlink(sensitiveFile, symlinkTarget);
        symlinkCreated = true;
      } catch {
        // Symlinks may require elevated privileges on Windows without developer mode
      }

      const context = createMockContext({ cwd: projectDir });

      if (symlinkCreated) {
        expect(isPathInsideProject(projectDir, fs.realpathSync(symlinkTarget))).toBe(
          false,
        );
        const resolved = resolveRouteModule(context, "./routes/leak.tsx");
        expect(resolved.absolutePath).toBeUndefined();
      } else {
        // Verify through realpathSync spy when symlinks cannot be created by OS
        vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true } as fs.Stats);
        vi.spyOn(fs, "realpathSync").mockImplementation((target) => {
          const targetStr = String(target);
          if (targetStr.includes("leak.tsx")) return sensitiveFile;
          return targetStr;
        });

        expect(isPathInsideProject(projectDir, sensitiveFile)).toBe(false);
        const resolved = resolveRouteModule(context, "./routes/leak.tsx");
        expect(resolved.absolutePath).toBeUndefined();
      }
    });
  });

  describe("Graph Cycle & Depth Exhaustion Bounds", () => {
    it("halts safely on mutual circular imports without infinite recursion", async () => {
      const appDir = path.join(projectDir, "app");
      // Create circular route fragments: a.ts -> b.ts -> c.ts -> a.ts
      await writeFile(
        path.join(appDir, "a.ts"),
        'import b from "./b"; export default [...b];',
      );
      await writeFile(
        path.join(appDir, "b.ts"),
        'import c from "./c"; export default [...c];',
      );
      await writeFile(
        path.join(appDir, "c.ts"),
        'import a from "./a"; export default [...a];',
      );
      await writeFile(
        path.join(appDir, "routes.ts"),
        'import fragmentA from "./a"; export default [...fragmentA];',
      );

      const context = createMockContext({
        cwd: projectDir,
        filename: path.join(appDir, "routes.ts"),
      });

      const program = parser.parse(
        'import fragmentA from "./a"; export default [...fragmentA];',
        {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      ) as TSESTree.Program;

      const t0 = performance.now();
      const analysis = analyzeProjectRouteConfig(context, program);
      const elapsed = performance.now() - t0;

      // Must complete swiftly without stack overflow
      expect(elapsed).toBeLessThan(500);
      expect(analysis.hasUnknownImports).toBe(true);
    });

    it("enforces maxDepth = 16 bound on excessively deep fragment chains", async () => {
      const appDir = path.join(projectDir, "app");
      // Create chain: f0 -> f1 -> ... -> f20
      for (let i = 0; i <= 20; i += 1) {
        const nextImport =
          i < 20
            ? `import f${i + 1} from "./f${i + 1}"; export default [...f${i + 1}];`
            : "export default [];";
        await writeFile(path.join(appDir, `f${i}.ts`), nextImport);
      }
      await writeFile(
        path.join(appDir, "routes.ts"),
        'import f0 from "./f0"; export default [...f0];',
      );

      const context = createMockContext({
        cwd: projectDir,
        filename: path.join(appDir, "routes.ts"),
      });

      const program = parser.parse('import f0 from "./f0"; export default [...f0];', {
        ecmaVersion: "latest",
        sourceType: "module",
      }) as TSESTree.Program;

      const analysis = analyzeProjectRouteConfig(context, program);
      expect(analysis.hasUnknownImports).toBe(true);
      expect(analysis.importedFiles.length).toBeLessThanOrEqual(16);
    });
  });

  describe("Glob & Brace Expansion DoS Protection", () => {
    it("bounds explosive brace expansion to prevent CPU/memory exhaustion", () => {
      // 10 pairs of 2 alternatives = 2^10 = 1024 alternatives without bounds
      const pathologicalPattern = "{a,b}{c,d}{e,f}{g,h}{i,j}{k,l}{m,n}{o,p}{q,r}{s,t}";

      const t0 = performance.now();
      const matches = matchesPattern("app/routes/test.tsx", pathologicalPattern);
      const elapsed = performance.now() - t0;

      expect(matches).toBe(false);
      // Execution must complete in under 20ms
      expect(elapsed).toBeLessThan(20);
    });

    it("collapses pathological repetitive glob patterns (**/**/**)", () => {
      const pathologicalGlob = "app/**/**/**/**/**/**/**/**/test.tsx";

      const t0 = performance.now();
      const matches = matchesPattern("app/routes/nested/sub/test.tsx", pathologicalGlob);
      const elapsed = performance.now() - t0;

      expect(matches).toBe(true);
      expect(elapsed).toBeLessThan(20);
    });
  });

  describe("Zero Code Execution Guarantee", () => {
    it("never executes user code or side effects during linting", async () => {
      const maliciousRouteModule = path.join(projectDir, "app", "routes", "evil.tsx");
      const maliciousCode = `
        // Side-effect payload that should NEVER execute
        (globalThis as any).__PWNED_GLOBAL__ = true;
        if (typeof process !== "undefined") {
          (process as any).__PWNED_PROCESS__ = true;
        }

        export async function loader() {
          (globalThis as any).__PWNED_LOADER__ = true;
          return null;
        }

        export default function EvilRoute() {
          (globalThis as any).__PWNED_COMPONENT__ = true;
          return <div>Evil</div>;
        }
      `;
      await writeFile(maliciousRouteModule, maliciousCode);

      await writeFile(
        path.join(projectDir, "app", "root.tsx"),
        `export function ErrorBoundary() { return null; }
         export default function Root() { return null; }`,
      );

      await writeFile(
        path.join(projectDir, "app", "routes.ts"),
        `import { route } from "@react-router/dev/routes";
         export default [route("evil", "./routes/evil.tsx")];`,
      );

      const eslint = new ESLint({
        cwd: projectDir,
        overrideConfigFile: true,
        overrideConfig: [
          plugin.configs.recommended as never,
          {
            files: ["app/**/*.{ts,tsx}"],
            languageOptions: {
              parser,
              parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: { jsx: true },
              },
            },
            settings: {
              reactRouter: {
                appDirectory: "app",
                routeConfig: "app/routes.ts",
                rootRoute: ["app/root.tsx"],
                routeModuleFiles: ["app/routes/**/*.tsx"],
              },
            },
          },
        ],
      });

      const results = await eslint.lintFiles(["app/routes/evil.tsx", "app/routes.ts"]);
      expect(results.length).toBe(2);

      // Verify that NO code in the malicious module was ever evaluated
      expect((globalThis as Record<string, unknown>).__PWNED_GLOBAL__).toBeUndefined();
      expect(
        (process as unknown as Record<string, unknown>).__PWNED_PROCESS__,
      ).toBeUndefined();
      expect((globalThis as Record<string, unknown>).__PWNED_LOADER__).toBeUndefined();
      expect((globalThis as Record<string, unknown>).__PWNED_COMPONENT__).toBeUndefined();
    });
  });
});
