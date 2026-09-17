/* global console */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const esm = await import(pathToFileURL(path.join(root, "dist", "index.js")).href);
const require = createRequire(import.meta.url);
const cjs = require(path.join(root, "dist", "index.cjs")) as Record<string, unknown>;

const assertPlugin = (value: unknown, format: string): void => {
  if (!value || typeof value !== "object") {
    throw new Error(`${format} entry did not return a plugin object`);
  }
  const plugin = value as { rules?: unknown; configs?: unknown; meta?: unknown };
  if (!plugin.rules || !plugin.configs || !plugin.meta) {
    throw new Error(`${format} entry is missing rules, configs, or meta`);
  }
};

assertPlugin(esm.default, "ESM");
assertPlugin(cjs.default ?? cjs, "CommonJS");
console.log("Verified ESM and CommonJS plugin entry points.");
