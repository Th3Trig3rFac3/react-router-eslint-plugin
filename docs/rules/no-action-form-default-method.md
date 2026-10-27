# no-action-form-default-method

Warn when a statically known action route is targeted by `<Form>` without a
`method`. Browser forms default to `GET`, which commonly misses the intended
action submission. `method="get"` remains valid for search and filter forms.

```tsx
export const action = async () => save();
export default function Edit() {
  return <Form method="post" />;
}
```

The current route is known from its `action` export. Other targets can be
listed with `actionPaths`; use `allowGetActions` for intentional GET actions.
`components` replaces the checked JSX names (default `["Form"]`). The check
uses names rather than import identity and does not infer remote action paths
from the route graph. Any explicit `method` attribute is accepted.

Native `<form>` elements are skipped by default. A computed `action` has no
known target; in a module exporting `action`, it is currently treated like the
current-route case and can still report. `allowGetActions: true` disables the
check; an array exempts exact action attribute values.

## Configuration and references

Presets: `strict` (`warn`), `all` (`warn`). See the
[preset activation and shared settings reference](../README.md) for required
options and analysis limits. No autofix or editor suggestion is provided.

Framework reference: [React Router documentation](https://reactrouter.com/api/components/Form).
