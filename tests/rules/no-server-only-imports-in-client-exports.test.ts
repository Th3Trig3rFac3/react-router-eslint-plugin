import rule from "../../src/rules/no-server-only-imports-in-client-exports.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-server-only-imports-in-client-exports", rule, {
  valid: [
    {
      filename: "app/routes/client.tsx",
      code: `import { value } from "./value"; export const clientLoader = () => value;`,
    },
    {
      filename: "app/routes/client.tsx",
      code: `
        import fs from "node:fs";
        const serverValue = fs.existsSync(".");
        export const loader = () => serverValue;
        export const clientLoader = () => "browser-safe";
      `,
    },
    {
      filename: "app/routes/client.tsx",
      code: `import type { Stats } from "node:fs"; export const clientLoader = (): Stats | undefined => undefined;`,
    },
    {
      filename: "app/routes/client.tsx",
      code: `import "my-server-package"; export default function Client() { return null; }`,
      options: [{ allow: ["my-server-package"] }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/client.tsx",
      code: `import fs from "node:fs"; export const clientLoader = () => fs.existsSync(".");`,
      errors: [{ messageId: "serverOnlyImport" }],
    },
    {
      filename: "app/routes/client.tsx",
      code: `
        import fs from "node:fs";
        const readServerState = () => fs.existsSync(".");
        export const clientLoader = () => readServerState();
      `,
      errors: [{ messageId: "serverOnlyImport" }],
    },
    {
      filename: "app/routes/client.tsx",
      code: `import "server-only"; export const clientLoader = () => null;`,
      errors: [{ messageId: "serverOnlyImport" }],
    },
    {
      filename: "app/routes/client.tsx",
      code: `import "my-server-package"; export const clientLoader = () => null;`,
      options: [{ serverOnlyPackages: ["my-server-package"] }],
      errors: [{ messageId: "serverOnlyImport" }],
    },
  ],
});
