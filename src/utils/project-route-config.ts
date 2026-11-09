import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import type { ModuleExports } from "../types.js";
import { collectExports } from "./exports.js";
import {
  analyzeRouteConfig,
  type RouteConfigAnalysis,
  type RouteConfigIssue,
  type StaticRouteEntry,
} from "./route-config.js";
import { isPathInsideProject } from "./path-resolution.js";
import { getCwd, getSettings } from "./settings.js";

interface ParserModule {
  // eslint-disable-next-line no-unused-vars
  parse(source: string, options: Record<string, unknown>): TSESTree.Program;
}

interface ParsedFile {
  filename: string;
  source: string;
  program: TSESTree.Program;
  analysis: RouteConfigAnalysis;
  exports?: ModuleExports;
}

export interface ProjectRouteConfigIssue {
  issue: RouteConfigIssue;
  sourceFile: string;
  reportNode: TSESTree.Node;
}

export interface ProjectRouteConfigEntry {
  entry: StaticRouteEntry;
  sourceFile: string;
  reportNode: TSESTree.Node;
}

export interface ProjectRouteConfigAnalysis {
  current: RouteConfigAnalysis;
  entries: ProjectRouteConfigEntry[];
  issues: ProjectRouteConfigIssue[];
  importedFiles: string[];
  hasUnknownImports: boolean;
}

const require = createRequire(import.meta.url);
let parser: ParserModule | undefined;
try {
  parser = require("@typescript-eslint/parser") as ParserModule;
} catch {
  // The published plugin can still lint the current file when a consumer uses
  // a parser other than typescript-eslint. Cross-file indexing is optional.
}

const parsedCache = new Map<
  string,
  { mtimeMs: number; size: number; parsed: ParsedFile }
>();

let analysisMemo = new WeakMap<
  TSESTree.Program,
  Map<string, ProjectRouteConfigAnalysis>
>();

export function clearProjectRouteCache(): void {
  parsedCache.clear();
  analysisMemo = new WeakMap();
}

export function setParserForTesting(customParser: ParserModule | undefined): void {
  parser = customParser;
  clearProjectRouteCache();
}

function safeProjectPath(projectRoot: string, candidate: string): string | undefined {
  const absolute = path.resolve(candidate);
  return isPathInsideProject(projectRoot, absolute) ? absolute : undefined;
}

function resolveLocalFile(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  importer: string,
  specifier: string,
): string | undefined {
  if (!specifier.startsWith(".") || specifier.includes("\0")) return undefined;
  const projectRoot = path.resolve(getCwd(context));
  const settings = getSettings(context);
  const requested = safeProjectPath(
    projectRoot,
    path.resolve(path.dirname(importer), specifier),
  );
  if (!requested) return undefined;
  const candidates = path.extname(requested)
    ? [requested]
    : [
        ...settings.extensions.map((extension) => `${requested}${extension}`),
        ...settings.extensions.map((extension) =>
          path.join(requested, `index${extension}`),
        ),
      ];
  for (const candidate of candidates) {
    try {
      if (!fs.statSync(candidate).isFile()) continue;
      const realCandidate = fs.realpathSync(candidate);
      if (safeProjectPath(projectRoot, realCandidate)) return realCandidate;
    } catch {
      // Missing or inaccessible fragments are unknown, not fatal parser errors.
    }
  }
  return undefined;
}

function relativeImports(program: TSESTree.Program): string[] {
  const imports: string[] = [];
  for (const statement of program.body) {
    if (
      (statement.type === "ImportDeclaration" ||
        statement.type === "ExportNamedDeclaration" ||
        statement.type === "ExportAllDeclaration") &&
      statement.source
    ) {
      const source = statement.source.value;
      if (typeof source === "string" && source.startsWith(".")) imports.push(source);
    }
  }
  return imports;
}

function parseFile(filename: string): ParsedFile | undefined {
  if (!parser) return undefined;
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filename);
  } catch {
    return undefined;
  }
  const cached = parsedCache.get(filename);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached.parsed;
  }
  try {
    const source = fs.readFileSync(filename, "utf8");
    const program = parser.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      filePath: filename,
      ecmaFeatures: { jsx: true },
      range: true,
      loc: true,
    });
    const parsed: ParsedFile = {
      filename,
      source,
      program,
      analysis: analyzeRouteConfig(program),
    };
    parsedCache.set(filename, { mtimeMs: stat.mtimeMs, size: stat.size, parsed });
    return parsed;
  } catch {
    return undefined;
  }
}

