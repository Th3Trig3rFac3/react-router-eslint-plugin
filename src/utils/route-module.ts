import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { collectExports } from "./exports.js";
import { getSettings, isLikelyRouteModule } from "./settings.js";

export function getRouteModuleExports(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  program: TSESTree.Program,
) {
  const settings = getSettings(context);
  if (!isLikelyRouteModule(context, program, settings)) return undefined;
  return collectExports(program);
}

export function isHydrationEnabled(program: TSESTree.Program): boolean {
  return getHydrationAssignment(program) !== undefined;
}

function unwrap(node: TSESTree.Node): TSESTree.Node {
  if (
    node.type === "TSAsExpression" ||
    node.type === "TSTypeAssertion" ||
    node.type === "TSSatisfiesExpression" ||
    node.type === "TSNonNullExpression" ||
    node.type === "ChainExpression"
  ) {
    return unwrap(node.expression);
  }
  return node;
}

function propertyName(node: TSESTree.Node): string | undefined {
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return undefined;
}

export function getHydrationAssignment(
  program: TSESTree.Program,
  clientLoaderNames = new Set(["clientLoader"]),
): TSESTree.AssignmentExpression | undefined {
  for (const statement of program.body) {
    if (statement.type !== "ExpressionStatement") continue;
    const expression = statement.expression;
    if (expression.type !== "AssignmentExpression") continue;
    const left = unwrap(expression.left);
    if (left.type !== "MemberExpression") continue;
    const object = unwrap(left.object);
    const right = unwrap(expression.right);
    if (
      object.type === "Identifier" &&
      clientLoaderNames.has(object.name) &&
      propertyName(left.property) === "hydrate" &&
      right.type === "Literal" &&
      right.value === true
    ) {
      return expression;
    }
  }
  return undefined;
}
