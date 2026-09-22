import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { staticString } from "../utils/ast.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [
  {
    actionPaths?: string[];
    allowGetActions?: boolean | string[];
    components?: string[];
  }?,
];

function jsxAttribute(
  node: TSESTree.JSXOpeningElement,
  name: string,
): TSESTree.JSXAttribute | undefined {
  return node.attributes.find(
    (attribute): attribute is TSESTree.JSXAttribute =>
      attribute.type === "JSXAttribute" && attribute.name.name === name,
  );
}

function jsxAttributeValue(
  attribute: TSESTree.JSXAttribute | undefined,
): string | undefined {
  if (!attribute?.value) return undefined;
  if (attribute.value.type === "Literal" && typeof attribute.value.value === "string") {
    return attribute.value.value;
  }
  if (attribute.value.type === "JSXExpressionContainer") {
    return staticString(attribute.value.expression as TSESTree.Node);
  }
  return undefined;
}

function jsxName(node: TSESTree.JSXTagNameExpression): string | undefined {
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") {
    const object = jsxName(node.object);
    return object ? `${object}.${node.property.name}` : node.property.name;
  }
  return undefined;
}

function normalizePath(value: string): string {
  const normalized = value.replaceAll("\\", "/");
  if (normalized === "." || normalized === "./") return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function isTargetedAction(
  actionPaths: string[],
  target: string | undefined,
  currentFileHasAction: boolean,
): boolean {
  if (target === undefined || target === "" || target === "." || target === "./") {
    return currentFileHasAction;
  }
  const normalized = normalizePath(target.split(/[?#]/u, 1)[0] ?? target);
  return actionPaths.some((path) => normalizePath(path) === normalized);
}

export default createRule<Options, "missingMethod">({
  name: "no-action-form-default-method",
  meta: {
    type: "problem",
    docs: {
      description:
        "require a method on Forms that target a statically known action route",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          actionPaths: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          allowGetActions: {
            anyOf: [
              { type: "boolean" },
              { type: "array", items: { type: "string" }, uniqueItems: true },
            ],
          },
          components: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingMethod:
        'This Form targets a route with an action but omits method, so the browser defaults to GET. Add method="post" (or another intentional method), or allow an intentional GET action.',
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        const program = context.sourceCode.ast;
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports) return;
        const options = context.options[0] ?? {};
        const actionPaths = options.actionPaths ?? [];
        const allowGetActions = options.allowGetActions;
        if (allowGetActions === true) return;

        const name = jsxName(node.name);
        if (!name || !(options.components ?? ["Form"]).includes(name)) return;
        if (jsxAttribute(node, "method")) return;

        const action = jsxAttributeValue(jsxAttribute(node, "action"));
        const hasCurrentAction = routeExports.named.has("action");
        if (!isTargetedAction(actionPaths, action, hasCurrentAction)) return;

        if (
          Array.isArray(allowGetActions) &&
          action !== undefined &&
          allowGetActions.some((pattern) => pattern === action)
        ) {
          return;
        }

        context.report({ node, messageId: "missingMethod" });
      },
    };
  },
});
