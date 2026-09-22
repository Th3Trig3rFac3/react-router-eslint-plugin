import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { propertyName } from "../utils/ast.js";

export interface DeprecatedApi {
  name: string;
  package?: string;
  replacement?: string;
}

type Options = [
  {
    apis?: DeprecatedApi[];
    allow?: string[];
  }?,
];

// Keep this table deliberately small. Entries are APIs with a documented
// migration path; additions should be made alongside a React Router release
// review rather than inferred from naming conventions.
const DEFAULT_APIS: DeprecatedApi[] = [
  { name: "json", package: "react-router", replacement: "data" },
  { name: "json", package: "react-router-dom", replacement: "data" },
];

function packageMatches(actual: string, expected: string | undefined): boolean {
  return expected === undefined
    ? /^react-router(?:$|-|\/)/u.test(actual)
    : actual === expected;
}

export default createRule<Options, "deprecatedApi">({
  name: "no-deprecated-react-router-api",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "disallow React Router APIs listed in the maintained deprecation table and suggest their replacement",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          apis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                package: { type: "string" },
                replacement: { type: "string" },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      deprecatedApi:
        "{{name}} from {{source}} is deprecated{{replacement}}. Use the documented replacement or update the React Router compatibility policy.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const options = context.options[0] ?? {};
        const apis = [...DEFAULT_APIS, ...(options.apis ?? [])];
        const namespaces = new Map<string, string>();
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration") continue;
          const source = statement.source.value;
          for (const specifier of statement.specifiers) {
            if (specifier.type === "ImportNamespaceSpecifier") {
              namespaces.set(specifier.local.name, source);
              continue;
            }
            if (specifier.type !== "ImportSpecifier") continue;
            const imported =
              specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : specifier.imported.value;
            const entry = apis.find(
              (api) =>
                api.name === imported &&
                packageMatches(source, api.package) &&
                !options.allow?.includes(imported),
            );
            if (!entry) continue;
            context.report({
              node: specifier,
              messageId: "deprecatedApi",
              data: {
                name: imported,
                source,
                replacement: entry.replacement
                  ? `; use ${entry.replacement} instead`
                  : "",
              },
            });
          }
        }

        function checkMember(node: TSESTree.MemberExpression): void {
          if (node.computed || node.object.type !== "Identifier") return;
          const source = namespaces.get(node.object.name);
          const name = propertyName(node.property);
          if (!source || !name) return;
          const entry = apis.find(
            (api) =>
              api.name === name &&
              packageMatches(source, api.package) &&
              !options.allow?.includes(name),
          );
          if (!entry) return;
          context.report({
            node,
            messageId: "deprecatedApi",
            data: {
              name,
              source,
              replacement: entry.replacement ? `; use ${entry.replacement} instead` : "",
            },
          });
        }

        function visit(node: TSESTree.Node): void {
          if (node.type === "MemberExpression") checkMember(node);
          for (const [key, value] of Object.entries(node)) {
            if (key === "parent" || key === "loc" || key === "range" || key === "tokens")
              continue;
            if (!value || value === node) continue;
            if (Array.isArray(value)) {
              for (const child of value) {
                if (child && typeof child === "object" && "type" in child)
                  visit(child as TSESTree.Node);
              }
            } else if (typeof value === "object" && "type" in value) {
              visit(value as TSESTree.Node);
            }
          }
        }
        visit(program);
      },
    };
  },
});
