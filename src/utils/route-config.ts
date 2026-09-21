import type { TSESTree } from "@typescript-eslint/utils";

export type RouteConfigHelper = "route" | "index" | "layout" | "prefix";

export type RouteConfigIssueCode =
  | "missingDefault"
  | "invalidDefault"
  | "invalidEntry"
  | "invalidHelperArguments"
  | "missingFile"
  | "invalidFile"
  | "invalidPath"
  | "invalidId"
  | "invalidIndex"
  | "invalidCaseSensitive"
  | "invalidChildren"
  | "indexChildren";

export interface RouteConfigIssue {
  code: RouteConfigIssueCode;
  node: TSESTree.Node;
}

export interface StaticRouteEntry {
  node: TSESTree.Node;
  kind: "route" | "index" | "layout" | "object";
  path?: string;
  pathNode?: TSESTree.Node;
  file?: string;
  fileNode?: TSESTree.Node;
  id?: string;
  idNode?: TSESTree.Node;
  caseSensitive: boolean;
  isIndex: boolean;
  siblingGroup: number;
  siblingPath?: string;
  fullPath?: string;
}

export interface RouteConfigAnalysis {
  isStaticArray: boolean;
  issues: RouteConfigIssue[];
  entries: StaticRouteEntry[];
}

interface HelperEnvironment {
  helpers: Map<string, RouteConfigHelper>;
  relativeNames: Set<string>;
  namespaces: Set<string>;
  relativeBindings: Set<string>;
}

interface StaticArrayResult {
  kind: "array" | "unknown" | "wrong";
  node?: TSESTree.ArrayExpression;
}

interface ParsedEntry {
  kind: "route" | "index" | "layout" | "object" | "prefix";
  node: TSESTree.Node;
  path?: string;
  pathNode?: TSESTree.Node;
  file?: string;
  fileNode?: TSESTree.Node;
  id?: string;
  idNode?: TSESTree.Node;
  caseSensitive: boolean;
  isIndex: boolean;
  children?: TSESTree.ArrayExpression;
  childrenUnknown: boolean;
}

interface BindingEnvironment {
  expressions: Map<string, TSESTree.Expression>;
  helpers: HelperEnvironment;
}

function unwrap(node: TSESTree.Node): TSESTree.Node {
  if (
    node.type === "TSAsExpression" ||
    node.type === "TSTypeAssertion" ||
    node.type === "TSSatisfiesExpression" ||
    node.type === "TSNonNullExpression" ||
    node.type === "ChainExpression"
  ) {
    return unwrap(node.expression);
  }
  return node;
}

function propertyName(node: TSESTree.Node): string | undefined {
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return undefined;
}

function staticString(node: TSESTree.Node | undefined): string | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  if (expression.type === "Literal" && typeof expression.value === "string") {
    return expression.value;
  }
  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return expression.quasis[0]?.value.cooked ?? "";
  }
  return undefined;
}

function staticBoolean(node: TSESTree.Node | undefined): boolean | undefined {
  if (!node) return undefined;
  const expression = unwrap(node);
  return expression.type === "Literal" && typeof expression.value === "boolean"
    ? expression.value
    : undefined;
}

function collectBindings(program: TSESTree.Program): BindingEnvironment {
  const expressions = new Map<string, TSESTree.Expression>();
  const helpers: HelperEnvironment = {
    helpers: new Map(),
    relativeNames: new Set(),
    namespaces: new Set(),
    relativeBindings: new Set(),
  };

  for (const statement of program.body) {
    if (statement.type === "ImportDeclaration") {
      if (statement.source.value !== "@react-router/dev/routes") continue;
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportSpecifier") {
          const imported = propertyName(specifier.imported);
          const local = specifier.local.name;
          if (
            imported === "route" ||
            imported === "index" ||
            imported === "layout" ||
            imported === "prefix"
          ) {
            helpers.helpers.set(local, imported);
          } else if (imported === "relative") {
            helpers.relativeNames.add(local);
          }
        } else if (specifier.type === "ImportNamespaceSpecifier") {
          helpers.namespaces.add(specifier.local.name);
        }
      }
      continue;
    }

    if (statement.type !== "VariableDeclaration") continue;
    for (const declaration of statement.declarations) {
      if (!declaration.init) continue;
      if (declaration.id.type === "Identifier") {
        expressions.set(declaration.id.name, declaration.init);
        if (isRelativeCall(declaration.init, helpers)) {
          helpers.relativeBindings.add(declaration.id.name);
        }
        continue;
      }

      if (declaration.id.type !== "ObjectPattern") continue;
      if (!isRelativeCall(declaration.init, helpers)) continue;
      for (const property of declaration.id.properties) {
        if (property.type !== "Property") continue;
        const imported = propertyName(property.key);
        const local =
          property.value.type === "Identifier" ? property.value.name : undefined;
        if (
          local &&
          (imported === "route" ||
            imported === "index" ||
            imported === "layout" ||
            imported === "prefix")
        ) {
          helpers.helpers.set(local, imported);
        }
      }
    }
  }

  return { expressions, helpers };
}

