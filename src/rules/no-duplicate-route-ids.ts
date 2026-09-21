import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { analyzeRouteConfig } from "../utils/route-config.js";
import { isRouteConfigFile } from "../utils/settings.js";

export default createRule<[], "duplicateRouteId">({
  name: "no-duplicate-route-ids",
  meta: {
    type: "problem",
    docs: {
      description: "disallow duplicate explicit route ids in a static route config",
      recommended: true,
    },
    schema: [],
    messages: {
      duplicateRouteId:
        "Route id '{{id}}' is declared more than once. Route ids must be unique.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        const byId = new Map<string, Array<{ node: TSESTree.Node; id: string }>>();
        for (const entry of analyzeRouteConfig(program).entries) {
          if (entry.id === undefined || !entry.idNode) continue;
          const declarations = byId.get(entry.id) ?? [];
          declarations.push({ node: entry.idNode, id: entry.id });
          byId.set(entry.id, declarations);
        }

        for (const declarations of byId.values()) {
          if (declarations.length < 2) continue;
          for (const declaration of declarations) {
            context.report({
              node: declaration.node,
              messageId: "duplicateRouteId",
              data: { id: declaration.id },
            });
          }
        }
      },
    };
  },
});
