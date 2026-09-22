import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { canonicalRoutePath } from "../utils/route-config.js";
import { analyzeProjectRouteConfig } from "../utils/project-route-config.js";
import { isRouteConfigFile } from "../utils/settings.js";

export default createRule<[], "conflictingRoutePath">({
  name: "no-conflicting-route-paths",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow exact duplicate static sibling paths in a React Router route config",
      recommended: true,
    },
    schema: [],
    messages: {
      conflictingRoutePath:
        "Sibling routes resolve to the same path '{{path}}'. Give each route a distinct path or remove the duplicate.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        const byPath = new Map<
          string,
          Array<{ entryNode: TSESTree.Node; path: string }>
        >();
        for (const { entry, reportNode } of analyzeProjectRouteConfig(context, program)
          .entries) {
          // Layout and pathless routes do not themselves match a URL. Index
          // routes do match their parent's URL, even though they have no path.
          if (entry.kind === "layout") continue;
          if (entry.path === undefined && !entry.isIndex) continue;
          if (entry.fullPath === undefined || entry.siblingPath === undefined) continue;

          const key = `${entry.siblingGroup}:${entry.caseSensitive ? "s" : "i"}:${canonicalRoutePath(entry.fullPath, entry.caseSensitive)}`;
          const declarations = byPath.get(key) ?? [];
          declarations.push({
            entryNode: reportNode,
            path: entry.fullPath || "/",
          });
          byPath.set(key, declarations);
        }

        for (const declarations of byPath.values()) {
          if (declarations.length < 2) continue;
          for (const declaration of declarations) {
            context.report({
              node: declaration.entryNode,
              messageId: "conflictingRoutePath",
              data: { path: declaration.path },
            });
          }
        }
      },
    };
  },
});
