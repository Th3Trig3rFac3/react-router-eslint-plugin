import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { configs, rules } from "../../src/index.js";
import { verifyRuleIndex } from "../../scripts/rule-index.js";

const aliases = { "valid-resource-route": "resource-route-returns-response" };
const timeout = 30_000;
const roots: string[] = [];

afterAll(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
}, 30_000);

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "rr-eslint-docs-"));
  roots.push(root);
  await mkdir(path.join(root, "docs", "rules"), { recursive: true });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });

  const canonicalRules = Object.keys(rules).filter((name) => !(name in aliases));
  const recommended = new Set(Object.keys(configs.recommended.rules));
  const strict = new Set(Object.keys(configs.strict.rules));
  const rsc = new Set(Object.keys(configs.rsc.rules));
  const rows = canonicalRules.map((name) => {
    const label = recommended.has(`react-router/${name}`)
      ? "Recommended"
      : strict.has(`react-router/${name}`)
        ? "Strict"
        : rsc.has(`react-router/${name}`)
          ? "RSC opt-in"
          : "All only";
    return `| \`${name}\` | Example rule | ${label} |`;
  });
  const packageJson = {
    engines: { node: "^22.23.2 || ^24.21.0" },
    peerDependencies: { eslint: "^10.4.0" },
  };
  const write = (filename: string, contents: string) =>
    writeFile(path.join(root, filename), contents, "utf8");

  await Promise.all(
    canonicalRules.map((name) => write(`docs/rules/${name}.md`, `# ${name}\n`)),
  );
  await write(
    "README.md",
    ["| Node.js | `^22.23.2 \\|\\| ^24.21.0` |", "| ESLint | `^10.4.0` |", ...rows].join(
      "\n",
    ),
  );
  await write("CONTRIBUTING.md", "Node.js `^22.23.2 || ^24.21.0` and ESLint `^10.4.0`.");
  await write(
    "docs/compatibility.md",
    "`engines.node: ^22.23.2 \\|\\| ^24.21.0` and `peerDependencies.eslint: ^10.4.0`.",
  );
  await write("package.json", JSON.stringify(packageJson));
  await write(
    ".github/workflows/ci.yml",
    "  eslint-boundary:\n    matrix:\n      node: [22.x, 24.x]\n      eslint: [10.4.0, 10.14.0]\n",
  );
  return root;
}

describe("rule documentation index", () => {
  let root: string;

  // Creating the documentation tree can be slow when CI workers compete for disk I/O.
  beforeEach(async () => {
    root = await fixture();
  }, timeout);

  it(
    "accepts a README and compatibility table derived from the plugin",
    () => {
      expect(verifyRuleIndex(root)).toContain("presets, and support ranges");
    },
    timeout,
  );

  it(
    "rejects missing rule documentation",
    async () => {
      await rm(path.join(root, "docs/rules/no-broad-action-origin.md"));
      expect(() => verifyRuleIndex(root)).toThrow("Missing rule documentation");
    },
    timeout,
  );

  it(
    "rejects stale README rule entries and preset labels",
    async () => {
      const readmePath = path.join(root, "README.md");
      const readme = await readFile(readmePath, "utf8");
      await writeFile(
        readmePath,
        readme.replace("| Recommended |", "| Strict |"),
        "utf8",
      );
      expect(() => verifyRuleIndex(root)).toThrow("README config label");
    },
    timeout,
  );

  it(
    "rejects README rows for rules absent from the exported registry",
    async () => {
      const readmePath = path.join(root, "README.md");
      const readme = await readFile(readmePath, "utf8");
      await writeFile(
        readmePath,
        `${readme}\n| \`stale-rule\` | Old rule | All only |`,
        "utf8",
      );
      expect(() => verifyRuleIndex(root)).toThrow("README lists unregistered rule");
    },
    timeout,
  );

  it(
    "rejects support ranges that drift from package metadata",
    async () => {
      const readmePath = path.join(root, "README.md");
      const readme = await readFile(readmePath, "utf8");
      await writeFile(readmePath, readme.replace("^10.4.0", "^10.0.0"), "utf8");
      expect(() => verifyRuleIndex(root)).toThrow("README ESLint support row");

      await writeFile(readmePath, readme.replace("^22.23.2", "^22.0.0"), "utf8");
      expect(() => verifyRuleIndex(root)).toThrow("README Node.js support row");
    },
    timeout,
  );
});
