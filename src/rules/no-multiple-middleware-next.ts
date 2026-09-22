import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import {
  getMiddlewareFunctions,
  getNextParameterName,
  isDirectNextCall,
  walkMiddlewareBody,
} from "../utils/middleware.js";

type Options = [
  {
    allow?: string[];
  }?,
];

export default createRule<Options, "multipleNext">({
  name: "no-multiple-middleware-next",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow statically provable repeated calls to next in a middleware invocation",
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
      multipleNext:
        "This {{middlewareName}} function calls next() more than once on the same unconditional path. React Router permits one next() call per middleware invocation; combine the work around one call or remove the duplicate.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports) return;

        for (const middlewareName of ["middleware", "clientMiddleware"] as const) {
          const functions = getMiddlewareFunctions(program, routeExports, middlewareName);
          for (const fn of functions) {
            const nextName = getNextParameterName(fn);
            if (!nextName) continue;

            const unconditionalCalls: TSESTree.CallExpression[] = [];
            walkMiddlewareBody(fn, (node, uncertain) => {
              if (!uncertain && isDirectNextCall(node, nextName)) {
                unconditionalCalls.push(node);
              }
            });

            for (const call of unconditionalCalls.slice(1)) {
              context.report({
                node: call,
                messageId: "multipleNext",
                data: { middlewareName },
              });
            }
          }
        }
      },
    };
  },
});
