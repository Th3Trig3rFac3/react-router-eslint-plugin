import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { getFrameworkConfigValue, staticStringArray } from "../utils/framework-config.js";
import { getSettings, isFrameworkConfigFile } from "../utils/settings.js";

type Options = [
  {
    routePaths?: string[];
    allow?: string[];
  }?,
];

function matchesRoutePath(value: string, pattern: string): boolean {
  const values = value.replace(/^\//u, "").split("/").filter(Boolean);
  const patterns = pattern.replace(/^\//u, "").split("/").filter(Boolean);
  let index = 0;
  for (const segment of patterns) {
    if (segment === "*") return true;
    const valueSegment = values[index];
    if (valueSegment === undefined) return false;
    if (!segment.startsWith(":") && segment !== valueSegment) return false;
    index += 1;
  }
  return index === values.length;
}

export default createRule<Options, "invalidPrerenderPath">({
  name: "valid-prerender-paths",
  meta: {
    type: "problem",
    docs: {
      description:
        "require static prerender paths to match route patterns and reject unresolved parameters",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          routePaths: { type: "array", items: { type: "string" }, uniqueItems: true },
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidPrerenderPath:
        "Prerender path '{{path}}' cannot be statically generated: {{reason}}.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isFrameworkConfigFile(context)) return;
        const value = getFrameworkConfigValue(program, "prerender");
        if (!value) return;
        const paths = staticStringArray(value.value);
        if (!paths) return;
        const options = context.options[0] ?? {};
        const routePaths = options.routePaths ?? getSettings(context).routePaths;
        for (const path of paths) {
          if (options.allow?.includes(path)) continue;
          const reason = /(^|\/):[^/]+(?:\/|$)|\*/u.test(path)
            ? "it contains a dynamic parameter or splat"
            : routePaths.length > 0 &&
                !routePaths.some((pattern) => matchesRoutePath(path, pattern))
              ? "it does not match any configured route pattern"
              : undefined;
          if (!reason) continue;
          context.report({
            node: value.node,
            messageId: "invalidPrerenderPath",
            data: { path, reason },
          });
        }
      },
    };
  },
});
