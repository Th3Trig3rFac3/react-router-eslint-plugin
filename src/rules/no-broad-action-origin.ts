import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getFrameworkConfigValue } from "../utils/framework-config.js";
import { isFrameworkConfigFile } from "../utils/settings.js";
import { staticString, unwrap } from "../utils/ast.js";

type Options = [
  {
    allow?: string[];
  }?,
];

function broadOrigin(origin: string): boolean {
  return origin.includes("*");
}

export default createRule<Options, "broadOrigin">({
  name: "no-broad-action-origin",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow universal or wildcard allowedActionOrigins entries that weaken action-origin protection",
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
      broadOrigin:
        "allowedActionOrigins entry '{{origin}}' is broader than a concrete host. List the trusted origins explicitly or document this intentional policy.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isFrameworkConfigFile(context)) return;
        const value = getFrameworkConfigValue(program, "allowedActionOrigins");
        if (!value) return;
        const options = context.options[0] ?? {};
        const expression = unwrap(value.value);
        const origins =
          expression.type === "ArrayExpression"
            ? expression.elements.flatMap((element) => {
                if (!element || element.type === "SpreadElement") return [];
                const origin = staticString(element);
                return origin === undefined ? [] : [origin];
              })
            : [staticString(expression)].filter(
                (origin): origin is string => origin !== undefined,
              );
        for (const origin of origins) {
          if (broadOrigin(origin) && !options.allow?.includes(origin)) {
            context.report({
              node: value.node,
              messageId: "broadOrigin",
              data: { origin },
            });
          }
        }
      },
    };
  },
});
