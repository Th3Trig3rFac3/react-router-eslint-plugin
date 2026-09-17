import fs from "node:fs";
import path from "node:path";

import type { TSESLint } from "@typescript-eslint/utils";

import { getCwd, getSettings } from "./settings.js";

export function routeConfigBaseDirectory(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
): string {
  const settings = getSettings(context);
  return path.resolve(getCwd(context), settings.appDirectory);
}

export interface ResolvedRouteModule {
  absolutePath?: string;
  candidates: string[];
}

export function resolveRouteModule(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  moduleSpecifier: string,
  baseDirectory = routeConfigBaseDirectory(context),
  extensions = getSettings(context).extensions,
): ResolvedRouteModule {
  if (
    !moduleSpecifier ||
    moduleSpecifier.startsWith("~") ||
    moduleSpecifier.includes("\0")
  ) {
    return { candidates: [] };
  }

  const withoutQuery = moduleSpecifier.split(/[?#]/u, 1)[0] ?? moduleSpecifier;
  const requested = path.resolve(baseDirectory, withoutQuery);
  const projectRoot = path.resolve(getCwd(context));
  const relativeToProject = path.relative(projectRoot, requested);
  if (
    relativeToProject === ".." ||
    relativeToProject.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToProject)
  ) {
    return { candidates: [] };
  }
  const candidates = path.extname(requested)
    ? [requested]
    : extensions.map((extension) => `${requested}${extension}`);

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        const realCandidate = fs.realpathSync(candidate);
        const relativeRealPath = path.relative(projectRoot, realCandidate);
        if (
          relativeRealPath === ".." ||
          relativeRealPath.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relativeRealPath)
        ) {
          continue;
        }
        return { absolutePath: realCandidate, candidates };
      }
    } catch {
      // A missing or inaccessible candidate is reported by the caller.
    }
  }

  return { candidates };
}
