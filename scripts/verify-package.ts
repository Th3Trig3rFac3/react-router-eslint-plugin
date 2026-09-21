/* global console */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as { version?: unknown };
if (typeof packageJson.version !== "string") {
  throw new Error("package.json is missing a string version");
}
const esm = await import(pathToFileURL(path.join(root, "dist", "index.js")).href);
const require = createRequire(import.meta.url);
const cjs = require(path.join(root, "dist", "index.cjs")) as Record<string, unknown>;

const assertPlugin = (value: unknown, format: string): void => {
  if (!value || typeof value !== "object") {
    throw new Error(`${format} entry did not return a plugin object`);
  }
  const plugin = value as {
    rules?: unknown;
    configs?: unknown;
    meta?: { version?: unknown };
  };
  if (!plugin.rules || !plugin.configs || !plugin.meta) {
    throw new Error(`${format} entry is missing rules, configs, or meta`);
  }
  if (plugin.meta.version !== packageJson.version) {
    throw new Error(
      `${format} plugin metadata version ${String(plugin.meta.version)} does not match package.json ${packageJson.version}`,
    );
  }
};

assertPlugin(esm.default, "ESM");
assertPlugin(cjs.default ?? cjs, "CommonJS");
console.log("Verified ESM and CommonJS plugin entry points.");