export function readCachedFile(filename: string): string | undefined {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filename);
  } catch {
    return undefined;
  }
  const cached = parsedCache.get(filename);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached.parsed.source;
  }
  const parsed = parseFile(filename);
  if (parsed) return parsed.source;
  try {
    return fs.readFileSync(filename, "utf8");
  } catch {
    return undefined;
  }
}

export function getCachedExports(filename: string): ModuleExports | undefined {
  const parsed = parseFile(filename);
  if (!parsed) return undefined;
  if (!parsed.exports) {
    parsed.exports = collectExports(parsed.program);
  }
  return parsed.exports;
}

export function analyzeProjectRouteConfig(
  context: TSESLint.RuleContext<string, readonly unknown[]>,
  program: TSESTree.Program,
): ProjectRouteConfigAnalysis {
  const filename = context.filename ?? context.getFilename();
  const currentFile =
    filename && filename !== "<input>" && filename !== "<text>"
      ? path.resolve(filename)
      : undefined;

  const projectRoot = path.resolve(getCwd(context));
  const settings = getSettings(context);
  const memoKey = `${projectRoot}\0${currentFile ?? ""}\0${settings.extensions.join(",")}`;

  let programMemo = analysisMemo.get(program);
  if (!programMemo) {
    programMemo = new Map();
    analysisMemo.set(program, programMemo);
  }
  const memoized = programMemo.get(memoKey);
  if (memoized) {
    return memoized;
  }

  const current = analyzeRouteConfig(program);
  const entries: ProjectRouteConfigEntry[] = current.entries.map((entry) => ({
    entry,
    sourceFile: currentFile ?? "<current>",
    reportNode: entry.pathNode ?? entry.idNode ?? entry.node,
  }));
  const issues: ProjectRouteConfigIssue[] = current.issues.map((issue) => ({
    issue,
    sourceFile: currentFile ?? "<current>",
    reportNode: issue.node,
  }));
  if (!currentFile || !parser) {
    const result: ProjectRouteConfigAnalysis = {
      current,
      entries,
      issues,
      importedFiles: [],
      hasUnknownImports: false,
    };
    programMemo.set(memoKey, result);
    return result;
  }

  const visited = new Set<string>([path.normalize(currentFile)]);
  const importedFiles: string[] = [];
  let hasUnknownImports = false;
  const queue: Array<{
    filename: string;
    program: TSESTree.Program;
    depth: number;
    ancestors: Set<string>;
  }> = [
    {
      filename: currentFile,
      program,
      depth: 0,
      ancestors: new Set([path.normalize(currentFile)]),
    },
  ];
  const maxDepth = 16;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || item.depth >= maxDepth) {
      if (item) hasUnknownImports = true;
      continue;
    }
    for (const specifier of relativeImports(item.program)) {
      const resolved = resolveLocalFile(context, item.filename, specifier);
      if (!resolved) {
        hasUnknownImports = true;
        continue;
      }
      const normalized = path.normalize(resolved);
      if (item.ancestors.has(normalized)) {
        // A recursive route-config fragment cannot be safely flattened. Keep
        // the graph conservative so orphan checks do not report files based on
        // an incomplete traversal.
        hasUnknownImports = true;
        continue;
      }
      if (visited.has(normalized)) continue;
      const safe = safeProjectPath(projectRoot, normalized);
      if (!safe) {
        hasUnknownImports = true;
        continue;
      }
      visited.add(normalized);
      importedFiles.push(normalized);
      const parsed = parseFile(normalized);
      if (!parsed) {
        hasUnknownImports = true;
        continue;
      }
      // Relative imports are often ordinary helpers or route components. Only
      // files whose default export is a statically analyzable route array are
      // route-config fragments; do not turn every local import into a
      // misleading `missingDefault` diagnostic.
      if (!parsed.analysis.isStaticArray) continue;
      for (const entry of parsed.analysis.entries) {
        entries.push({
          entry,
          sourceFile: normalized,
          // ESLint locations belong to the owning route-config file. The
          // current program is the stable anchor when an imported AST is not
          // the source tree being linted.
          reportNode: program,
        });
      }
      for (const issue of parsed.analysis.issues) {
        issues.push({ issue, sourceFile: normalized, reportNode: program });
      }
      queue.push({
        filename: normalized,
        program: parsed.program,
        depth: item.depth + 1,
        ancestors: new Set([...item.ancestors, normalized]),
      });
    }
  }

  const result: ProjectRouteConfigAnalysis = {
    current,
    entries,
    issues,
    importedFiles,
    hasUnknownImports,
  };
  programMemo.set(memoKey, result);
  return result;
}
