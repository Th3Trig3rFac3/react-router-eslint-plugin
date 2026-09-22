import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { findLocalDeclaration, walkNode } from "./ast.js";
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

/**
 * Collect identifiers reachable from a set of route-export declarations while
 * following same-file top-level bindings. This is intentionally shallow and
 * syntax-only; it gives client/server import rules useful same-file dependency
 * coverage without pretending to be a module bundler.
 */
export function collectReachableBindingNames(
  program: TSESTree.Program,
  rootDeclarations: TSESTree.Node[],
): Set<string> {
  const topLevelNames = new Set<string>();
  for (const statement of program.body) {
    if (
      (statement.type === "FunctionDeclaration" ||
        statement.type === "ClassDeclaration") &&
      statement.id
    ) {
      topLevelNames.add(statement.id.name);
    }
    if (statement.type !== "VariableDeclaration") continue;
    for (const declaration of statement.declarations) {
      if (declaration.id.type === "Identifier") topLevelNames.add(declaration.id.name);
    }
  }

  const reachable = new Set<string>();
  const visited = new Set<string>();
  const pending = [...rootDeclarations];
  while (pending.length > 0) {
    const declaration = pending.shift();
    if (!declaration) continue;
    walkNode(declaration, (node) => {
      if (node.type !== "Identifier") return;
      reachable.add(node.name);
      if (!topLevelNames.has(node.name) || visited.has(node.name)) return;
      visited.add(node.name);
      const local = findLocalDeclaration(program, node.name);
      if (local) pending.push(local);
    });
  }
  return reachable;
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
