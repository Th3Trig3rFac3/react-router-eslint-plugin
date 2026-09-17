import rule from "../../src/rules/no-action-only-routes.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-action-only-routes", rule, {
  valid: [
    {
      filename: "app/routes/edit.tsx",
      code: `
        export async function loader() { return redirect("/items"); }
        export async function action() { return new Response("ok"); }
      `,
    },
    {
      filename: "app/routes/webhook.ts",
      code: `export async function action() { return new Response("ok"); }`,
      options: [{ allowFiles: ["app/routes/webhook.ts"] }],
    },
    {
      filename: "src/services/actions.ts",
      code: `export async function action() { return new Response("ok"); }`,
    },
    {
      filename: "app/routes/view.tsx",
      code: `
        export async function action() { return new Response("ok"); }
        export default function View() { return <h1>View</h1>; }
      `,
    },
    {
      filename: "app/routes/client.tsx",
      code: `
        export const clientAction = async () => new Response("ok");
        export const clientLoader = async () => ({ ok: true });
      `,
    },
    {
      filename: "app/routes/types.tsx",
      code: `
        interface ActionData { ok: boolean }
        export type { ActionData as action };
      `,
    },
  ],
  invalid: [
    {
      filename: "app/routes/edit.tsx",
      code: `export async function action() { return new Response("ok"); }`,
      errors: [{ messageId: "actionOnlyRoute", data: { actionName: "action" } }],
    },
    {
      filename: "app/routes/client.tsx",
      code: `export const clientAction = async () => new Response("ok");`,
      errors: [{ messageId: "actionOnlyRoute", data: { actionName: "clientAction" } }],
    },
    {
      filename: "app/routes/alias.tsx",
      code: `
        async function submit() { return new Response("ok"); }
        export { submit as action };
      `,
      errors: [{ messageId: "actionOnlyRoute" }],
    },
  ],
});
