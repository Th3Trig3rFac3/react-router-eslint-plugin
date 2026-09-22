# MVP rule RFCs

These RFCs record the decisions behind the four MVP rules. They are short,
versioned design records rather than copies of the rule reference pages. The
current decision set targets React Router framework mode on the current 8.4.x
line and the maintained 7.18.x line. Revisit the official export and route
helper evidence before changing either line or promoting a rule into
`recommended`.

| RFC                                         | Rule                          | Decision                                                                            |
| ------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| [001](./001-no-action-only-routes.md)       | `no-action-only-routes`       | Keep as a conservative `recommended` warning with explicit resource-route opt-outs. |
| [002](./002-require-root-error-boundary.md) | `require-root-error-boundary` | Keep as a `recommended` error for the configured root module.                       |
| [003](./003-valid-route-module-path.md)     | `valid-route-module-path`     | Keep as a `recommended` error for statically analyzable helper calls.               |
| [004](./004-no-invalid-route-exports.md)    | `no-invalid-route-exports`    | Keep in `strict`; use a versioned allowlist and an integration escape hatch.        |

The application and documentation evidence for these decisions is recorded in
[`docs/validation/mvp-semantics.md`](../validation/mvp-semantics.md). The
compatibility baseline used by every RFC is in
[`docs/compatibility.md`](../compatibility.md).
