import type { TSESTree } from "@typescript-eslint/utils";

export const DEFAULT_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
] as const;

export interface ReactRouterSettings {
  appDirectory?: string;
  rootRoute?: string | string[];
  routeConfig?: string | string[];
  frameworkConfig?: string | string[];
  routePaths?: string | string[];
  resourceRoutePaths?: string | string[];
  routeModuleFiles?: string | string[];
  extensions?: string[];
}

export interface NormalizedReactRouterSettings {
  appDirectory: string;
  rootRoute: string[];
  routeConfig: string[];
  frameworkConfig: string[];
  routePaths: string[];
  resourceRoutePaths: string[];
  routeModuleFiles: string[];
  extensions: string[];
}

export interface ExportInfo {
  name: string;
  node: TSESTree.Node;
  declaration?: TSESTree.Node;
  localName?: string;
  source?: string;
}

export interface ModuleExports {
  named: Map<string, ExportInfo>;
  default?: ExportInfo;
  hasExportAll: boolean;
}

export type RuleFileNode = TSESTree.Program;
