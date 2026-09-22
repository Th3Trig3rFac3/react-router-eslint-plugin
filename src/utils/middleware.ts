import type { TSESTree } from "@typescript-eslint/utils";

import { findLocalDeclaration, unwrap } from "./ast.js";
import { getExport } from "./exports.js";
import type { ModuleExports } from "../types.js";

export type MiddlewareFunction =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

function functionsFromNode(
  program: TSESTree.Program,
  node: TSESTree.Node | undefined,
  seen = new Set<string>(),
): MiddlewareFunction[] {
  if (!node) return [];
  const expression = unwrap(node);
  if (
    expression.type === "FunctionDeclaration" ||
    expression.type === "FunctionExpression" ||
    expression.type === "ArrowFunctionExpression"
  ) {
    return [expression];
  }
  if (expression.type === "ArrayExpression") {
    return expression.elements.flatMap((element) =>
      element && element.type !== "SpreadElement"
        ? functionsFromNode(program, element, seen)
        : [],
    );
  }
  if (expression.type === "VariableDeclarator") {
    return functionsFromNode(program, expression.init ?? undefined, seen);
  }
  if (expression.type === "Identifier") {
    if (seen.has(expression.name)) return [];
    seen.add(expression.name);
    return functionsFromNode(
      program,
      findLocalDeclaration(program, expression.name),
      seen,
    );
  }
  return [];
}

export function getMiddlewareFunctions(
  program: TSESTree.Program,
  exports: ModuleExports,
  name: "middleware" | "clientMiddleware",
): MiddlewareFunction[] {
  const info = getExport(exports, name);
  if (!info) return [];
  const declaration =
    info.declaration ?? findLocalDeclaration(program, info.localName ?? name);
  return functionsFromNode(program, declaration);
}

export function getNextParameterName(fn: MiddlewareFunction): string | undefined {
  const named = fn.params.find(
    (parameter) => parameter.type === "Identifier" && parameter.name === "next",
  );
  if (named?.type === "Identifier") return named.name;

  const second = fn.params[1];
  return second?.type === "Identifier" ? second.name : undefined;
}

export function isDirectNextCall(
  node: TSESTree.Node,
  nextName: string,
): node is TSESTree.CallExpression {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === nextName
  );
}

/** Visit the body while treating nested functions as separate execution scopes. */
export function walkMiddlewareBody(
  fn: MiddlewareFunction,
  // eslint-disable-next-line no-unused-vars
  visitor: (node: TSESTree.Node, uncertain: boolean) => void,
): void {
  const body = fn.body;
  if (body.type !== "BlockStatement") return;

  function visit(node: TSESTree.Node, uncertain: boolean): void {
    visitor(node, uncertain);
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      return;
    }

    const isConditional =
      node.type === "IfStatement" ||
      node.type === "SwitchStatement" ||
      node.type === "ConditionalExpression" ||
      node.type === "LogicalExpression" ||
      node.type === "ForStatement" ||
      node.type === "ForInStatement" ||
      node.type === "ForOfStatement" ||
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement" ||
      node.type === "TryStatement";

    for (const [key, value] of Object.entries(node)) {
      if (key === "parent" || key === "loc" || key === "range" || key === "tokens") {
        continue;
      }
      if (!value || value === node) continue;
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object" && "type" in child) {
            visit(child as TSESTree.Node, uncertain || isConditional);
          }
        }
      } else if (typeof value === "object" && "type" in value) {
        visit(value as TSESTree.Node, uncertain || isConditional);
      }
    }
  }

  for (const statement of body.body) visit(statement, false);
}

export function resolveMiddlewareFunction(
  program: TSESTree.Program,
  exports: ModuleExports,
  name: "middleware" | "clientMiddleware",
): MiddlewareFunction | undefined {
  return getMiddlewareFunctions(program, exports, name)[0];
}
