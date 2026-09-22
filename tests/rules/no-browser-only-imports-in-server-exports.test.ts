import rule from "../../src/rules/no-browser-only-imports-in-server-exports.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-browser-only-imports-in-server-exports", rule, {
  valid: [
    {
      filename: "app/routes/server.ts",
      code: `import { value } from "./value"; export const loader = () => value;`,
    },
    {
      filename: "app/routes/server.ts",
      code: `
        import browserValue from "./value.client";
        export const loader = () => "server-safe";
        export const clientLoader = () => browserValue;
      `,
    },
    {
      filename: "app/routes/server.ts",
      code: `import type { BrowserValue } from "./value.client"; export const loader = (): BrowserValue | undefined => undefined;`,
    },
    {
      filename: "app/routes/server.ts",
      code: `import "my-browser-package"; export const loader = () => null;`,
      options: [{ allow: ["my-browser-package"] }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/server.ts",
      code: `import value from "./widget.client"; export const loader = () => value;`,
      errors: [{ messageId: "browserOnlyImport" }],
    },
    {
      filename: "app/routes/server.ts",
      code: `
        import browserValue from "./value.client";
        const readBrowserState = () => browserValue;
        export const loader = () => readBrowserState();
      `,
      errors: [{ messageId: "browserOnlyImport" }],
    },
    {
      filename: "app/routes/server.ts",
      code: `import "browser-only"; export const loader = () => null;`,
      errors: [{ messageId: "browserOnlyImport" }],
    },
    {
      filename: "app/routes/server.ts",
      code: `import "my-browser-package"; export const loader = () => null;`,
      options: [{ browserOnlyPackages: ["my-browser-package"] }],
      errors: [{ messageId: "browserOnlyImport" }],
    },
  ],
});
