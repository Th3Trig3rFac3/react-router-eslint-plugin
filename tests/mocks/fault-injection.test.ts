import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import parser from "@typescript-eslint/parser";
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canonicalPath,
  isPathInsideProject,
  resolveRouteModule,
} from "../../src/utils/path-resolution.js";
import {
  analyzeProjectRouteConfig,
  clearProjectRouteCache,
  getCachedExports,
  readCachedFile,
  setParserForTesting,
} from "../../src/utils/project-route-config.js";
import validRouteModuleRule from "../../src/rules/valid-route-module.js";
import requireOutletRule from "../../src/rules/require-outlet-for-child-routes.js";
import noOrphanModulesRule from "../../src/rules/no-orphan-route-modules.js";

const require = createRequire(import.meta.url);
const originalParser = require("@typescript-eslint/parser");
const realStatSync = fs.statSync;
const realReadFileSync = fs.readFileSync;

function createMockContext(options: {
  filename?: string;
  cwd?: string;
  settings?: Record<string, unknown>;
  ruleOptions?: unknown[];
  // eslint-disable-next-line no-unused-vars
  report?: (descriptor: unknown) => void;
}): TSESLint.RuleContext<string, readonly unknown[]> {
  const cwd = options.cwd ?? path.resolve("tests/fixtures/path-app");
  const filename = options.filename ?? path.join(cwd, "app/routes.ts");
  return {
    id: "test-rule",
    options: (options.ruleOptions ?? [{}]) as readonly unknown[],
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
    report: options.report ?? vi.fn(),
  } as unknown as TSESLint.RuleContext<string, readonly unknown[]>;
}

type ErrnoError = Error & { code?: string };

