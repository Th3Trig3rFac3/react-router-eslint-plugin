import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { matchesPattern, relativeFilename } from "../utils/settings.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [
  {
    allow?: string[];
    allowFiles?: string[];
  }?,
];

export default createRule<Options, "actionOnlyRoute">({
  name: "no-action-only-routes",
  meta: {
    type: "problem",
    docs: {
      description:
        "require an action route to also provide a loader or a route component",
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
      actionOnlyRoute:
        "This route exports {{actionName}} but no loader or route component. A document GET/refresh cannot render this route; add a loader (often a redirect) or a default component, or explicitly allow this intentional resource route.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const exports = getRouteModuleExports(context, program);
        if (!exports) return;

        const action = exports.named.get("action") ?? exports.named.get("clientAction");
        if (!action) return;
        if (
          exports.default ||
          exports.named.has("loader") ||
          exports.named.has("clientLoader")
        ) {
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

        context.report({
          node: action.node,
          messageId: "actionOnlyRoute",
          data: { actionName: action.name },
        });
      },
    };
  },
});
