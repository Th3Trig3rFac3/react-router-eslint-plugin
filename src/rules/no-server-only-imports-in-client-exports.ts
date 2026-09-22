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
    serverOnlyPackages?: string[];
  }?,
];

const NODE_ONLY = new Set([
  "assert",
  "child_process",
  "crypto",
  "fs",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "stream",
  "tls",
  "util",
  "url",
  "worker_threads",
]);

function isServerOnlySource(source: string, configured: string[]): boolean {
  const bare = source.startsWith("node:") ? source.slice(5) : source;
  return (
    NODE_ONLY.has(bare) ||
    ["fs/", "path/", "stream/"].some((prefix) => bare.startsWith(prefix)) ||
    source === "server-only" ||
    /\.server(?:[./?]|$)/u.test(source) ||
    source.includes("/server") ||
    configured.includes(source)
  );
}

export default createRule<Options, "serverOnlyImport">({
  name: "no-server-only-imports-in-client-exports",
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow explicit server-only and Node imports in route modules with client exports",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
          serverOnlyPackages: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      serverOnlyImport:
        "Client route exports must not reach server-only module '{{source}}'. Move the import into a server export or use a browser-safe module.",
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
            exports.default ||
            exports.named.has("clientLoader") ||
            exports.named.has("clientAction") ||
            exports.named.has("clientMiddleware") ||
            exports.named.has("HydrateFallback")
          )
        ) {
          return;
        }
        const options = context.options[0] ?? {};
        const clientExportNames = [
          "default",
          "clientLoader",
          "clientAction",
          "clientMiddleware",
          "HydrateFallback",
        ] as const;
        const clientDeclarations: TSESTree.Node[] = [];
        for (const exportName of clientExportNames) {
          const info = getExport(exports, exportName);
          if (!info) continue;
          const declaration =
            info.declaration ??
            (info.localName ? findLocalDeclaration(program, info.localName) : undefined);
          if (declaration) clientDeclarations.push(declaration);
        }
        const clientBindingUses = collectReachableBindingNames(
          program,
          clientDeclarations,
        );
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration" || statement.importKind === "type")
            continue;
          const source = statement.source.value;
          if (options.allow?.includes(source)) continue;
          const usedByClient =
            statement.specifiers.length === 0 ||
            statement.specifiers.some((specifier) =>
              clientBindingUses.has(specifier.local.name),
            );
          if (
            usedByClient &&
            isServerOnlySource(source, options.serverOnlyPackages ?? [])
          ) {
            context.report({
              node: statement.source,
              messageId: "serverOnlyImport",
              data: { source },
            });
          }
        }
      },
    };
  },
});
