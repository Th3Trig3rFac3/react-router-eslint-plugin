import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import {
  findLocalDeclaration,
  functionFromDeclaration,
  propertyName,
} from "../utils/ast.js";
import { getExport } from "../utils/exports.js";
import { routeParameterNames } from "../utils/route-config.js";
import { getRouteModuleExports } from "../utils/route-module.js";
import { getSettings } from "../utils/settings.js";

type Options = [
  {
    routePath?: string | string[];
    parentPaths?: string[];
  }?,
];

function walkFunction(
  node: TSESTree.Node,
  // eslint-disable-next-line no-unused-vars
  visitor: (node: TSESTree.Node) => void,
): void {
  visitor(node);
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent" || key === "loc" || key === "range" || key === "tokens") {
      continue;
    }
    if (!value || value === node) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && "type" in child) {
          walkFunction(child as TSESTree.Node, visitor);
        }
      }
    } else if (typeof value === "object" && "type" in value) {
      walkFunction(value as TSESTree.Node, visitor);
    }
  }
}

function patternProperty(
  property: TSESTree.Property,
): { name: string; value: TSESTree.Node } | undefined {
  const name = propertyName(property.key);
  if (!name) return undefined;
  return { name, value: property.value as TSESTree.Node };
}

function collectParamsBindings(parameter: TSESTree.Parameter): {
  paramsNames: Set<string>;
  argsNames: Set<string>;
  destructured: Array<{ node: TSESTree.Node; name: string }>;
} {
  const paramsNames = new Set<string>();
  const argsNames = new Set<string>();
  const destructured: Array<{ node: TSESTree.Node; name: string }> = [];
  if (parameter.type === "Identifier") {
    argsNames.add(parameter.name);
    return { paramsNames, argsNames, destructured };
  }
  if (parameter.type !== "ObjectPattern") {
    return { paramsNames, argsNames, destructured };
  }
  for (const item of parameter.properties) {
    if (item.type !== "Property") continue;
    const entry = patternProperty(item);
    if (!entry || entry.name !== "params") continue;
    if (entry.value.type === "Identifier") {
      paramsNames.add(entry.value.name);
    } else if (entry.value.type === "ObjectPattern") {
      for (const nested of entry.value.properties) {
        if (nested.type !== "Property") continue;
        const nestedName = propertyName(nested.key);
        if (nestedName) destructured.push({ node: nested.key, name: nestedName });
      }
    }
  }
  return { paramsNames, argsNames, destructured };
}

function declaredParameterNames(paths: string[]): Set<string> {
  return new Set(paths.flatMap((path) => routeParameterNames(path)));
}

export default createRule<Options, "invalidRouteParam">({
  name: "valid-route-params",
  meta: {
    type: "problem",
    docs: {
      description:
        "require direct route-parameter reads in loaders and actions to match a configured route path",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          routePath: {
            anyOf: [
              { type: "string" },
              {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                uniqueItems: true,
              },
            ],
          },
          parentPaths: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidRouteParam:
        "Parameter '{{name}}' is read from this route module, but the configured route path declares {{declared}}. Check the path spelling or use the parameter from the matching parent route.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    return {
      Program(program: TSESTree.Program) {
        const routeExports = getRouteModuleExports(context, program);
        if (!routeExports) return;
        const options = context.options[0] ?? {};
        const configured = options.routePath ?? getSettings(context).routePaths;
        const routePaths = Array.isArray(configured) ? configured : [configured];
        if (routePaths.length === 0) return;
        const declared = declaredParameterNames([
          ...routePaths,
          ...(options.parentPaths ?? []),
        ]);
        const declaredText =
          [...declared].map((name) => `'${name}'`).join(", ") || "none";

        for (const handlerName of ["loader", "action", "clientLoader", "clientAction"]) {
          const info = getExport(routeExports, handlerName);
          if (!info) continue;
          const fn = functionFromDeclaration(
            info.declaration ?? findLocalDeclaration(program, info.localName),
          );
          if (!fn || fn.params.length === 0) continue;
          const bindings = collectParamsBindings(fn.params[0]!);
          const reported = new Set<string>();
          const reportName = (name: string, node: TSESTree.Node): void => {
            if (declared.has(name) || name === "*") return;
            const key = `${name}:${node.range?.[0] ?? node.loc.start.line}`;
            if (reported.has(key)) return;
            reported.add(key);
            context.report({
              node,
              messageId: "invalidRouteParam",
              data: { name, declared: declaredText },
            });
          };

          for (const item of bindings.destructured) reportName(item.name, item.node);
          walkFunction(fn.body, (node) => {
            if (node.type !== "MemberExpression" || node.computed) return;
            const name = propertyName(node.property);
            if (!name) return;
            const object = node.object;
            if (object.type === "Identifier" && bindings.paramsNames.has(object.name)) {
              reportName(name, node.property);
              return;
            }
            if (
              object.type === "MemberExpression" &&
              !object.computed &&
              object.object.type === "Identifier" &&
              bindings.argsNames.has(object.object.name) &&
              propertyName(object.property) === "params"
            ) {
              reportName(name, node.property);
            }
          });
        }
      },
    };
  },
});
