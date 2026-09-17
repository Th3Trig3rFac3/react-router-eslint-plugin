import path from "node:path";
import { cwd as processCwd } from "node:process";

import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import {
  DEFAULT_EXTENSIONS,
  type NormalizedReactRouterSettings,
  type ReactRouterSettings,
} from "../types.js";

const DEFAULT_SETTINGS: NormalizedReactRouterSettings = {
  appDirectory: "app",
  rootRoute: ["app/root.*"],
  routeConfig: ["app/routes.ts", "app/routes.js"],
  routeModuleFiles: ["app/root.*", "app/routes/**/*"],
  extensions: [...DEFAULT_EXTENSIONS],
};

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return [...value];
  }
  return [...fallback];
}

export function getSettings(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
): NormalizedReactRouterSettings {
  const raw = (context.settings as { reactRouter?: ReactRouterSettings } | undefined)
    ?.reactRouter;

  return {
    appDirectory:
      typeof raw?.appDirectory === "string"
        ? raw.appDirectory
        : DEFAULT_SETTINGS.appDirectory,
    rootRoute: asStringArray(raw?.rootRoute, DEFAULT_SETTINGS.rootRoute),
    routeConfig: asStringArray(raw?.routeConfig, DEFAULT_SETTINGS.routeConfig),
    routeModuleFiles: asStringArray(
      raw?.routeModuleFiles,
      DEFAULT_SETTINGS.routeModuleFiles,
    ),
    extensions: asStringArray(raw?.extensions, DEFAULT_SETTINGS.extensions),
  };
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replaceAll("\\", "/").replace(/^\.\//, "");
  let expression = "^";

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index] ?? "";

    if (character === "*" && normalized[index + 1] === "*") {
      index += 1;
      if (normalized[index + 1] === "/") {
        index += 1;
        expression += "(?:.*/)?";
      } else {
        expression += ".*";
      }
      continue;
    }

    if (character === "*") {
      expression += "[^/]*";
      continue;
    }

    if (character === "?") {
      expression += "[^/]";
      continue;
    }

    expression += /[\\^$+?.()|[\]{}]/.test(character) ? `\\${character}` : character;
  }

  return new RegExp(`${expression}$`);
}

function expandBracePatterns(pattern: string): string[] {
  const opening = pattern.indexOf("{");
  if (opening < 0) return [pattern];
  const closing = pattern.indexOf("}", opening + 1);
  if (closing < 0) return [pattern];

  const alternatives = pattern
    .slice(opening + 1, closing)
    .split(",")
    .filter((alternative) => alternative.length > 0);
  if (alternatives.length === 0) return [pattern];

  return alternatives.flatMap((alternative) =>
    expandBracePatterns(
      `${pattern.slice(0, opening)}${alternative}${pattern.slice(closing + 1)}`,
    ),
  );
}

export function matchesPattern(filename: string, pattern: string): boolean {
  const normalizedFilename = filename.replaceAll("\\", "/").replace(/^\.\//, "");
  return expandBracePatterns(pattern).some((expanded) =>
    globToRegExp(expanded).test(normalizedFilename),
  );
}

export function relativeFilename(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
): string | undefined {
  const filename = context.filename ?? context.getFilename();
  if (!filename || filename === "<input>" || filename === "<text>") return undefined;

  const relative = path.relative(getCwd(context), filename);
  return relative.replaceAll("\\", "/");
}

export function getCwd(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
): string {
  const contextWithCwd = context as TSESLint.RuleContext<string, readonly unknown[]> & {
    getCwd?: () => string;
    cwd?: string;
  };
  if (typeof contextWithCwd.getCwd === "function") return contextWithCwd.getCwd();
  if (typeof contextWithCwd.cwd === "string") return contextWithCwd.cwd;
  return processCwd();
}

export function isRootRouteFile(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  settings = getSettings(context),
): boolean {
  const filename = relativeFilename(context);
  return (
    filename !== undefined &&
    settings.rootRoute.some((pattern) => matchesPattern(filename, pattern))
  );
}

export function isRouteConfigFile(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  settings = getSettings(context),
): boolean {
  const filename = relativeFilename(context);
  return (
    filename !== undefined &&
    settings.routeConfig.some((pattern) => matchesPattern(filename, pattern))
  );
}

function hasGeneratedRouteTypeImport(program: TSESTree.Program): boolean {
  return program.body.some((statement) => {
    if (statement.type !== "ImportDeclaration") return false;
    const source = statement.source.value;
    return typeof source === "string" && /(?:^|\/)\+types(?:\/|$)/.test(source);
  });
}

export function isLikelyRouteModule(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  program: TSESTree.Program,
  settings = getSettings(context),
): boolean {
  if (isRootRouteFile(context, settings)) return true;

  const filename = relativeFilename(context);
  if (
    filename !== undefined &&
    settings.routeModuleFiles.some((pattern) => matchesPattern(filename, pattern))
  ) {
    return true;
  }

  return hasGeneratedRouteTypeImport(program);
}

export { DEFAULT_SETTINGS };
