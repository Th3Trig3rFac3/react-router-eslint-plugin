import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import {
  isDirectNextCall,
  getMiddlewareFunctions,
  getNextParameterName,
} from "../utils/middleware.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { unwrap } from "../utils/ast.js";

type Options = [
  {
    allow?: string[];
  }?,
];

function nextCallFromExpression(
  node: TSESTree.Node | undefined,
  nextName: string,
): TSESTree.CallExpression | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  if (isDirectNextCall(expression, nextName)) return expression;
  if (expression.type === "AwaitExpression") {
    return nextCallFromExpression(expression.argument, nextName);
  }
  return undefined;
}

function isUndefinedExpression(node: TSESTree.Node | null): boolean {
  if (!node) return true;
  const expression = unwrap(node);
  return expression.type === "Identifier" && expression.name === "undefined";
}

function hasResponseReturn(statements: TSESTree.Statement[]): boolean {
  return statements.some(
    (statement) =>
      statement.type === "ReturnStatement" && !isUndefinedExpression(statement.argument),
  );
}

export default createRule<Options, "discardedNextResponse">({
  name: "return-server-middleware-response",
  meta: {
    type: "problem",
    docs: {
      description:
        "require server middleware that calls next to return the downstream response",
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
      discardedNextResponse:
        "This server middleware calls next() but reaches the end without returning its response. Return the value from next() (or an intentionally replaced Response) so downstream status, headers, and body are preserved.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports) return;

        for (const fn of getMiddlewareFunctions(program, routeExports, "middleware")) {
          const nextName = getNextParameterName(fn);
          if (!nextName || fn.body.type !== "BlockStatement") continue;
          const statements = fn.body.body;
          if (hasResponseReturn(statements)) continue;

          const nextStatements = statements.flatMap((statement) => {
            if (statement.type === "ExpressionStatement") {
              const call = nextCallFromExpression(statement.expression, nextName);
              return call ? [call] : [];
            }
            if (statement.type === "VariableDeclaration") {
              return statement.declarations.flatMap((declaration) => {
                const call = nextCallFromExpression(
                  declaration.init ?? undefined,
                  nextName,
                );
                return call ? [call] : [];
              });
            }
            return [];
          });
          if (nextStatements.length === 0) continue;

          const last = statements.at(-1);
          if (
            !last ||
            last.type !== "ReturnStatement" ||
            isUndefinedExpression(last.argument)
          ) {
            context.report({
              node: last ?? fn,
              messageId: "discardedNextResponse",
            });
          }
        }
      },
    };
  },
});
