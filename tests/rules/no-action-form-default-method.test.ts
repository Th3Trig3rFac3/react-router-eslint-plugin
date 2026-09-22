import rule from "../../src/rules/no-action-form-default-method.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-action-form-default-method", rule, {
  valid: [
    {
      filename: "app/routes/edit.tsx",
      code: `export const action = () => null; export default function Edit() { return <Form method="post" />; }`,
    },
    {
      filename: "app/routes/search.tsx",
      code: `export const action = () => null; export default function Search() { return <Form method="get" />; }`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/edit.tsx",
      code: `export const action = () => null; export default function Edit() { return <Form />; }`,
      errors: [{ messageId: "missingMethod" }],
    },
  ],
});
