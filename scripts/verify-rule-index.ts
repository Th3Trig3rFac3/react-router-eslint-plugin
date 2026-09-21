/* global console */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rules = [
  "no-action-only-routes",
  "no-conflicting-route-exports",
  "no-conflicting-route-paths",
  "no-duplicate-route-ids",
  "no-duplicate-route-params",
  "no-invalid-route-exports",
  "require-hydrate-fallback",
  "require-root-error-boundary",
  "resource-route-returns-response",
  "safe-should-revalidate",
  "valid-route-config",
  "valid-route-module-path",
];

const read = (filename: string) => fs.readFileSync(path.join(root, filename), "utf8");
const readme = read("README.md");

for (const rule of rules) {
  const docPath = path.join(root, "docs", "rules", `${rule}.md`);
  if (!fs.existsSync(docPath)) {
    throw new Error(`Missing rule documentation: docs/rules/${rule}.md`);
  }
  if (!readme.includes(`\`${rule}\``)) {
    throw new Error(`README does not list rule: ${rule}`);
  }
}

console.log(`Verified ${rules.length} rule documentation pages and README entries.`);