function isRelativeCall(node: TSESTree.Node, environment: HelperEnvironment): boolean {
  const expression = unwrap(node);
  if (expression.type !== "CallExpression") return false;
  if (
    expression.callee.type === "Identifier" &&
    environment.relativeNames.has(expression.callee.name)
  ) {
    return (
      staticString(expression.arguments[0] as TSESTree.Node | undefined) !== undefined
    );
  }
  return (
    expression.callee.type === "MemberExpression" &&
    !expression.callee.computed &&
    expression.callee.object.type === "Identifier" &&
    environment.namespaces.has(expression.callee.object.name) &&
    propertyName(expression.callee.property) === "relative" &&
    staticString(expression.arguments[0] as TSESTree.Node | undefined) !== undefined
  );
}

function resolveArray(
  node: TSESTree.Node | undefined,
  expressions: Map<string, TSESTree.Expression>,
  seen = new Set<string>(),
): StaticArrayResult {
  if (!node) return { kind: "unknown" };
  const expression = unwrap(node);
  if (expression.type === "ArrayExpression") return { kind: "array", node: expression };
  if (
    expression.type === "CallExpression" ||
    expression.type === "AwaitExpression" ||
    expression.type === "MemberExpression" ||
    expression.type === "ImportExpression"
  ) {
    return { kind: "unknown" };
  }
  if (expression.type !== "Identifier") return { kind: "wrong" };
  if (seen.has(expression.name)) return { kind: "unknown" };
  const binding = expressions.get(expression.name);
  if (!binding) return { kind: "unknown" };
  seen.add(expression.name);
  return resolveArray(binding, expressions, seen);
}

function helperKind(
  node: TSESTree.Node,
  environment: HelperEnvironment,
): RouteConfigHelper | undefined {
  const expression = unwrap(node);
  if (expression.type !== "CallExpression") return undefined;

  if (expression.callee.type === "Identifier") {
    return environment.helpers.get(expression.callee.name);
  }

  if (expression.callee.type !== "MemberExpression") return undefined;
  const member = propertyName(expression.callee.property);
  if (
    member !== "route" &&
    member !== "index" &&
    member !== "layout" &&
    member !== "prefix"
  ) {
    return undefined;
  }

  const object = expression.callee.object;
  if (object.type === "Identifier") {
    if (environment.namespaces.has(object.name)) return member;
    if (environment.relativeBindings.has(object.name)) return member;
  }

  if (object.type !== "CallExpression") return undefined;
  const relativeCallee = object.callee;
  const isRelative =
    (relativeCallee.type === "Identifier" &&
      environment.relativeNames.has(relativeCallee.name)) ||
    (relativeCallee.type === "MemberExpression" &&
      !relativeCallee.computed &&
      relativeCallee.object.type === "Identifier" &&
      environment.namespaces.has(relativeCallee.object.name) &&
      propertyName(relativeCallee.property) === "relative");
  return isRelative && staticString(object.arguments[0] as TSESTree.Node | undefined)
    ? member
    : undefined;
}

function getProperty(
  object: TSESTree.ObjectExpression,
  name: string,
): TSESTree.Property | undefined {
  return object.properties.find(
    (property): property is TSESTree.Property =>
      property.type === "Property" && propertyName(property.key) === name,
  );
}

function addIssue(
  issues: RouteConfigIssue[],
  code: RouteConfigIssueCode,
  node: TSESTree.Node,
): void {
  issues.push({ code, node });
}

