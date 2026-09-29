/* global process */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const pnpmExecPath = process.env.npm_execpath;

if (!pnpmExecPath) {
  throw new Error("Could not find the pnpm executable from npm_execpath");
}

const attwPackagePath = path.dirname(
  require.resolve("@arethetypeswrong/cli/package.json"),
);
const attwCliPath = path.join(attwPackagePath, "dist", "index.js");
const temporaryDirectory = mkdtempSync(
  path.join(os.tmpdir(), "eslint-plugin-react-router-package-check-"),
);
const tarballPath = path.join(temporaryDirectory, "package.tgz");

const run = (command: string, args: string[]): boolean => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }
  return true;
};

try {
  const pnpmIsJavaScript = /\.(?:c|m)?js$/i.test(pnpmExecPath);
  const pnpmCommand = pnpmIsJavaScript ? process.execPath : pnpmExecPath;
  const pnpmArgs = pnpmIsJavaScript ? [pnpmExecPath] : [];

  if (run(pnpmCommand, [...pnpmArgs, "pack", "--out", tarballPath])) {
    run(process.execPath, [attwCliPath, tarballPath]);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
