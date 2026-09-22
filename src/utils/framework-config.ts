import type { TSESTree } from "@typescript-eslint/utils";

import { getProperty, staticString, unwrap } from "./ast.js";

export interface FrameworkConfigValue {
  node: TSESTree.Node;
  value: TSESTree.Node;
}

function variableValue(
  program: TSESTree.Program,
  name: string,
): TSESTree.Node | undefined {
  for (const statement of program.body) {
    const declarationStatement =
      statement.type === "VariableDeclaration"
        ? statement
        : statement.type === "ExportNamedDeclaration" &&
            statement.declaration?.type === "VariableDeclaration"
          ? statement.declaration
          : undefined;
    if (!declarationStatement) continue;
    for (const declaration of declarationStatement.declarations) {
      if (declaration.id.type === "Identifier" && declaration.id.name === name) {
        return declaration.init ?? undefined;
      }
    }
  }
  return undefined;
}

export function getFrameworkConfigValue(
  program: TSESTree.Program,
  name: string,
): FrameworkConfigValue | undefined {
  const variable = variableValue(program, name);
  if (variable) return { node: variable, value: variable };

  for (const statement of program.body) {
    if (statement.type !== "ExportDefaultDeclaration") continue;
    let declaration = unwrap(statement.declaration);
    if (declaration.type === "Identifier") {
      declaration = unwrap(variableValue(program, declaration.name) ?? declaration);
    }
    if (declaration.type !== "ObjectExpression") continue;
    const property = getProperty(declaration, name);
    if (property) return { node: property, value: property.value };
  }
  return undefined;
}

export function staticStringArray(node: TSESTree.Node | undefined): string[] | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  if (expression.type !== "ArrayExpression") return undefined;
  const values: string[] = [];
  for (const element of expression.elements) {
    if (!element || element.type === "SpreadElement") return undefined;
    const value = staticString(element);
    if (value === undefined) return undefined;
    values.push(value);
  }
  return values;
}
