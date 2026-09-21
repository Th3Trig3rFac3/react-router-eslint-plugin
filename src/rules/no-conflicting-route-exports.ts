import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getRouteModuleExports } from "../utils/route-module.js";

type Options = [{ rsc?: boolean }?];

const CONFLICTS = [
  ["default", "ServerComponent"],
  ["ErrorBoundary", "ServerErrorBoundary"],
  ["Layout", "ServerLayout"],
  ["HydrateFallback", "ServerHydrateFallback"],
] as const;

export default createRule<Options, "conflictingExports">({
  name: "no-conflicting-route-exports",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow mutually exclusive client and server route-module exports when RSC checks are enabled",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: { rsc: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
    messages: {
      conflictingExports:
        "This route exports both '{{clientExport}}' and '{{serverExport}}', which are mutually exclusive in React Server Components mode.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!context.options[0]?.rsc) return;
        const exports = getRouteModuleExports(context, program);
        if (!exports || exports.hasExportAll) return;

        for (const [clientExport, serverExport] of CONFLICTS) {
          const client =
            clientExport === "default"
              ? exports.default
              : exports.named.get(clientExport);
          const server = exports.named.get(serverExport);
          if (!client || !server) continue;

          context.report({
            node: client.node,
            messageId: "conflictingExports",
            data: { clientExport, serverExport },
          });
          context.report({
            node: server.node,
            messageId: "conflictingExports",
            data: { clientExport, serverExport },
          });
        }
      },
    };
  },
});
