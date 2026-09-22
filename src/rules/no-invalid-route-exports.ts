import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { exportedNames } from "../utils/exports.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [
  {
    allow?: string[];
  }?,
];

const OFFICIAL_EXPORTS = new Set([
  "default",
  "middleware",
  "clientMiddleware",
  "loader",
  "clientLoader",
  "action",
  "clientAction",
  "ErrorBoundary",
  "HydrateFallback",
  "Layout",
  "ServerAction",
  "ServerComponent",
  "ServerErrorBoundary",
  "ServerHeaders",
  "ServerLayout",
  "ServerLoader",
  "ServerMiddleware",
  "clientHeaders",
  "clientMeta",
  "headers",
  "handle",
  "links",
  "meta",
  "shouldRevalidate",
]);

export default createRule<Options, "invalidExport">({
  name: "no-invalid-route-exports",
  meta: {
    type: "problem",
    docs: {
      description: "disallow misspelled or unsupported route-module exports",
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidExport:
        "{{name}} is not a recognized React Router route-module export. Check its spelling or add it to this rule's allow option if it is provided by an integration.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports || routeExports.hasExportAll) return;

        const allowed = new Set([
          ...OFFICIAL_EXPORTS,
          ...(context.options[0]?.allow ?? []),
        ]);

        for (const name of exportedNames(routeExports)) {
          if (allowed.has(name) || name.startsWith("unstable_")) continue;
          const info =
            name === "default" ? routeExports.default : routeExports.named.get(name);
          if (!info) continue;
          context.report({
            node: info.node,
            messageId: "invalidExport",
            data: { name },
          });
        }
      },
    };
  },
});
