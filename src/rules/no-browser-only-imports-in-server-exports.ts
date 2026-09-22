import type { TSESTree } from "@typescript-eslint/utils";

import { findLocalDeclaration } from "../utils/ast.js";
import { createRule } from "../utils/create-rule.js";
import { getExport } from "../utils/exports.js";
import {
  collectReachableBindingNames,
  getRouteModuleExports,
} from "../utils/route-module.js";

type Options = [
  {
    allow?: string[];
    browserOnlyPackages?: string[];
  }?,
];

function isBrowserOnlySource(source: string, configured: string[]): boolean {
  return (
    source === "client-only" ||
    source === "browser-only" ||
    /\.client(?:[./?]|$)/u.test(source) ||
    source.includes("/client") ||
    configured.includes(source)
  );
}

export default createRule<Options, "browserOnlyImport">({
  name: "no-browser-only-imports-in-server-exports",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow explicit browser-only imports in route modules with server exports",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
          browserOnlyPackages: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      browserOnlyImport:
        "Server route exports must not reach browser-only module '{{source}}'. Move the import into a client export or use a server-safe module.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const exports = getRouteModuleExports(context, program);
        if (
          !exports ||
          !(
            exports.named.has("loader") ||
            exports.named.has("action") ||
            exports.named.has("middleware") ||
            exports.named.has("headers")
          )
        ) {
          return;
        }
        const options = context.options[0] ?? {};
        const serverExportNames = ["loader", "action", "middleware", "headers"] as const;
        const serverDeclarations: TSESTree.Node[] = [];
        for (const exportName of serverExportNames) {
          const info = getExport(exports, exportName);
          if (!info) continue;
          const declaration =
            info.declaration ??
            (info.localName ? findLocalDeclaration(program, info.localName) : undefined);
          if (declaration) serverDeclarations.push(declaration);
        }
        const serverBindingUses = collectReachableBindingNames(
          program,
          serverDeclarations,
        );
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration" || statement.importKind === "type")
            continue;
          const source = statement.source.value;
          if (options.allow?.includes(source)) continue;
          const usedByServer =
            statement.specifiers.length === 0 ||
            statement.specifiers.some((specifier) =>
              serverBindingUses.has(specifier.local.name),
            );
          if (
            usedByServer &&
            isBrowserOnlySource(source, options.browserOnlyPackages ?? [])
          ) {
            context.report({
              node: statement.source,
              messageId: "browserOnlyImport",
              data: { source },
            });
          }
        }
      },
    };
  },
});
