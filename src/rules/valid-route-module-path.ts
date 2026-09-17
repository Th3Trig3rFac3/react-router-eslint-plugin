import path from "node:path";

import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.js";
import { resolveRouteModule } from "../utils/path-resolution.js";
import { getCwd, getSettings, isRouteConfigFile } from "../utils/settings.js";

type Options = [
  {
    checkExtensions?: string[];
    extensions?: string[];
  }?,
];

type HelperKind = "route" | "index" | "layout";

interface HelperReference {
  kind: HelperKind;
  baseDirectory?: string;
}

function staticString(node: TSESTree.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? "";
  }
  return undefined;
}

function propertyName(node: TSESTree.Node): string | undefined {
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return undefined;
}

function helperFromCall(
  call: TSESTree.CallExpression,
  helperReferences: Map<string, HelperReference>,
  relativeNames: Set<string>,
  relativeNamespaceNames: Set<string>,
  relativeBase: string,
): { reference?: HelperReference; moduleArgument?: TSESTree.Node } | undefined {
  const callee = call.callee;
  if (callee.type === "Identifier") {
    const reference = helperReferences.get(callee.name);
    if (reference) {
      return {
        reference,
        moduleArgument: call.arguments[reference.kind === "route" ? 1 : 0] as
          TSESTree.Node | undefined,
      };
    }

    if (relativeNames.has(callee.name)) return undefined;
  }

  if (callee.type !== "MemberExpression") return undefined;
  const member = propertyName(callee.property);
  if (member !== "route" && member !== "index" && member !== "layout") return undefined;

  let baseDirectory: string | undefined;
  if (callee.object.type === "Identifier") {
    baseDirectory = helperReferences.get(callee.object.name)?.baseDirectory;
  } else if (
    callee.object.type === "CallExpression" &&
    ((callee.object.callee.type === "Identifier" &&
      relativeNames.has(callee.object.callee.name)) ||
      (callee.object.callee.type === "MemberExpression" &&
        callee.object.callee.object.type === "Identifier" &&
        relativeNamespaceNames.has(
          `${callee.object.callee.object.name}.${propertyName(callee.object.callee.property) ?? ""}`,
        )))
  ) {
    const directory = staticString(
      callee.object.arguments[0] as TSESTree.Node | undefined,
    );
    if (directory !== undefined) baseDirectory = path.resolve(relativeBase, directory);
  }

  if (!baseDirectory) return undefined;
  const kind = member as HelperKind;
  return {
    reference: { kind, baseDirectory },
    moduleArgument: call.arguments[kind === "route" ? 1 : 0] as TSESTree.Node | undefined,
  };
}

