import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import {
  findLocalDeclaration,
  functionFromDeclaration,
  getProperty,
  unwrap,
} from "../utils/ast.js";
import { getExport } from "../utils/exports.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { matchesPattern, relativeFilename } from "../utils/settings.js";

type Options = [
  {
    files?: string[];
    allowFiles?: string[];
    handlers?: string[];
  }?,
];

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

function responseExpression(
  node: TSESTree.Node | null,
): TSESTree.NewExpression | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  if (
    expression.type === "NewExpression" &&
    expression.callee.type === "Identifier" &&
    expression.callee.name === "Response"
  ) {
    return expression;
  }
  return undefined;
}

function hasContentType(headers: TSESTree.Node | undefined): boolean | undefined {
  if (!headers) return false;
  const expression = unwrap(headers);
  let object: TSESTree.ObjectExpression | undefined;
  if (expression.type === "ObjectExpression") {
    object = expression;
  } else if (
    expression.type === "NewExpression" &&
    expression.callee.type === "Identifier" &&
    expression.callee.name === "Headers"
  ) {
    const first = expression.arguments[0] as TSESTree.Node | undefined;
    object =
      first && unwrap(first).type === "ObjectExpression"
        ? (unwrap(first) as TSESTree.ObjectExpression)
        : undefined;
  }
  if (!object) return undefined;
  return object.properties.some((property) => {
    if (property.type !== "Property") return false;
    const key = property.key;
    const name =
      key.type === "Identifier"
        ? key.name
        : key.type === "Literal" && typeof key.value === "string"
          ? key.value
          : undefined;
    return name?.toLowerCase() === "content-type";
  });
}

function hasNonEmptyBody(node: TSESTree.Node | undefined): boolean | undefined {
  if (!node) return false;
  const expression = unwrap(node);
  if (expression.type === "Literal") {
    if (expression.value === null || expression.value === undefined) return false;
    if (typeof expression.value === "string") return expression.value.length > 0;
    return true;
  }
  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return (expression.quasis[0]?.value.cooked ?? "").length > 0;
  }
  if (expression.type === "ArrayExpression" || expression.type === "ObjectExpression") {
    return true;
  }
  return undefined;
}

export default createRule<Options, "missingContentType">({
  name: "require-resource-content-type",
  meta: {
    type: "problem",
    docs: {
      description:
        "require an explicit Content-Type header for scoped resource Responses with a body",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            uniqueItems: true,
          },
          allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true },
          handlers: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingContentType:
        "This scoped resource Response has a non-empty body but no Content-Type header. Add one that describes the representation, or exempt this intentional response from the rule.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const options = context.options[0] ?? {};
        const filename = relativeFilename(context);
        if (
          !filename ||
          !options.files?.some((pattern) => matchesPattern(filename, pattern)) ||
          options.allowFiles?.some((pattern) => matchesPattern(filename, pattern))
        ) {
          return;
        }
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports) return;

        for (const handlerName of options.handlers ?? ["loader", "action"]) {
          const info = getExport(routeExports, handlerName);
          if (!info) continue;
          const fn = functionFromDeclaration(
            info.declaration ?? findLocalDeclaration(program, info.localName),
          );
          if (!fn) continue;
          const returns: TSESTree.ReturnStatement[] = [];
          const throws: TSESTree.ThrowStatement[] = [];
          if (fn.body.type === "BlockStatement") {
            collectReturns(fn.body, returns, throws);
          } else {
            returns.push({ argument: fn.body } as TSESTree.ReturnStatement);
          }
          for (const statement of [...returns, ...throws]) {
            const response = responseExpression(statement.argument);
            if (!response) continue;
            const bodyStatus = hasNonEmptyBody(
              response.arguments[0] as TSESTree.Node | undefined,
            );
            if (bodyStatus !== true) continue;
            const init = response.arguments[1] as TSESTree.Node | undefined;
            const initObject = init && unwrap(init);
            const headers =
              initObject?.type === "ObjectExpression"
                ? getProperty(initObject, "headers")?.value
                : undefined;
            if (hasContentType(headers) !== true) {
              context.report({ node: response, messageId: "missingContentType" });
            }
          }
        }
      },
    };
  },
});
