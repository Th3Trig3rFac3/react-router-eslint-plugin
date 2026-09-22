import fs from "node:fs";
import path from "node:path";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { analyzeProjectRouteConfig } from "../utils/project-route-config.js";
import { resolveRouteModule } from "../utils/path-resolution.js";
import { isRouteConfigFile } from "../utils/settings.js";

type Options = [
  {
    allowFiles?: string[];
  }?,
];

const MEANINGFUL_EXPORT =
  /\bexport\s+(?!type\b)(?:(?:async|const|let|var|function|class)\s+)?(?:default\b|loader\b|clientLoader\b|action\b|clientAction\b|ErrorBoundary\b|HydrateFallback\b|middleware\b|clientMiddleware\b|headers\b|links\b|meta\b|handle\b|shouldRevalidate\b)|\bexport\s+(?!type\b)\{[^}]*\b(?:default|loader|clientLoader|action|clientAction|ErrorBoundary|HydrateFallback|middleware|clientMiddleware|headers|links|meta|handle|shouldRevalidate)\b/iu;

export default createRule<Options, "invalidRouteModule">({
  name: "valid-route-module",
  meta: {
    type: "problem",
    docs: {
      description:
        "require statically referenced route modules to expose a meaningful route export",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidRouteModule:
        "Route module '{{modulePath}}' resolves to a file without a recognized React Router route export.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        const options = context.options[0] ?? {};
        const analysis = analyzeProjectRouteConfig(context, program);
        const currentFilename = context.filename ?? context.getFilename();
        const currentSourceFile =
          currentFilename === "<input>" || currentFilename === "<text>"
            ? ""
            : path.resolve(currentFilename);
        for (const { entry, sourceFile, reportNode } of analysis.entries) {
          if (!entry.file || !entry.fileNode) continue;
          const resolved = resolveRouteModule(context, entry.file);
          if (!resolved.absolutePath) continue;
          let source: string;
          try {
            source = fs.readFileSync(resolved.absolutePath, "utf8");
          } catch {
            continue;
          }
          if (MEANINGFUL_EXPORT.test(source)) continue;
          if (options.allowFiles?.includes(entry.file)) continue;
          context.report({
            node:
              currentSourceFile && path.resolve(sourceFile) === currentSourceFile
                ? entry.fileNode
                : reportNode,
            messageId: "invalidRouteModule",
            data: { modulePath: entry.file },
          });
        }
      },
    };
  },
});