export default createRule<Options, "unresolvedRouteModule">({
  name: "valid-route-module-path",
  meta: {
    type: "problem",
    docs: {
      description: "require static route-module paths in routes.ts to resolve to files",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          checkExtensions: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          extensions: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unresolvedRouteModule:
        "Cannot resolve route module {{modulePath}} from the app directory. Tried: {{candidates}}.",
    },
  },
  defaultOptions: [{}],
  create(context) {
    const helperReferences = new Map<string, HelperReference>();
    const relativeNames = new Set<string>();
    const relativeNamespaceNames = new Set<string>();
    let active = false;

    return {
      Program(program: TSESTree.Program) {
        active = isRouteConfigFile(context);
        if (!active) return;

        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration") continue;
          if (
            typeof statement.source.value !== "string" ||
            !/^@react-router\/dev\/routes(?:$|\/)/u.test(statement.source.value)
          ) {
            continue;
          }

          for (const specifier of statement.specifiers) {
            if (specifier.type === "ImportSpecifier") {
              const imported = propertyName(specifier.imported);
              const local = specifier.local.name;
              if (imported === "route" || imported === "index" || imported === "layout") {
                helperReferences.set(local, { kind: imported });
              } else if (imported === "relative") {
                relativeNames.add(local);
              }
              continue;
            }

            if (specifier.type === "ImportNamespaceSpecifier") {
              helperReferences.set(`${specifier.local.name}.route`, { kind: "route" });
              helperReferences.set(`${specifier.local.name}.index`, { kind: "index" });
              helperReferences.set(`${specifier.local.name}.layout`, { kind: "layout" });
              relativeNamespaceNames.add(`${specifier.local.name}.relative`);
            }
          }
        }

        // Register simple `const routes = relative("...")` bindings and
        // destructured helper bindings before child CallExpression visitors run.
        for (const statement of program.body) {
          if (statement.type !== "VariableDeclaration") continue;
          for (const declaration of statement.declarations) {
            const init = declaration.init;
            if (!init || init.type !== "CallExpression") continue;
            const isRelativeCall =
              (init.callee.type === "Identifier" &&
                relativeNames.has(init.callee.name)) ||
              (init.callee.type === "MemberExpression" &&
                init.callee.object.type === "Identifier" &&
                relativeNamespaceNames.has(
                  `${init.callee.object.name}.${propertyName(init.callee.property) ?? ""}`,
                ));
            if (!isRelativeCall) continue;
            const directory = staticString(
              init.arguments[0] as TSESTree.Node | undefined,
            );
            if (directory === undefined) continue;
            const baseDirectory = path.resolve(
              getCwd(context),
              getSettings(context).appDirectory,
              directory,
            );
            if (declaration.id.type === "Identifier") {
              for (const kind of ["route", "index", "layout"] as const) {
                helperReferences.set(`${declaration.id.name}.${kind}`, {
                  kind,
                  baseDirectory,
                });
              }
            } else if (declaration.id.type === "ObjectPattern") {
              for (const property of declaration.id.properties) {
                if (property.type !== "Property") continue;
                const importedName = propertyName(property.key);
                const localName =
                  property.value.type === "Identifier" ? property.value.name : undefined;
                if (
                  localName &&
                  (importedName === "route" ||
                    importedName === "index" ||
                    importedName === "layout")
                ) {
                  helperReferences.set(localName, {
                    kind: importedName,
                    baseDirectory,
                  });
                }
              }
            }
          }
        }
      },

      CallExpression(node: TSESTree.CallExpression) {
        if (!active) return;

        const directReference =
          node.callee.type === "Identifier"
            ? helperReferences.get(node.callee.name)
            : node.callee.type === "MemberExpression" &&
                node.callee.object.type === "Identifier"
              ? helperReferences.get(
                  `${node.callee.object.name}.${propertyName(node.callee.property) ?? ""}`,
                )
              : undefined;

        const resolved = directReference
          ? {
              reference: directReference,
              moduleArgument: node.arguments[directReference.kind === "route" ? 1 : 0] as
                TSESTree.Node | undefined,
            }
          : helperFromCall(
              node,
              helperReferences,
              relativeNames,
              relativeNamespaceNames,
              path.resolve(getCwd(context), getSettings(context).appDirectory),
            );

        if (!resolved?.reference || !resolved.moduleArgument) return;
        const modulePath = staticString(resolved.moduleArgument);
        if (modulePath === undefined) return;

        const settings = getSettings(context);
        const baseDirectory =
          resolved.reference.baseDirectory ??
          path.resolve(getCwd(context), settings.appDirectory);
        const result = resolveRouteModule(
          context,
          modulePath,
          baseDirectory,
          context.options[0]?.extensions ?? context.options[0]?.checkExtensions,
        );
        if (result.absolutePath) return;

        const candidates = result.candidates.map((candidate) =>
          path.relative(getCwd(context), candidate).replaceAll("\\", "/"),
        );
        context.report({
          node: resolved.moduleArgument,
          messageId: "unresolvedRouteModule",
          data: {
            modulePath,
            candidates:
              candidates.length > 0 ? candidates.join(", ") : "no safe candidates",
          },
        });
      },
    };
  },
});
