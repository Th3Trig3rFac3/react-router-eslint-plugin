import type { TSESTree } from "@typescript-eslint/utils";

export type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

export function unwrap(node: TSESTree.Node): TSESTree.Node {
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

export function staticString(node: TSESTree.Node | undefined): string | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  if (expression.type === "Literal" && typeof expression.value === "string") {
    return expression.value;
  }
  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return expression.quasis[0]?.value.cooked ?? "";
  }
  return undefined;
}

export function staticBoolean(node: TSESTree.Node | undefined): boolean | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  return expression.type === "Literal" && typeof expression.value === "boolean"
    ? expression.value
    : undefined;
}

export function propertyName(node: TSESTree.Node): string | undefined {
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return undefined;
}

export function isFunctionNode(node: TSESTree.Node | undefined): node is FunctionNode {
  return (
    node?.type === "FunctionDeclaration" ||
    node?.type === "FunctionExpression" ||
    node?.type === "ArrowFunctionExpression"
  );
}

export function findLocalDeclaration(
  program: TSESTree.Program,
  localName: string | undefined,
): TSESTree.Node | undefined {
  if (!localName) return undefined;
  for (const statement of program.body) {
    if (
      (statement.type === "FunctionDeclaration" ||
        statement.type === "ClassDeclaration") &&
      statement.id?.name === localName
    ) {
      return statement;
    }
    if (statement.type !== "VariableDeclaration") continue;
    const declaration = statement.declarations.find(
      (item) => item.id.type === "Identifier" && item.id.name === localName,
    );
    if (declaration) return declaration;
  }
  return undefined;
}

export function functionFromDeclaration(
  declaration: TSESTree.Node | undefined,
): FunctionNode | undefined {
  if (!declaration) return undefined;
  const node = unwrap(declaration);
  if (isFunctionNode(node)) return node;
  if (node.type === "VariableDeclarator" && node.init) {
    const initializer = unwrap(node.init);
    if (isFunctionNode(initializer)) return initializer;
  }
  return undefined;
}

export function getProperty(
  object: TSESTree.ObjectExpression,
  name: string,
): TSESTree.Property | undefined {
  return object.properties.find(
    (property): property is TSESTree.Property =>
      property.type === "Property" && propertyName(property.key) === name,
  );
}

/**
 * Walk a node without following the `parent` links added by ESLint parsers.
 * A small local walker keeps file-based rules independent from a particular
 * parser's visitor-key implementation while remaining entirely static.
 */
export function walkNode(
  node: TSESTree.Node,
  // eslint-disable-next-line no-unused-vars
  visitor: (node: TSESTree.Node) => void,
): void {
  visitor(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent" || key === "loc" || key === "range" || key === "tokens") {
      continue;
    }
    if (!value || value === node) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && "type" in child) {
          walkNode(child as TSESTree.Node, visitor);
        }
      }
    } else if (typeof value === "object" && "type" in value) {
      walkNode(value as TSESTree.Node, visitor);
    }
  }
}
