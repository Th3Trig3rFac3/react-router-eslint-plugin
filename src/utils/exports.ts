import type { TSESTree } from "@typescript-eslint/utils";

import type { ExportInfo, ModuleExports } from "../types.js";

function identifierName(node: TSESTree.Node | null | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return undefined;
}

function declarationNames(
  declaration: TSESTree.Node | null | undefined,
): Array<{ name: string; node: TSESTree.Node }> {
  if (!declaration) return [];

  if (
    declaration.type === "FunctionDeclaration" ||
    declaration.type === "ClassDeclaration"
  ) {
    const name = identifierName(declaration.id);
    return name ? [{ name, node: declaration }] : [];
  }

  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations.flatMap((item) => {
      const name = identifierName(item.id);
      return name ? [{ name, node: item }] : [];
    });
  }

  return [];
}

export function collectExports(program: TSESTree.Program): ModuleExports {
  const named = new Map<string, ExportInfo>();
  let defaultExport: ExportInfo | undefined;
  let hasExportAll = false;

  for (const statement of program.body) {
    if (statement.type === "ExportDefaultDeclaration") {
      defaultExport = {
        name: "default",
        node: statement,
        declaration: statement.declaration,
      };
      continue;
    }

    if (statement.type === "ExportAllDeclaration") {
      hasExportAll = true;
      continue;
    }

    if (statement.type !== "ExportNamedDeclaration") continue;
    if (statement.exportKind === "type") continue;

    const source = statement.source?.value;
    const sourceValue = typeof source === "string" ? source : undefined;

    for (const { name, node } of declarationNames(statement.declaration)) {
      named.set(name, {
        name,
        node: statement,
        declaration: node,
        localName: name,
        source: sourceValue,
      });
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type !== "ExportSpecifier") continue;
      if (specifier.exportKind === "type") continue;
      const exported = identifierName(specifier.exported);
      const local = identifierName(specifier.local);
      if (!exported) continue;
      named.set(exported, {
        name: exported,
        node: specifier,
        localName: local,
        source: sourceValue,
      });
    }
  }

  return { named, default: defaultExport, hasExportAll };
}

export function hasExport(exports: ModuleExports, name: string): boolean {
  return name === "default" ? exports.default !== undefined : exports.named.has(name);
}

export function getExport(exports: ModuleExports, name: string): ExportInfo | undefined {
  return name === "default" ? exports.default : exports.named.get(name);
}

export function exportedNames(exports: ModuleExports): string[] {
  return [...(exports.default ? ["default"] : []), ...exports.named.keys()];
}
