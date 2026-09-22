import fs from "node:fs";
import path from "node:path";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { analyzeProjectRouteConfig } from "../utils/project-route-config.js";
import { canonicalPath, resolveRouteModule } from "../utils/path-resolution.js";
import {
  getCwd,
  getSettings,
  isRouteConfigFile,
  matchesPattern,
} from "../utils/settings.js";

type Options = [
  {
    allowFiles?: string[];
    ignore?: string[];
  }?,
];

function filesUnder(root: string): string[] {
  const files: string[] = [];
  function visit(directory: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  }
  visit(root);
  return files;
}

export default createRule<Options, "orphanRouteModule">({
  name: "no-orphan-route-modules",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "disallow statically configured route-module files that are not referenced by the route graph",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true },
          ignore: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      orphanRouteModule:
        "Route-module file '{{file}}' matches the configured route-module globs but is not referenced by this static route config. Remove it, add it to the route graph, or allow the intentional file.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        const analysis = analyzeProjectRouteConfig(context, program);
        // An incomplete or dynamic graph cannot safely establish orphanhood.
        if (
          !analysis.current.isStaticArray ||
          analysis.issues.length > 0 ||
          analysis.hasUnknownImports
        )
          return;

        const settings = getSettings(context);
        const projectRoot = getCwd(context);
        const referenced = new Set<string>();
        for (const { entry } of analysis.entries) {
          if (!entry.file) continue;
          const resolved = resolveRouteModule(context, entry.file);
          if (resolved.absolutePath) referenced.add(canonicalPath(resolved.absolutePath));
        }

        const options = context.options[0] ?? {};
        for (const absolute of filesUnder(projectRoot)) {
          const relative = path.relative(projectRoot, absolute).replaceAll("\\", "/");
          if (
            !settings.routeModuleFiles.some((pattern) =>
              matchesPattern(relative, pattern),
            )
          ) {
            continue;
          }
          if (settings.rootRoute.some((pattern) => matchesPattern(relative, pattern)))
            continue;
          if (
            options.allowFiles?.some((pattern) => matchesPattern(relative, pattern)) ||
            options.ignore?.some((pattern) => matchesPattern(relative, pattern))
          ) {
            continue;
          }
          if (referenced.has(canonicalPath(absolute))) continue;
          context.report({
            node: program,
            messageId: "orphanRouteModule",
            data: { file: relative },
          });
        }
      },
    };
  },
});
