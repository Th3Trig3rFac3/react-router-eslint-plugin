import type { TSESTree } from "@typescript-eslint/utils";

import { propertyName, staticString, unwrap } from "./ast.js";

export interface FrameworkConfigValue {
  node: TSESTree.Node;
  value: TSESTree.Node;
}

function variableValue(
  program: TSESTree.Program,
  name: string,
): TSESTree.Node | undefined {
  const declarations: TSESTree.VariableDeclarator[] = [];
  for (const statement of program.body) {
    const declarationStatement =
      statement.type === "VariableDeclaration"
        ? statement
        : statement.type === "ExportNamedDeclaration" &&
            statement.declaration?.type === "VariableDeclaration"
          ? statement.declaration
          : undefined;
    if (!declarationStatement || declarationStatement.kind !== "const") continue;
    for (const declaration of declarationStatement.declarations) {
      if (declaration.id.type === "Identifier" && declaration.id.name === name) {
        declarations.push(declaration);
      }
    }
  }

  return declarations.length === 1 ? (declarations[0]?.init ?? undefined) : undefined;
}

function resolveConstants(
  program: TSESTree.Program,
  node: TSESTree.Node,
  seen: Set<string> = new Set(),
): TSESTree.Node {
  const expression = unwrap(node);
  if (expression.type !== "Identifier" || seen.has(expression.name)) return expression;
  const value = variableValue(program, expression.name);
  if (!value) return expression;
  const next = new Set(seen);
  next.add(expression.name);
  return resolveConstants(program, value, next);
}

function objectProperty(
  object: TSESTree.ObjectExpression,
  name: string,
): TSESTree.Property | undefined {
  // Spreads and computed keys can overwrite a literal property at runtime.
  // Leave the object unknown instead of reporting from an ambiguous value.
  if (
    object.properties.some(
      (property) =>
        property.type === "SpreadElement" ||
        (property.type === "Property" && property.computed),
    )
  ) {
    return undefined;
  }

  const matches = object.properties.filter(
    (property): property is TSESTree.Property =>
      property.type === "Property" && propertyName(property.key) === name,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function getObjectConfigValue(
  program: TSESTree.Program,
  node: TSESTree.Node,
  name: string,
): FrameworkConfigValue | undefined {
  const object = resolveConstants(program, node);
  if (object.type !== "ObjectExpression") return undefined;
  const property = objectProperty(object, name);
  if (!property || property.method || property.kind !== "init") return undefined;
  return {
    node: property,
    value:
      property.value.type === "AssignmentPattern"
        ? property.value.right
        : resolveConstants(program, property.value),
  };
}

export function getFrameworkConfigValue(
  program: TSESTree.Program,
  name: string,
  parent?: TSESTree.Node,
): FrameworkConfigValue | undefined {
  if (parent) {
    return getObjectConfigValue(program, parent, name);
  }

  const defaults = program.body.filter(
    (statement): statement is TSESTree.ExportDefaultDeclaration =>
      statement.type === "ExportDefaultDeclaration",
  );
  if (defaults.length !== 1) return undefined;
  const declaration = defaults[0]?.declaration;
  if (
    !declaration ||
    declaration.type === "FunctionDeclaration" ||
    declaration.type === "ClassDeclaration"
  ) {
    return undefined;
  }
  return getObjectConfigValue(program, declaration, name);
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
