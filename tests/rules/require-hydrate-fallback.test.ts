import rule from "../../src/rules/require-hydrate-fallback.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("require-hydrate-fallback", rule, {
  valid: [
    {
      filename: "app/routes/product.tsx",
      code: `
        export async function clientLoader() { return getData(); }
        clientLoader.hydrate = true as const;
        export function HydrateFallback() { return <p>Loading</p>; }
      `,
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        async function load() { return getData(); }
        load["hydrate"] = true as const;
        export { load as clientLoader };
        export { Fallback as HydrateFallback };
        function Fallback() { return <p>Loading</p>; }
      `,
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        export async function clientLoader() { return getData(); }
        clientLoader.hydrate = false;
      `,
    },
    {
      filename: "app/routes/webhook.ts",
      code: `
        export async function clientLoader() { return getData(); }
        clientLoader.hydrate = true;
      `,
      options: [{ allowFiles: ["app/routes/webhook.ts"] }],
    },
    {
      filename: "src/shared/client.ts",
      code: `
        export async function clientLoader() { return getData(); }
        clientLoader.hydrate = true;
      `,
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        const clientLoader = makeLoader();
        clientLoader.hydrate = true;
      `,
    },
  ],
  invalid: [
    {
      filename: "app/routes/product.tsx",
      code: `
        export async function clientLoader() { return getData(); }
        clientLoader.hydrate = true as const;
      `,
      errors: [{ messageId: "missingHydrateFallback" }],
    },
    {
      filename: "app/routes/product.tsx",
      code: `
        async function load() { return getData(); }
        load.hydrate = true;
        export { load as clientLoader };
      `,
      errors: [{ messageId: "missingHydrateFallback" }],
    },
  ],
});
