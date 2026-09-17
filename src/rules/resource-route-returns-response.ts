import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getExport } from "../utils/exports.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [
  {
    allowData?: boolean;
  }?,
];

function unwrap(node: TSESTree.Node): TSESTree.Node {
  if (
    node.type === "TSAsExpression" ||
    node.type === "TSTypeAssertion" ||
    node.type === "TSNonNullExpression" ||
    node.type === "ChainExpression"
  ) {
    return unwrap(node.expression);
  }
  if (node.type === "AwaitExpression") return unwrap(node.argument);
  return node;
}

function isResponseExpression(node: TSESTree.Node, allowData: boolean): boolean {
  const expression = unwrap(node);

  if (
    expression.type === "NewExpression" &&
    expression.callee.type === "Identifier" &&
    expression.callee.name === "Response"
  ) {
    return true;
  }

  if (expression.type !== "CallExpression") return false;
  const callee = expression.callee;
  if (callee.type !== "Identifier") return false;
  return (
    callee.name === "redirect" ||
    callee.name === "redirectDocument" ||
    callee.name === "replace" ||
    (allowData && callee.name === "data")
  );
}

function isFunctionNode(
  node: TSESTree.Node | null | undefined,
): node is
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression {
  return (
    node?.type === "FunctionDeclaration" ||
    node?.type === "FunctionExpression" ||
    node?.type === "ArrowFunctionExpression"
  );
}

function getExportedFunction(
  declaration: TSESTree.Node | undefined,
):
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
  | undefined {
  if (isFunctionNode(declaration)) return declaration;
  if (declaration?.type === "VariableDeclarator" && isFunctionNode(declaration.init)) {
    return declaration.init;
  }
  return undefined;
}

function collectReturns(
  node: TSESTree.Node,
  returns: TSESTree.ReturnStatement[],
  throws: TSESTree.ThrowStatement[],
): void {
  if (node.type === "ReturnStatement") {
    returns.push(node);
    return;
  }
  if (node.type === "ThrowStatement") {
    throws.push(node);
    return;
  }
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent" || key === "loc" || key === "range" || key === "tokens") {
      continue;
    }
    if (!value || value === node) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && "type" in child) {
          collectReturns(child as TSESTree.Node, returns, throws);
        }
      }
    } else if (typeof value === "object" && "type" in value) {
      collectReturns(value as TSESTree.Node, returns, throws);
    }
  }
}

export const resourceRouteReturnsResponseRule = createRule<Options, "missingResponse">({
  name: "resource-route-returns-response",
  meta: {
    type: "problem",
    docs: {
      description:
        "require explicitly scoped resource-route handlers to return a Response",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowData: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingResponse:
        "This resource-route {{handler}} must return or throw a Response on every statically understood path. Use new Response(...), redirect(...), or enable allowData for fetcher/form-facing routes.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports || routeExports.default) return;

        const allowData = context.options[0]?.allowData ?? false;
        for (const handlerName of ["loader", "action", "clientLoader", "clientAction"]) {
          const handler = getExport(routeExports, handlerName);
          if (!handler) continue;
          const functionNode = getExportedFunction(handler.declaration);
          if (!functionNode) continue;

          const returns: TSESTree.ReturnStatement[] = [];
          const throws: TSESTree.ThrowStatement[] = [];
          if (functionNode.body.type === "BlockStatement") {
            collectReturns(functionNode.body, returns, throws);
          } else {
            returns.push({
              type: "ReturnStatement",
              argument: functionNode.body,
              loc: functionNode.body.loc,
              range: functionNode.body.range,
            } as TSESTree.ReturnStatement);
          }

          const invalidReturn = returns.find(
            (statement) =>
              statement.argument === null ||
              !isResponseExpression(statement.argument, allowData),
          );
          const invalidThrow = throws.find(
            (statement) => !isResponseExpression(statement.argument, allowData),
          );

          if (
            invalidReturn ||
            invalidThrow ||
            (returns.length === 0 && throws.length === 0)
          ) {
            context.report({
              node: invalidReturn ?? invalidThrow ?? functionNode,
              messageId: "missingResponse",
              data: { handler: handlerName },
            });
          }
        }
      },
    };
  },
});

// Keep the name proposed in the original project brief as a compatibility
// alias while the more precise rule name is used in new documentation/configs.
export const validResourceRouteRule = resourceRouteReturnsResponseRule;

export default resourceRouteReturnsResponseRule;
