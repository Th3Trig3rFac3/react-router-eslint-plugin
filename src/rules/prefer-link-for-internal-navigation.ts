import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { staticString } from "../utils/ast.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [
  {
    allow?: string[];
  }?,
];

function attribute(
  node: TSESTree.JSXOpeningElement,
  name: string,
): TSESTree.JSXAttribute | undefined {
  return node.attributes.find(
    (item): item is TSESTree.JSXAttribute =>
      item.type === "JSXAttribute" && item.name.name === name,
  );
}

function stringValue(
  attributeNode: TSESTree.JSXAttribute | undefined,
): string | undefined {
  if (!attributeNode?.value) return undefined;
  if (
    attributeNode.value.type === "Literal" &&
    typeof attributeNode.value.value === "string"
  ) {
    return attributeNode.value.value;
  }
  if (attributeNode.value.type === "JSXExpressionContainer") {
    return staticString(attributeNode.value.expression as TSESTree.Node);
  }
  return undefined;
}

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/#");
}

function matchesAllow(href: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/gu, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "u").test(href);
}

export default createRule<Options, "internalAnchor">({
  name: "prefer-link-for-internal-navigation",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "require React Router links instead of plain anchors for internal application navigation",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      internalAnchor:
        "Use a React Router Link for internal navigation to '{{href}}', or keep this anchor only when a full document request is intentional.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    const options = context.options[0] ?? {};
    const allowed = options.allow ?? [];
    return {
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        if (!getRouteModuleExports(context, context.sourceCode.ast)) return;
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "a") return;
        if (attribute(node, "target") || attribute(node, "download")) return;
        if (attribute(node, "reloadDocument")) return;
        const href = stringValue(attribute(node, "href"));
        if (!href || !isInternalHref(href)) return;
        if (allowed.some((pattern) => matchesAllow(href, pattern))) return;
        context.report({ node, messageId: "internalAnchor", data: { href } });
      },
    };
  },
});
