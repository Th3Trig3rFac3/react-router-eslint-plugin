import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { routeParameterNames } from "../utils/route-config.js";
import { analyzeProjectRouteConfig } from "../utils/project-route-config.js";
import { isRouteConfigFile } from "../utils/settings.js";

export default createRule<[], "duplicateRouteParam">({
  name: "no-duplicate-route-params",
  meta: {
    type: "problem",
    docs: {
      description: "disallow repeated parameter names in a static route pattern",
      recommended: true,
    },
    schema: [],
    messages: {
      duplicateRouteParam:
        "Route pattern '{{path}}' declares parameter '{{name}}' more than once.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        for (const { entry, reportNode } of analyzeProjectRouteConfig(context, program)
          .entries) {
          if (entry.fullPath === undefined) continue;
          const seen = new Set<string>();
          for (const name of routeParameterNames(entry.fullPath)) {
            if (seen.has(name)) {
              context.report({
                node: reportNode,
                messageId: "duplicateRouteParam",
                data: { name, path: entry.fullPath || "/" },
              });
            }
            seen.add(name);
          }
        }
      },
    };
  },
});
