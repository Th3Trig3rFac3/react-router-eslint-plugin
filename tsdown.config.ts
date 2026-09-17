import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: "dist",
  platform: "node",
  fixedExtension: false,
  outputOptions: { exports: "named" },
  treeshake: true,
});
