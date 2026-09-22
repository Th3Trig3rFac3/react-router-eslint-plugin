import rule from "../../src/rules/prefer-link-for-internal-navigation.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("prefer-link-for-internal-navigation", rule, {
  valid: [
    {
      filename: "app/routes/home.tsx",
      code: `export default function Home() { return <a href="https://example.com" />; }`,
    },
  ],
  invalid: [
    {
      filename: "app/routes/home.tsx",
      code: `export default function Home() { return <a href="/settings" />; }`,
      errors: [{ messageId: "internalAnchor" }],
    },
  ],
});
