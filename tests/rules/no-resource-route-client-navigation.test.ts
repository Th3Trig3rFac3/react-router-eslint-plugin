import rule from "../../src/rules/no-resource-route-client-navigation.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-resource-route-client-navigation", rule, {
  valid: [
    {
      filename: "app/routes/home.tsx",
      code: `export default function Home() { return <><Link to="/download" reloadDocument /><a href="/download" /></>; }`,
      options: [{ resourceRoutes: ["/download"] }],
    },
  ],
  invalid: [
    {
      filename: "app/routes/home.tsx",
      code: `export default function Home() { return <Link to="/download" />; }`,
      options: [{ resourceRoutes: ["/download"] }],
      errors: [{ messageId: "clientNavigation" }],
    },
    {
      filename: "app/routes/home.tsx",
      code: `export default function Home() { navigate("/download"); }`,
      options: [{ resourceRoutes: ["/download"] }],
      errors: [{ messageId: "clientNavigation" }],
    },
  ],
});
