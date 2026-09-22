import path from "node:path";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { analyzeRouteConfig } from "../utils/route-config.js";
import { getSettings, isRouteConfigFile } from "../utils/settings.js";

type Options = [
  {
    mode?: "always" | "never";
    extension?: string;
  }?,
];

export default createRule<Options, "inconsistentExtension">({
  name: "consistent-route-module-extension",
  meta: {
    type: "suggestion",
    docs: {
      description: "enforce a configured extension style for static route-module paths",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["always", "never"] },
          extension: { type: "string", pattern: "^\\.[A-Za-z0-9]+$" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      inconsistentExtension:
        "Route module '{{modulePath}}' does not follow the configured {{mode}} extension policy{{extension}}.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        if (!isRouteConfigFile(context)) return;
        const options = context.options[0] ?? {};
        const mode = options.mode;
        if (!mode) return;
        const configuredExtension = options.extension;
        const extensions = getSettings(context).extensions;
        for (const entry of analyzeRouteConfig(program).entries) {
          if (!entry.file || !entry.fileNode) continue;
          const extension = path.extname(entry.file);
          const hasRecognizedExtension = extensions.includes(extension);
          const valid =
            mode === "never"
              ? !hasRecognizedExtension
              : configuredExtension
                ? extension === configuredExtension
                : hasRecognizedExtension;
          if (valid) continue;
          context.report({
            node: entry.fileNode,
            messageId: "inconsistentExtension",
            data: {
              modulePath: entry.file,
              mode,
              extension: configuredExtension ? ` (${configuredExtension})` : "",
            },
          });
        }
      },
    };
  },
});
