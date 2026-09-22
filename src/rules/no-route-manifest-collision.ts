import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getFrameworkConfigValue } from "../utils/framework-config.js";
import { getSettings, isFrameworkConfigFile } from "../utils/settings.js";
import { staticString } from "../utils/ast.js";

type Options = [
  {
    routePaths?: string[];
    resourcePaths?: string[];
    allow?: string[];
  }?,
];

export default createRule<Options, "manifestCollision">({
  name: "no-route-manifest-collision",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow a lazy route manifest path that collides with a configured application route",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          routePaths: { type: "array", items: { type: "string" }, uniqueItems: true },
          resourcePaths: { type: "array", items: { type: "string" }, uniqueItems: true },
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      manifestCollision:
        "The route manifest path '{{manifestPath}}' collides with an application route or resource path. Choose a path that cannot be requested as a route.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isFrameworkConfigFile(context)) return;
        const manifest = getFrameworkConfigValue(program, "manifestPath");
        const manifestPath = manifest && staticString(manifest.value);
        if (!manifest || manifestPath === undefined) return;
        const options = context.options[0] ?? {};
        if (options.allow?.includes(manifestPath)) return;
        const settings = getSettings(context);
        const allPaths = [
          ...(options.routePaths ?? settings.routePaths),
          ...(options.resourcePaths ?? settings.resourceRoutePaths),
        ];
        if (!allPaths.includes(manifestPath)) return;
        context.report({
          node: manifest.node,
          messageId: "manifestCollision",
          data: { manifestPath },
        });
      },
    };
  },
});
