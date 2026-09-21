import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getExport } from "../utils/exports.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { matchesPattern, relativeFilename } from "../utils/settings.js";

type Options = [
  {
    allow?: string[];
    allowFiles?: string[];
  }?,
];

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

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

function getFunction(declaration: TSESTree.Node | undefined): FunctionNode | undefined {
  const node = declaration ? unwrap(declaration) : undefined;
  if (
    node?.type === "FunctionDeclaration" ||
    node?.type === "FunctionExpression" ||
    node?.type === "ArrowFunctionExpression"
  ) {
    return node;
  }
  if (node?.type === "VariableDeclarator" && node.init) {
    const initializer = unwrap(node.init);
    if (
      initializer.type === "FunctionExpression" ||
      initializer.type === "ArrowFunctionExpression"
    ) {
      return initializer;
    }
  }
  return undefined;
}

function findLocalDeclaration(
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

function isFalse(node: TSESTree.Node | null): boolean {
  const expression = node ? unwrap(node) : undefined;
  return expression?.type === "Literal" && expression.value === false;
}

function isAlwaysFalse(node: FunctionNode): boolean {
  if (node.body.type !== "BlockStatement") return isFalse(node.body);
  const statements = node.body.body.filter(
    (statement) => statement.type !== "EmptyStatement",
  );
  return (
    statements.length === 1 &&
    statements[0]?.type === "ReturnStatement" &&
    isFalse(statements[0].argument)
  );
}

export default createRule<Options, "alwaysFalse">({
  name: "safe-should-revalidate",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow trivially unconditional shouldRevalidate implementations that always return false",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          allowFiles: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      alwaysFalse:
        "This shouldRevalidate implementation always returns false, which can leave route data stale. Return defaultShouldRevalidate or explicitly allow this intentional policy.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const exports = getRouteModuleExports(context, program);
        const shouldRevalidate = exports && getExport(exports, "shouldRevalidate");
        if (!shouldRevalidate) return;

        const options = context.options[0] ?? {};
        const filename = relativeFilename(context);
        const allowFiles = [...(options.allow ?? []), ...(options.allowFiles ?? [])];
        if (
          filename !== undefined &&
          allowFiles.some((pattern) => matchesPattern(filename, pattern))
        ) {
          return;
        }

        const functionNode = getFunction(
          shouldRevalidate.declaration ??
            findLocalDeclaration(program, shouldRevalidate.localName),
        );
        if (!functionNode || !isAlwaysFalse(functionNode)) return;

        context.report({ node: shouldRevalidate.node, messageId: "alwaysFalse" });
      },
    };
  },
});