function parseEntry(
  node: TSESTree.Node,
  environment: BindingEnvironment,
  issues: RouteConfigIssue[],
): ParsedEntry | undefined {
  const expression = unwrap(node);
  if (expression.type === "ObjectExpression") {
    const fileProperty = getProperty(expression, "file");
    const pathProperty = getProperty(expression, "path");
    const idProperty = getProperty(expression, "id");
    const indexProperty = getProperty(expression, "index");
    const caseSensitiveProperty = getProperty(expression, "caseSensitive");
    const childrenProperty = getProperty(expression, "children");

    const file = staticString(fileProperty?.value);
    const path = staticString(pathProperty?.value);
    const id = staticString(idProperty?.value);
    const index = staticBoolean(indexProperty?.value);
    const caseSensitive = staticBoolean(caseSensitiveProperty?.value);

    if (!fileProperty) addIssue(issues, "missingFile", expression);
    else if (file === undefined) addIssue(issues, "invalidFile", fileProperty.value);
    if (pathProperty && path === undefined)
      addIssue(issues, "invalidPath", pathProperty.value);
    if (idProperty && id === undefined) addIssue(issues, "invalidId", idProperty.value);
    if (indexProperty && index === undefined) {
      addIssue(issues, "invalidIndex", indexProperty.value);
    }
    if (caseSensitiveProperty && caseSensitive === undefined) {
      addIssue(issues, "invalidCaseSensitive", caseSensitiveProperty.value);
    }
    if (index === true && childrenProperty) {
      addIssue(issues, "indexChildren", childrenProperty.value);
    }
    if (index === true && pathProperty)
      addIssue(issues, "invalidPath", pathProperty.value);

    let children: TSESTree.ArrayExpression | undefined;
    let childrenUnknown = false;
    if (childrenProperty) {
      const resolved = resolveArray(childrenProperty.value, environment.expressions);
      if (resolved.kind === "array") children = resolved.node;
      else if (resolved.kind === "wrong") {
        addIssue(issues, "invalidChildren", childrenProperty.value);
      } else {
        childrenUnknown = true;
      }
    }

    return {
      kind: "object",
      node: expression,
      path,
      pathNode: pathProperty?.value,
      file,
      fileNode: fileProperty?.value,
      id,
      idNode: idProperty?.value,
      caseSensitive: caseSensitive ?? false,
      isIndex: index === true,
      children,
      childrenUnknown,
    };
  }

  const kind = helperKind(expression, environment.helpers);
  if (!kind) return undefined;
  if (expression.type !== "CallExpression") return undefined;

  const argumentsList = expression.arguments;
  const expectedArguments =
    kind === "route"
      ? [2, 3]
      : kind === "layout"
        ? [1, 2]
        : kind === "index"
          ? [1, 1]
          : [2, 2];
  if (
    argumentsList.length < expectedArguments[0]! ||
    argumentsList.length > expectedArguments[1]!
  ) {
    if (kind === "index" && argumentsList.length > 1) {
      addIssue(issues, "indexChildren", argumentsList[1] as TSESTree.Node);
    } else {
      addIssue(issues, "invalidHelperArguments", expression);
    }
  }

  if (kind === "prefix") {
    const prefix = staticString(argumentsList[0] as TSESTree.Node | undefined);
    if (prefix === undefined && argumentsList[0]) {
      addIssue(issues, "invalidPath", argumentsList[0] as TSESTree.Node);
    }
    const childrenResult = resolveArray(
      argumentsList[1] as TSESTree.Node | undefined,
      environment.expressions,
    );
    if (childrenResult.kind === "wrong" && argumentsList[1]) {
      addIssue(issues, "invalidChildren", argumentsList[1] as TSESTree.Node);
    }
    return {
      kind,
      node: expression,
      path: prefix,
      pathNode: argumentsList[0] as TSESTree.Node | undefined,
      caseSensitive: false,
      isIndex: false,
      children: childrenResult.node,
      childrenUnknown: childrenResult.kind === "unknown",
    };
  }

  const pathNode =
    kind === "route" ? (argumentsList[0] as TSESTree.Node | undefined) : undefined;
  const fileNode = (kind === "route" ? argumentsList[1] : argumentsList[0]) as
    TSESTree.Node | undefined;
  const path = kind === "route" ? staticString(pathNode) : undefined;
  const file = staticString(fileNode);
  if (kind === "route" && path === undefined && pathNode)
    addIssue(issues, "invalidPath", pathNode);
  if (file === undefined && fileNode) addIssue(issues, "invalidFile", fileNode);
  if (!fileNode) addIssue(issues, "missingFile", expression);

  // `route(path, file, children)` and `layout(file, children)` have different
  // positions; spelling this out keeps the helper contract visible here.
  const actualChildrenNode =
    kind === "route"
      ? (argumentsList[2] as TSESTree.Node | undefined)
      : (argumentsList[1] as TSESTree.Node | undefined);
  const childrenResult = resolveArray(actualChildrenNode, environment.expressions);
  if (childrenResult.kind === "wrong" && actualChildrenNode) {
    addIssue(issues, "invalidChildren", actualChildrenNode);
  }

  return {
    kind,
    node: expression,
    path,
    pathNode,
    file,
    fileNode,
    caseSensitive: false,
    isIndex: kind === "index",
    children: childrenResult.node,
    childrenUnknown: childrenResult.kind === "unknown",
  };
}