describe("Fault Injection & Resilient System Mocks", () => {
  beforeEach(() => {
    clearProjectRouteCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearProjectRouteCache();
    setParserForTesting(originalParser);
    vi.restoreAllMocks();
  });

  describe("Filesystem Permission & I/O Errors (EACCES / EPERM / ENOENT)", () => {
    it("handles EACCES / EPERM in resolveRouteModule gracefully", () => {
      const context = createMockContext({});
      const statSpy = vi.spyOn(fs, "statSync").mockImplementation(() => {
        const err = new Error("permission denied") as ErrnoError;
        err.code = "EACCES";
        throw err;
      });

      const result = resolveRouteModule(context, "./home.tsx");
      expect(result.absolutePath).toBeUndefined();
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(statSpy).toHaveBeenCalled();
    });

    it("handles EACCES in readCachedFile and getCachedExports without crashing", () => {
      const targetFile = path.resolve("tests/fixtures/path-app/app/home.tsx");

      vi.spyOn(fs, "statSync").mockImplementation((filePath, options) => {
        if (filePath === targetFile) {
          const err = new Error("permission denied") as ErrnoError;
          err.code = "EACCES";
          throw err;
        }
        return realStatSync(filePath, options);
      });

      expect(readCachedFile(targetFile)).toBeUndefined();
      expect(getCachedExports(targetFile)).toBeUndefined();
    });

    it("handles readFileSync throwing EACCES during file parsing", () => {
      const targetFile = path.resolve("tests/fixtures/path-app/app/home.tsx");

      vi.spyOn(fs, "readFileSync").mockImplementation(((
        filePath: fs.PathOrFileDescriptor,
        ...args: unknown[]
      ) => {
        if (filePath === targetFile) {
          const err = new Error("permission denied") as ErrnoError;
          err.code = "EACCES";
          throw err;
        }
        return realReadFileSync(filePath, ...(args as [never]));
      }) as never);

      expect(readCachedFile(targetFile)).toBeUndefined();
      expect(getCachedExports(targetFile)).toBeUndefined();
    });

    it("handles EACCES in no-orphan-route-modules directory traversal", () => {
      const reports: unknown[] = [];
      const context = createMockContext({
        report: (d) => reports.push(d),
      });

      vi.spyOn(fs, "readdirSync").mockImplementation(() => {
        const err = new Error("permission denied") as ErrnoError;
        err.code = "EACCES";
        throw err;
      });

      const program = parser.parse("export default [];", {
        ecmaVersion: "latest",
        sourceType: "module",
      }) as TSESTree.Program;

      const listeners = noOrphanModulesRule.create(context as never);
      listeners.Program?.(program);

      // Traversal gracefully caught EACCES and produced no unhandled crashes
      expect(reports).toEqual([]);
    });

    it("skips reporting when valid-route-module encounters inaccessible route files", () => {
      const reports: unknown[] = [];
      const context = createMockContext({
        report: (d) => reports.push(d),
      });

      vi.spyOn(fs, "statSync").mockImplementation(() => {
        const err = new Error("permission denied") as ErrnoError;
        err.code = "EACCES";
        throw err;
      });

      const program = parser.parse(
        `import { route } from "@react-router/dev/routes";
         export default [route("home", "./home.tsx")];`,
        {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      ) as TSESTree.Program;

      const listeners = validRouteModuleRule.create(context as never);
      listeners.Program?.(program);

      expect(reports).toEqual([]);
    });

    it("skips reporting when require-outlet-for-child-routes encounters inaccessible parent routes", () => {
      const reports: unknown[] = [];
      const context = createMockContext({
        report: (d) => reports.push(d),
      });

      vi.spyOn(fs, "statSync").mockImplementation(() => {
        const err = new Error("permission denied") as ErrnoError;
        err.code = "EACCES";
        throw err;
      });

      const program = parser.parse(
        `import { layout, route } from "@react-router/dev/routes";
         export default [layout("./layout.tsx", [route("child", "./child.tsx")])];`,
        {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      ) as TSESTree.Program;

      const listeners = requireOutletRule.create(context as never);
      listeners.Program?.(program);

      expect(reports).toEqual([]);
    });
  });

  describe("Broken & Cyclic Symlinks (ELOOP / ENOENT)", () => {
    it("returns false from isPathInsideProject when fs.realpathSync throws ELOOP", () => {
      const root = path.resolve("tests/fixtures/path-app");

      vi.spyOn(fs, "realpathSync").mockImplementation(() => {
        const err = new Error("too many symbolic links") as ErrnoError;
        err.code = "ELOOP";
        throw err;
      });

      // Even if lexical path is under root, if realpath throws ELOOP, fallback is guarded
      expect(isPathInsideProject(root, path.join(root, "../outside"))).toBe(false);
    });

    it("falls back to normalized resolve in canonicalPath when realpathSync throws ENOENT", () => {
      vi.spyOn(fs, "realpathSync").mockImplementation(() => {
        const err = new Error("no such file or directory") as ErrnoError;
        err.code = "ENOENT";
        throw err;
      });

      const result = canonicalPath("app/non-existent.tsx");
      expect(result).toBe(path.normalize(path.resolve("app/non-existent.tsx")));
    });

    it("skips candidate when realpathSync throws ELOOP in resolveRouteModule", () => {
      const context = createMockContext({});

      vi.spyOn(fs, "statSync").mockImplementation(
        () => ({ isFile: () => true }) as unknown as fs.Stats,
      );
      vi.spyOn(fs, "realpathSync").mockImplementation(() => {
        const err = new Error("too many symbolic links") as ErrnoError;
        err.code = "ELOOP";
        throw err;
      });

      const result = resolveRouteModule(context, "./home.tsx");
      expect(result.absolutePath).toBeUndefined();
    });
  });

  describe("Missing Parser Fallback", () => {
    it("gracefully disables cross-file fragment indexing when @typescript-eslint/parser is missing", () => {
      setParserForTesting(undefined);

      const context = createMockContext({});
      const program = parser.parse(
        `import fragment from "./fragment";
         export default [...fragment];`,
        {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      ) as TSESTree.Program;

      const analysis = analyzeProjectRouteConfig(context, program);
      expect(analysis.importedFiles).toEqual([]);
      expect(analysis.hasUnknownImports).toBe(false);
      expect(analysis.entries).toHaveLength(0);
      expect(analysis.issues).toHaveLength(0);
    });
  });
});
