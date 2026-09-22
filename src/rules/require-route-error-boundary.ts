import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { matchesPattern, relativeFilename } from "../utils/settings.js";

type Options = [
  {
    files?: string[];
    allowFiles?: string[];
  }?,
];

export default createRule<Options, "missingRouteErrorBoundary">({
  name: "require-route-error-boundary",
  meta: {
    type: "problem",
    docs: {
      description:
        "require an ErrorBoundary in explicitly configured route application boundaries",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            uniqueItems: true,
          },
          allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingRouteErrorBoundary:
        "This configured application boundary should export ErrorBoundary so errors do not escape to a blank document.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const options = context.options[0] ?? {};
        const filename = relativeFilename(context);
        if (
          !filename ||
          !options.files?.some((pattern) => matchesPattern(filename, pattern)) ||
          options.allowFiles?.some((pattern) => matchesPattern(filename, pattern))
        ) {
          return;
        }
        const exports = getRouteModuleExports(context, program);
        if (exports?.named.has("ErrorBoundary") || exports?.hasExportAll) return;
        context.report({ node: program, messageId: "missingRouteErrorBoundary" });
      },
    };
  },
});
