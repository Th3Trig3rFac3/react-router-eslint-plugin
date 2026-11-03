import fs from "node:fs";
import path from "node:path";

import plugin, { configs } from "../src/index.js";

const aliases = { "valid-resource-route": "resource-route-returns-response" };
const ruleLink = (name: string) => `docs/rules/${name}.md`;

export function verifyRuleIndex(root: string): string {
  const read = (filename: string) => fs.readFileSync(path.join(root, filename), "utf8");
  const packageJson = JSON.parse(read("package.json")) as {
    engines?: { node?: unknown };
    peerDependencies?: { eslint?: unknown };
  };
  const nodeEngine = packageJson.engines?.node;
  const eslintPeer = packageJson.peerDependencies?.eslint;
  if (typeof nodeEngine !== "string" || typeof eslintPeer !== "string") {
    throw new Error("package.json must declare engines.node and peerDependencies.eslint");
  }

  const rules = Object.keys(plugin.rules).filter((name) => !(name in aliases));
  const pluginRules = plugin.rules as Record<string, unknown>;
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (pluginRules[alias] !== pluginRules[canonical]) {
      throw new Error(`Rule alias ${alias} must reference ${canonical}`);
    }
  }

  const readme = read("README.md").replaceAll("\\|", "|");
  const lines = readme.split(/\r?\n/u);
  const nodeRow = lines.find((line) => /^\|\s*Node\.js\s*\|/u.test(line));
  const eslintRow = lines.find((line) => /^\|\s*ESLint\s*\|/u.test(line));
  if (!nodeRow?.includes(`\`${nodeEngine}\``)) {
    throw new Error(
      `README Node.js support row does not match engines.node: ${nodeEngine}`,
    );
  }
  if (!eslintRow?.includes(`\`${eslintPeer}\``)) {
    throw new Error(
      `README ESLint support row does not match peerDependencies.eslint: ${eslintPeer}`,
    );
  }

  const ruleRows = new Map<string, string>();
  for (const line of lines) {
    const match = /^\|\s*`([^`]+)`\s*\|[^|]*\|\s*([^|]+)\s*\|/u.exec(line);
    if (!match) continue;
    const name = match[1];
    const label = match[2]?.trim();
    if (name && label) {
      if (ruleRows.has(name)) throw new Error(`README has duplicate rule row: ${name}`);
      ruleRows.set(name, label);
    }
  }

  const recommended = new Set(Object.keys(configs.recommended.rules));
  const strict = new Set(Object.keys(configs.strict.rules));
  const rsc = new Set(Object.keys(configs.rsc.rules));
  for (const rule of rules) {
    if (!fs.existsSync(path.join(root, ruleLink(rule)))) {
      throw new Error(`Missing rule documentation: ${ruleLink(rule)}`);
    }
    const label = ruleRows.get(rule);
    if (!label) throw new Error(`README does not list rule: ${rule}`);

    const expected = recommended.has(`react-router/${rule}`)
      ? "Recommended"
      : strict.has(`react-router/${rule}`)
        ? "Strict"
        : rsc.has(`react-router/${rule}`)
          ? "RSC opt-in"
          : "All only";
    const actual = label.split(",")[0]?.trim();
    if (actual !== expected) {
      throw new Error(`README config label for ${rule} must start with ${expected}`);
    }
  }
  for (const rule of ruleRows.keys()) {
    if (!rules.includes(rule)) throw new Error(`README lists unregistered rule: ${rule}`);
  }

  const contributing = read("CONTRIBUTING.md");
  if (!contributing.includes(`\`${nodeEngine}\``)) {
    throw new Error(`CONTRIBUTING.md does not match engines.node: ${nodeEngine}`);
  }
  if (!contributing.includes(`\`${eslintPeer}\``)) {
    throw new Error(
      `CONTRIBUTING.md does not match peerDependencies.eslint: ${eslintPeer}`,
    );
  }

  const compatibility = read("docs/compatibility.md").replaceAll("\\|", "|");
  if (!compatibility.includes(`engines.node: ${nodeEngine}`)) {
    throw new Error(`Compatibility docs do not match engines.node: ${nodeEngine}`);
  }
  if (!compatibility.includes(`peerDependencies.eslint: ${eslintPeer}`)) {
    throw new Error(
      `Compatibility docs do not match peerDependencies.eslint: ${eslintPeer}`,
    );
  }

  const ci = read(".github/workflows/ci.yml");
  const boundary = ci
    .split(/^\s{2}eslint-boundary:\s*$/mu)[1]
    ?.split(/^\s{2}[\w-]+:\s*$/mu)[0];
  if (!boundary?.includes("node: [22.x, 24.x]")) {
    throw new Error("CI ESLint boundary job must use the Node.js 22.x and 24.x tags");
  }
  if (!boundary.includes("eslint: [10.4.0, 10.14.0]")) {
    throw new Error("CI ESLint boundary job must test ESLint 10.4.0 and 10.14.0");
  }

  return `Verified ${rules.length} rule pages, README entries, presets, and support ranges.`;
}
