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
  return program.body.some((statement) => {
    if (statement.type !== "ExpressionStatement") return false;
    const expression = statement.expression;
    if (expression.type !== "AssignmentExpression") return false;
    if (expression.left.type !== "MemberExpression") return false;
    return (
      !expression.left.computed &&
      expression.left.object.type === "Identifier" &&
      expression.left.object.name === "clientLoader" &&
      expression.left.property.type === "Identifier" &&
      expression.left.property.name === "hydrate" &&
      expression.right.type === "Literal" &&
      expression.right.value === true
    );
  });
}
