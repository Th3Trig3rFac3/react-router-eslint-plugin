import rule from "../../src/rules/no-route-manifest-collision.js";
import { ruleTester } from "../rule-tester.js";

ruleTester.run("no-route-manifest-collision", rule, {
  valid: [
    {
      filename: "react-router.config.ts",
      code: `export default { routeDiscovery: { manifestPath: "/__manifest" } };`,
      options: [{ routePaths: ["/home"] }],
    },
    {
      filename: "react-router.config.ts",
      code: `export default { routeDiscovery: { mode: "initial", manifestPath: "/home" } };`,
      options: [{ routePaths: ["/home"] }],
    },
    {
      filename: "react-router.config.ts",
      code: `const routeDiscovery = { mode: "lazy", manifestPath: "/home" }; export default { routeDiscovery };`,
      options: [{ routePaths: ["/home"], allow: ["/home"] }],
    },
    {
      filename: "react-router.config.ts",
      code: `const unrelated = { manifestPath: "/home" }; export default { routeDiscovery: { manifestPath: "/safe" } };`,
      options: [{ routePaths: ["/home"] }],
    },
    {
      filename: "react-router.config.ts",
      code: `const defaults = { mode: "lazy" }; export default { routeDiscovery: { ...defaults, manifestPath: "/home" } };`,
      options: [{ routePaths: ["/home"] }],
    },
  ],
  invalid: [
    {
      filename: "react-router.config.ts",
      code: `export default { routeDiscovery: { manifestPath: "/home" } };`,
      options: [{ routePaths: ["/home"] }],
      errors: [{ messageId: "manifestCollision" }],
    },
    {
      filename: "react-router.config.ts",
      code: `export default { routeDiscovery: { mode: "lazy", manifestPath: "/download" } };`,
      options: [{ resourcePaths: ["/download"] }],
      errors: [{ messageId: "manifestCollision" }],
    },
  ],
});
