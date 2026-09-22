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
Computed targets and native `<form>` elements are skipped.