function joinPath(...parts: Array<string | undefined>): string | undefined {
  if (parts.some((part) => part === undefined)) return undefined;
  return parts
    .flatMap((part) => (part ?? "").split("/"))
    .filter((part) => part.length > 0)
    .join("/");
}

export function analyzeRouteConfig(program: TSESTree.Program): RouteConfigAnalysis {
  const issues: RouteConfigIssue[] = [];
  const entries: StaticRouteEntry[] = [];
  const environment = collectBindings(program);
  const defaultExport = program.body.find(
    (statement): statement is TSESTree.ExportDefaultDeclaration =>
      statement.type === "ExportDefaultDeclaration",
  );

  if (!defaultExport) {
    addIssue(issues, "missingDefault", program);
    return { isStaticArray: false, issues, entries };
  }

  const rootArray = resolveArray(defaultExport.declaration, environment.expressions);
  if (rootArray.kind !== "array" || !rootArray.node) {
    if (rootArray.kind === "wrong")
      addIssue(issues, "invalidDefault", defaultExport.declaration);
    return { isStaticArray: false, issues, entries };
  }

  let nextGroup = 0;
  const activeArrays = new Set<TSESTree.ArrayExpression>();

  function visitArray(
    array: TSESTree.ArrayExpression,
    parentPath: string | undefined,
    prefix: string,
    siblingGroupOverride?: number,
  ): void {
    if (activeArrays.has(array)) return;
    activeArrays.add(array);
    const siblingGroup = siblingGroupOverride ?? nextGroup++;

    for (const element of array.elements) {
      if (!element) continue;
      if (element.type === "SpreadElement") {
        const spreadExpression = unwrap(element.argument);
        const prefixEntry = parseEntry(spreadExpression, environment, issues);
        if (prefixEntry?.kind === "prefix" && prefixEntry.children) {
          visitArray(
            prefixEntry.children,
            parentPath,
            joinPath(prefix, prefixEntry.path) ?? prefix,
            siblingGroup,
          );
          continue;
        }
        const spreadArray = resolveArray(spreadExpression, environment.expressions);
        if (spreadArray.kind === "array" && spreadArray.node) {
          visitArray(spreadArray.node, parentPath, prefix, siblingGroup);
        }
        continue;
      }

      const parsed = parseEntry(element, environment, issues);
      if (!parsed || parsed.kind === "prefix") {
        if (parsed?.kind === "prefix") {
          addIssue(issues, "invalidEntry", parsed.node);
        } else if (!parsed && unwrap(element).type !== "CallExpression") {
          addIssue(issues, "invalidEntry", element);
        }
        continue;
      }

      const siblingPath = joinPath(prefix, parsed.path ?? "");
      const fullPath = joinPath(parentPath, siblingPath);
      const entry: StaticRouteEntry = {
        node: parsed.node,
        kind: parsed.kind,
        path: parsed.path,
        pathNode: parsed.pathNode,
        file: parsed.file,
        fileNode: parsed.fileNode,
        id: parsed.id,
        idNode: parsed.idNode,
        caseSensitive: parsed.caseSensitive,
        isIndex: parsed.isIndex,
        siblingGroup,
        siblingPath,
        fullPath,
      };
      entries.push(entry);

      if (parsed.children) {
        const childParentPath = fullPath;
        const isPathlessParent =
          parsed.kind === "layout" ||
          (parsed.kind === "object" && parsed.path === undefined && !parsed.isIndex);
        visitArray(
          parsed.children,
          childParentPath,
          "",
          isPathlessParent ? siblingGroup : undefined,
        );
      }
    }

    activeArrays.delete(array);
  }

  visitArray(rootArray.node, "", "");
  return { isStaticArray: true, issues, entries };
}

export function routeParameterNames(path: string): string[] {
  const names: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "*") {
      names.push("*");
      continue;
    }
    const match = /^:([^/?]+)\??$/u.exec(segment);
    if (match?.[1]) names.push(match[1]);
  }
  return names;
}

export function canonicalRoutePath(path: string, caseSensitive: boolean): string {
  return caseSensitive ? path : path.toLowerCase();
}
