import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { findLocalDeclaration, functionFromDeclaration, walkNode } from "../utils/ast.js";
import { getExport } from "../utils/exports.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import {
  getSettings,
  isRootRouteFile,
  matchesPattern,
  relativeFilename,
} from "../utils/settings.js";

type Options = [
  {
    files?: string[];
    allowFiles?: string[];
  }?,
];

export default createRule<Options, "sensitiveErrorOutput">({
  name: "no-sensitive-error-output",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow rendering raw error stacks or unknown error objects from route error boundaries",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" }, uniqueItems: true },
          allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      sensitiveErrorOutput:
        "Do not render raw error details from an ErrorBoundary in production. Normalize a public message and guard diagnostic details behind an explicit development check.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const options = context.options[0] ?? {};
        const filename = relativeFilename(context);
        const settings = getSettings(context);
        const inScope = options.files
          ? Boolean(
              filename &&
              options.files.some((pattern) => matchesPattern(filename, pattern)),
            )
          : isRootRouteFile(context, settings);
        if (
          !inScope ||
          options.allowFiles?.some(
            (pattern) => filename && matchesPattern(filename, pattern),
          )
        ) {
          return;
        }
        const routeExports = getRouteModuleExports(context, program);
        const errorBoundary = routeExports && getExport(routeExports, "ErrorBoundary");
        if (!errorBoundary) return;
        const fn = functionFromDeclaration(
          errorBoundary.declaration ??
            findLocalDeclaration(program, errorBoundary.localName),
        );
        if (!fn) return;

        walkNode(fn.body, (node) => {
          if (
            node.type === "MemberExpression" &&
            !node.computed &&
            node.object.type === "Identifier" &&
            /^(?:error|caughtError|unknownError)$/u.test(node.object.name) &&
            node.property.type === "Identifier" &&
            node.property.name === "stack"
          ) {
            context.report({ node, messageId: "sensitiveErrorOutput" });
          }
          if (
            node.type === "JSXExpressionContainer" &&
            node.expression.type === "Identifier" &&
            /^(?:error|caughtError|unknownError)$/u.test(node.expression.name)
          ) {
            context.report({ node, messageId: "sensitiveErrorOutput" });
          }
        });
      },
    };
  },
});
