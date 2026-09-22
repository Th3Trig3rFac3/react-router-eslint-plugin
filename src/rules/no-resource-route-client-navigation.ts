import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { propertyName, staticString } from "../utils/ast.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { getSettings } from "../utils/settings.js";

type Options = [
  {
    resourceRoutes?: string[];
    allow?: string[];
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

function jsxStringAttribute(
  node: TSESTree.JSXOpeningElement,
  name: string,
): string | undefined {
  const attribute = jsxAttribute(node, name);
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

function normalizedPath(value: string): string {
  const [withoutQuery] = value.split(/[?#]/u, 1);
  const normalized = (withoutQuery ?? value).replaceAll("\\", "/");
  return normalized === ""
    ? "/"
    : normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;
}

function pathMatchesPattern(pathValue: string, patternValue: string): boolean {
  const pathParts = normalizedPath(pathValue).split("/").filter(Boolean);
  const patternParts = normalizedPath(patternValue).split("/").filter(Boolean);
  let pathIndex = 0;
  for (let patternIndex = 0; patternIndex < patternParts.length; patternIndex += 1) {
    const pattern = patternParts[patternIndex];
    if (pattern === "*") return true;
    const actual = pathParts[pathIndex];
    if (actual === undefined) return false;
    if (pattern?.startsWith(":")) {
      pathIndex += 1;
      continue;
    }
    if (pattern?.includes("*") && pattern.replaceAll("*", "") !== actual) return false;
    if (pattern !== actual) return false;
    pathIndex += 1;
  }
  return pathIndex === pathParts.length;
}

function isTruthyAttribute(attribute: TSESTree.JSXAttribute | undefined): boolean {
  if (!attribute) return false;
  if (!attribute.value) return true;
  if (attribute.value.type === "Literal") return attribute.value.value === true;
  if (attribute.value.type === "JSXExpressionContainer") {
    const expression = attribute.value.expression;
    return expression.type === "Literal" && expression.value === true;
  }
  return false;
}

function callTarget(node: TSESTree.CallExpression): string | undefined {
  const callee = node.callee;
  if (callee.type === "Identifier" && callee.name === "navigate") {
    return staticString(node.arguments[0] as TSESTree.Node | undefined);
  }
  if (
    callee.type === "MemberExpression" &&
    propertyName(callee.property) === "navigate"
  ) {
    return staticString(node.arguments[0] as TSESTree.Node | undefined);
  }
  return undefined;
}

export default createRule<Options, "clientNavigation">({
  name: "no-resource-route-client-navigation",
  meta: {
    type: "problem",
    docs: {
      description:
        "require document navigation when Link or navigate targets a known resource route",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          resourceRoutes: { type: "array", items: { type: "string" }, uniqueItems: true },
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      clientNavigation:
        "This client-side navigation targets the resource route '{{target}}'. Use an HTML anchor or Link with reloadDocument so the resource is requested as a document instead of being treated as route data.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    const options = context.options[0] ?? {};
    const resourceRoutes =
      options.resourceRoutes ?? getSettings(context).resourceRoutePaths;
    const allowed = options.allow ?? [];
    let active = false;

    function isResourceTarget(target: string): boolean {
      return (
        resourceRoutes.some((pattern) => pathMatchesPattern(target, pattern)) &&
        !allowed.some((pattern) => pathMatchesPattern(target, pattern))
      );
    }

    return {
      Program(program: TSESTree.Program) {
        active =
          Boolean(getRouteModuleExports(context, program)) && resourceRoutes.length > 0;
      },
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        if (!active) return;
        const name = jsxName(node.name);
        if (name !== "Link" && name !== "NavLink") return;
        if (isTruthyAttribute(jsxAttribute(node, "reloadDocument"))) return;
        const target = jsxStringAttribute(node, "to");
        if (!target || !isResourceTarget(target)) return;
        context.report({
          node,
          messageId: "clientNavigation",
          data: { target },
        });
      },
      CallExpression(node: TSESTree.CallExpression) {
        if (!active) return;
        const target = callTarget(node);
        if (!target || !isResourceTarget(target)) return;
        context.report({
          node,
          messageId: "clientNavigation",
          data: { target },
        });
      },
    };
  },
});
