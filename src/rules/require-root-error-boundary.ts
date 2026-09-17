import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { isRootRouteFile } from "../utils/settings.js";

type Options = [];

export default createRule<Options, "missingRootErrorBoundary">({
  name: "require-root-error-boundary",
  meta: {
    type: "problem",
    docs: {
      description: "require the root route module to export an ErrorBoundary",
      recommended: true,
    },
    schema: [],
    messages: {
      missingRootErrorBoundary:
        "The root route should export an ErrorBoundary so route errors do not render an empty document.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRootRouteFile(context)) return;
        const exports = getRouteModuleExports(context, program);
        if (exports?.named.has("ErrorBoundary") || exports?.hasExportAll) return;

        context.report({
          node: program,
          messageId: "missingRootErrorBoundary",
        });
      },
    };
  },
});
