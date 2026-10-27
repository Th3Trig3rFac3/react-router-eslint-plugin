# prefer-link-for-internal-navigation

Require a React Router `Link` instead of a plain anchor for literal internal
URLs in recognized route modules. Full document anchors remain appropriate for
downloads, external targets, `target`, or `reloadDocument` use cases.

```tsx
<Link to="/settings">Settings</Link>
```

The rule has no autofix because replacing an anchor may require adding an
import and can change accessibility or download behavior. Use `allow` for
intentional full-document links.

The rule checks root-relative URLs beginning with `/`, excluding `//` and
`/#`; it does not resolve those URLs against the route graph or infer resource
routes. Add resource paths to `allow` (which supports `*`) or use an explicit
download/document-navigation attribute. Relative and computed URLs are skipped.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/components/Link).
