import fs from "node:fs";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { findLocalDeclaration, functionFromDeclaration, walkNode } from "../utils/ast.js";
import { getExport } from "../utils/exports.js";
import { analyzeProjectRouteConfig } from "../utils/project-route-config.js";
import { resolveRouteModule } from "../utils/path-resolution.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import {
  isRouteConfigFile,
  matchesPattern,
  relativeFilename,
} from "../utils/settings.js";

type Options = [
  {
    files?: string[];
    allowFiles?: string[];
    wrapperComponents?: string[];
  }?,
];

function containsOutlet(fn: TSESTree.Node, wrappers = new Set<string>()): boolean {
  let result = false;
  walkNode(fn, (node) => {
    if (node.type === "JSXIdentifier" && node.name === "Outlet") {
      result = true;
    }
    if (node.type === "JSXIdentifier" && wrappers.has(node.name)) {
      result = true;
    }
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "useOutlet"
    ) {
      result = true;
    }
  });
  return result;
}

export default createRule<Options, "missingOutlet">({
  name: "require-outlet-for-child-routes",
  meta: {
    type: "problem",
    docs: {
      description:
        "require configured parent routes with children to render an Outlet or useOutlet",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" }, uniqueItems: true },
          allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true },
          wrapperComponents: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingOutlet:
        "This route has configured child routes but its statically inspected component renders no Outlet or useOutlet. Matching children will not appear; render an outlet or allow this wrapper pattern.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const options = context.options[0] ?? {};
        const wrappers = new Set(options.wrapperComponents ?? []);
        const filename = relativeFilename(context);
        if (
          filename &&
          options.files?.some((pattern) => matchesPattern(filename, pattern)) &&
          !options.allowFiles?.some((pattern) => matchesPattern(filename, pattern))
        ) {
          const exports = getRouteModuleExports(context, program);
          const info = exports && getExport(exports, "default");
          const fn =
            info &&
            functionFromDeclaration(
              info.declaration ?? findLocalDeclaration(program, info.localName),
            );
          if (fn && !containsOutlet(fn, wrappers)) {
            context.report({ node: info?.node ?? program, messageId: "missingOutlet" });
          }
        }

        if (!isRouteConfigFile(context)) return;
        const analysis = analyzeProjectRouteConfig(context, program);
        for (const { entry, reportNode } of analysis.entries) {
          if (!entry.hasChildren || !entry.file || !entry.fileNode) continue;
          const resolved = resolveRouteModule(context, entry.file);
          if (!resolved.absolutePath) continue;
          let source: string;
          try {
            source = fs.readFileSync(resolved.absolutePath, "utf8");
          } catch {
            continue;
          }
          if (
            /<Outlet\b/u.test(source) ||
            /\buseOutlet\s*\(/u.test(source) ||
            [...wrappers].some((wrapper) => source.includes(`<${wrapper}`))
          ) {
            continue;
          }
          context.report({ node: reportNode, messageId: "missingOutlet" });
        }
      },
    };
  },
});
