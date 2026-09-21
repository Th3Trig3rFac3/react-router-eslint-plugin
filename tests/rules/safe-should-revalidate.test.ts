import rule from "../../src/rules/safe-should-revalidate.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("safe-should-revalidate", rule, {
  valid: [
    {
      filename: "app/routes/items.tsx",
      code: `
        export function shouldRevalidate({ defaultShouldRevalidate }) {
          return defaultShouldRevalidate;
        }
      `,
    },
    {
      filename: "app/routes/items.tsx",
      code: `export const shouldRevalidate = () => true;`,
    },
    {
      filename: "app/routes/items.tsx",
      code: `
        export function shouldRevalidate({ defaultShouldRevalidate }) {
          if (force) return false;
          return defaultShouldRevalidate;
        }
      `,
    },
    {
      filename: "app/routes/items.tsx",
      code: `
        export function shouldRevalidate() { return false; }
      `,
      options: [{ allowFiles: ["app/routes/items.tsx"] }],
    },
    {
      filename: "src/shared/policy.ts",
      code: `export const shouldRevalidate = () => false;`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/items.tsx",
      code: `export function shouldRevalidate() { return false; }`,
      errors: [{ messageId: "alwaysFalse" }],
    },
    {
      filename: "app/routes/items.tsx",
      code: `const decide = () => false; export { decide as shouldRevalidate };`,
      errors: [{ messageId: "alwaysFalse" }],
    },
    {
      filename: "app/routes/items.tsx",
      code: `export const shouldRevalidate = () => false as const;`,
      errors: [{ messageId: "alwaysFalse" }],
    },
  ],
});
