import type { TSESTree } from "@typescript-eslint/utils";

import { findLocalDeclaration, walkNode } from "../utils/ast.js";
import { createRule } from "../utils/create-rule.js";
import { getExport } from "../utils/exports.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [
  {
    allow?: string[];
  }?,
];

export default createRule<Options, "unsplittableState">({
  name: "splittable-route-module",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "disallow top-level mutable module state that can prevent client route exports from splitting cleanly",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unsplittableState:
        "Top-level mutable binding '{{name}}' is shared by client route exports. Move request-independent state into a separate module or make the binding immutable so route modules can be split.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const exports = getRouteModuleExports(context, program);
        if (
          !exports ||
          !(
            exports.default ||
            exports.named.has("clientLoader") ||
            exports.named.has("clientAction") ||
            exports.named.has("clientMiddleware") ||
            exports.named.has("HydrateFallback")
          )
        ) {
          return;
        }
        const allowed = new Set(context.options[0]?.allow ?? []);
        const clientUses = new Set<string>();
        for (const exportName of [
          "default",
          "clientLoader",
          "clientAction",
          "clientMiddleware",
          "HydrateFallback",
        ] as const) {
          const info = getExport(exports, exportName);
          if (!info) continue;
          const declaration =
            info.declaration ?? findLocalDeclaration(program, info.localName);
          if (!declaration) continue;
          walkNode(declaration, (node) => {
            if (node.type === "Identifier") clientUses.add(node.name);
          });
        }
        for (const statement of program.body) {
          if (statement.type !== "VariableDeclaration" || statement.kind === "const")
            continue;
          for (const declaration of statement.declarations) {
            if (
              declaration.id.type !== "Identifier" ||
              allowed.has(declaration.id.name) ||
              !clientUses.has(declaration.id.name)
            )
              continue;
            context.report({
              node: declaration.id,
              messageId: "unsplittableState",
              data: { name: declaration.id.name },
            });
          }
        }
      },
    };
  },
});
