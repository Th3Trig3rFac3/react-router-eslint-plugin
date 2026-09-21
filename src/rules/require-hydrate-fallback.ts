import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getHydrationAssignment, getRouteModuleExports } from "../utils/route-module.js";
import { matchesPattern, relativeFilename } from "../utils/settings.js";

type Options = [
  {
    allow?: string[];
    allowFiles?: string[];
  }?,
];

export default createRule<Options, "missingHydrateFallback">({
  name: "require-hydrate-fallback",
  meta: {
    type: "problem",
    docs: {
      description:
        "require a HydrateFallback export when a route opts into client-loader hydration",
      recommended: "warn",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          allowFiles: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingHydrateFallback:
        "This route opts into client-loader hydration but exports no HydrateFallback. Add a HydrateFallback export or remove the hydrate assignment if no fallback UI is intended.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const exports = getRouteModuleExports(context, program);
        if (!exports || !exports.named.has("clientLoader")) return;

        const clientLoader = exports.named.get("clientLoader");
        const localName = clientLoader?.localName ?? "clientLoader";
        const assignment = getHydrationAssignment(program, new Set([localName]));
        if (!assignment || exports.named.has("HydrateFallback") || exports.hasExportAll) {
          return;
        }

        const options = context.options[0] ?? {};
        const filename = relativeFilename(context);
        const allowFiles = [...(options.allow ?? []), ...(options.allowFiles ?? [])];
        if (
          filename !== undefined &&
          allowFiles.some((pattern) => matchesPattern(filename, pattern))
        ) {
          return;
        }

        context.report({ node: assignment, messageId: "missingHydrateFallback" });
      },
    };
  },
});
