/* global console */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rules = [
  "consistent-route-module-extension",
  "no-action-form-default-method",
  "no-action-only-routes",
  "no-browser-only-imports-in-server-exports",
  "no-broad-action-origin",
  "no-conflicting-route-exports",
  "no-conflicting-route-paths",
  "no-deprecated-react-router-api",
  "no-duplicate-route-ids",
  "no-duplicate-route-params",
  "no-invalid-route-exports",
  "no-multiple-middleware-next",
  "no-orphan-route-modules",
  "no-resource-route-client-navigation",
  "no-route-manifest-collision",
  "no-sensitive-error-output",
  "no-server-only-imports-in-client-exports",
  "prefer-link-for-internal-navigation",
  "require-hydrate-fallback",
  "require-outlet-for-child-routes",
  "require-resource-content-type",
  "require-route-error-boundary",
  "require-root-error-boundary",
  "return-server-middleware-response",
  "resource-route-returns-response",
  "safe-should-revalidate",
  "splittable-route-module",
  "valid-prerender-paths",
  "valid-route-module",
  "valid-route-params",
  "valid-route-config",
  "valid-route-module-path",
];

const read = (filename: string) => fs.readFileSync(path.join(root, filename), "utf8");
const readme = read("README.md");
const normalizedReadme = readme.replaceAll("\\|", "|");
const nodeRow = normalizedReadme
  .split(/\r?\n/u)
  .find((line) => /^\|\s*Node\.js\s*\|/u.test(line));
const packageJson = JSON.parse(read("package.json")) as {
  engines?: { node?: unknown };
};
const nodeEngine = packageJson.engines?.node;
if (typeof nodeEngine !== "string") {
  throw new Error("package.json is missing a string engines.node value");
}
if (!nodeRow?.includes(`\`${nodeEngine}\``)) {
  throw new Error(
    `README Node.js support row does not match engines.node: ${nodeEngine}`,
  );
}

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
