import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { type RouteConfigIssueCode } from "../utils/route-config.js";
import { analyzeProjectRouteConfig } from "../utils/project-route-config.js";
import { isRouteConfigFile } from "../utils/settings.js";

export default createRule<[], RouteConfigIssueCode>({
  name: "valid-route-config",
  meta: {
    type: "problem",
    docs: {
      description:
        "require statically analyzable React Router route configuration entries to use valid shapes",
      recommended: true,
    },
    schema: [],
    messages: {
      missingDefault: "The route config must export a default array of route entries.",
      invalidDefault:
        "The route config default export must be an array of route entries or a supported static array binding.",
      invalidEntry:
        "This route config entry is not a supported route, index, layout, prefix, or RouteConfigEntry object.",
      invalidHelperArguments:
        "This React Router route helper has the wrong number of arguments.",
      missingFile: "This route config entry must specify a module file.",
      invalidFile: "The route module file must be a static string.",
      invalidPath: "The route path must be a static string.",
      invalidId: "The route id must be a static string.",
      invalidIndex: "The route index property must be a boolean literal.",
      invalidCaseSensitive: "The route caseSensitive property must be a boolean literal.",
      invalidChildren:
        "The route children property must be a static array of route entries.",
      indexChildren: "Index routes cannot have child routes.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        const analysis = analyzeProjectRouteConfig(context, program);
        for (const { issue, reportNode } of analysis.issues) {
          context.report({ node: reportNode, messageId: issue.code });
        }
      },
    };
  },
});
