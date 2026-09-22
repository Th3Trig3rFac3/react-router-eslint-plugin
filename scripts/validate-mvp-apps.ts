import { ESLint } from "eslint";
import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import parser from "@typescript-eslint/parser";

import { DEFAULT_SETTINGS } from "../src/utils/settings.js";

type Plugin = typeof import("../src/index.js").default;

type AppSpec = {
  label: string;
  directory: string;
  allowActionOnlyFiles: string[];
  allowInvalidExports: string[];
};

type RuleRun = {
  files: number;
  errors: number;
  warnings: number;
  fatal: number;
  diagnostics: Array<{
    file: string;
    ruleId: string | null;
    severity: number;
    line: number;
    column: number;
    message: string;
  }>;
};

type AppReport = AppSpec & {
  routeConfig: string[];
  rootRoute: string[];
  settings: typeof DEFAULT_SETTINGS;
  sourceFiles: number;
  skippedFiles: number;
  elapsedMs: number;
  runs: {
    recommended: RuleRun;
    noInvalidRouteExports: RuleRun;
  };
};

const SOURCE_GLOB = "app/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}";
function parseArgs(argv: string[]): AppSpec[] {
  const specs: AppSpec[] = [];
  const allowActionOnly = new Map<string, string[]>();
  const allowInvalid = new Map<string, string[]>();
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--allow-action-only" || option === "--allow-invalid") {
      const value = argv[index + 1];
      if (!value) throw new Error(`Expected ${option} label=value[,value]`);
      const separator = value.indexOf("=");
      if (separator <= 0) throw new Error(`Expected ${option} label=value[,value]`);
      const values = value
        .slice(separator + 1)
        .split(",")
        .filter((entry) => entry.length > 0);
      const target = option === "--allow-action-only" ? allowActionOnly : allowInvalid;
      target.set(value.slice(0, separator), values);
      index += 1;
      continue;
    }
    if (option !== "--app") continue;
    const value = argv[index + 1];
    if (!value) throw new Error("Expected --app label=directory");
    const separator = value.indexOf("=");
    if (separator <= 0 || separator === value.length - 1) {
      throw new Error("Expected --app label=directory");
    }
    specs.push({
      label: value.slice(0, separator),
      directory: path.resolve(value.slice(separator + 1)),
      allowActionOnlyFiles: allowActionOnly.get(value.slice(0, separator)) ?? [],
      allowInvalidExports: allowInvalid.get(value.slice(0, separator)) ?? [],
    });
    index += 1;
  }
  if (specs.length === 0) {
    throw new Error("Pass one or more apps, for example: --app starter=C:/path/to/app");
  }
  for (const spec of specs) {
    spec.allowActionOnlyFiles = allowActionOnly.get(spec.label) ?? [];
    spec.allowInvalidExports = allowInvalid.get(spec.label) ?? [];
  }
  return specs;
}

function countSourceFiles(directory: string): Promise<number> {
  return fs
    .readdir(path.join(directory, "app"), { withFileTypes: true })
    .then(async (entries) => {
      let count = 0;
      for (const entry of entries) {
        const entryPath = path.join(directory, "app", entry.name);
        if (entry.isDirectory()) {
          count += await countSourceFilesFrom(entryPath);
        } else if (/\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/.test(entry.name)) {
          count += 1;
        }
      }
      return count;
    });
}

async function countSourceFilesFrom(directory: string): Promise<number> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) count += await countSourceFilesFrom(entryPath);
    else if (/\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/.test(entry.name)) count += 1;
  }
  return count;
}

function summarize(results: Awaited<ReturnType<ESLint["lintFiles"]>>): RuleRun {
  const diagnostics = results.flatMap((result) =>
    result.messages.map((message) => ({
      file: result.filePath,
      ruleId: message.ruleId,
      severity: message.severity,
      line: message.line,
      column: message.column,
      message: message.message,
    })),
  );

  return {
    files: results.length,
    errors: results.reduce((total, result) => total + result.errorCount, 0),
    warnings: results.reduce((total, result) => total + result.warningCount, 0),
    fatal: results.reduce((total, result) => total + result.fatalErrorCount, 0),
    diagnostics,
  };
}

async function lintApp(
  app: AppSpec,
  plugin: Plugin,
  rules: Record<string, unknown>,
): Promise<RuleRun> {
  const eslint = new ESLint({
    cwd: app.directory,
    ignore: false,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: [SOURCE_GLOB],
        languageOptions: {
          parser,
          parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            ecmaFeatures: { jsx: true },
          },
        },
        linterOptions: { reportUnusedDisableDirectives: "off" },
        plugins: { "react-router": plugin as never },
        settings: { reactRouter: DEFAULT_SETTINGS },
        rules: rules as never,
      },
    ],
  });

  return summarize(await eslint.lintFiles([SOURCE_GLOB]));
}

async function loadPlugin(): Promise<Plugin> {
  const builtPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../dist/index.js",
  );

  try {
    await fs.access(builtPath);
  } catch {
    return (await import("../src/index.js")).default;
  }

  return ((await import(pathToFileURL(builtPath).href)) as { default: Plugin }).default;
}

const apps = parseArgs(process.argv.slice(2));
const plugin = await loadPlugin();
const reports: AppReport[] = [];

for (const app of apps) {
  const sourceFiles = await countSourceFiles(app.directory);
  const startedAt = performance.now();
  const recommended = await lintApp(app, plugin, {
    "react-router/require-root-error-boundary": "error",
    "react-router/valid-route-module-path": "error",
    "react-router/no-action-only-routes": [
      "warn",
      { allowFiles: app.allowActionOnlyFiles },
    ],
  });
  const noInvalidRouteExports = await lintApp(app, plugin, {
    "react-router/no-invalid-route-exports": [
      "error",
      { allow: app.allowInvalidExports },
    ],
  });
  reports.push({
    ...app,
    routeConfig: DEFAULT_SETTINGS.routeConfig,
    rootRoute: DEFAULT_SETTINGS.rootRoute,
    settings: DEFAULT_SETTINGS,
    sourceFiles,
    skippedFiles: Math.max(0, sourceFiles - recommended.files),
    elapsedMs: Math.round(performance.now() - startedAt),
    runs: {
      recommended,
      noInvalidRouteExports,
    },
  });
}

process.stdout.write(
  `${JSON.stringify({ sourceGlob: SOURCE_GLOB, reports }, null, 2)}\n`,
);
