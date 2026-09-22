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
