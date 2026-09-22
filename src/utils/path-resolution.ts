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

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return !(
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
}

/**
 * Check a project boundary using both lexical and real paths. macOS commonly
 * exposes temporary directories through a symlink such as `/var` -> `/private/var`;
 * comparing only one spelling incorrectly rejects files inside the project.
 */
export function isPathInsideProject(projectRoot: string, candidate: string): boolean {
  if (isWithinRoot(projectRoot, candidate)) return true;
  try {
    return isWithinRoot(fs.realpathSync(projectRoot), fs.realpathSync(candidate));
  } catch {
    return false;
  }
}

export function canonicalPath(filename: string): string {
  try {
    return path.normalize(fs.realpathSync(filename));
  } catch {
    return path.normalize(path.resolve(filename));
  }
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
  if (!isPathInsideProject(projectRoot, requested)) {
    return { candidates: [] };
  }
  const candidates = path.extname(requested)
    ? [requested]
    : extensions.map((extension) => `${requested}${extension}`);

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        const realCandidate = fs.realpathSync(candidate);
        if (!isPathInsideProject(projectRoot, realCandidate)) {
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
