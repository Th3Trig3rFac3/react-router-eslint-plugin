import rule from "../../src/rules/resource-route-returns-response.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("resource-route-returns-response", rule, {
  valid: [
    {
      filename: "app/routes/api/image.ts",
      code: `export function loader() { return new Response("image"); }`,
    },
    {
      filename: "app/routes/api/redirect.ts",
      code: `export function loader() { return redirect("/login"); }`,
    },
    {
      filename: "app/routes/api/data.ts",
      code: `export function loader() { return data({ ok: true }); }`,
      options: [{ allowData: true }],
    },
    {
      filename: "app/routes/api/throw.ts",
      code: `export function action() { throw new Response("no", { status: 401 }); }`,
    },
    {
      filename: "app/routes/ui.tsx",
      code: `
        export function loader() { return { ok: true }; }
        export default function UI() { return null; }
      `,
    },
  ],
  invalid: [
    {
      filename: "app/routes/api/object.ts",
      code: `export function loader() { return { ok: true }; }`,
      errors: [{ messageId: "missingResponse", data: { handler: "loader" } }],
    },
    {
      filename: "app/routes/api/implicit.ts",
      code: `export async function action() { await save(); }`,
      errors: [{ messageId: "missingResponse", data: { handler: "action" } }],
    },
    {
      filename: "app/routes/api/branch.ts",
      code: `
        export function loader() {
          if (ok) return new Response("ok");
          return { error: true };
        }
      `,
      errors: [{ messageId: "missingResponse", data: { handler: "loader" } }],
    },
  ],
});
