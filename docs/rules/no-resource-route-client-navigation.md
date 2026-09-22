# no-resource-route-client-navigation

Require document navigation when `Link`, `NavLink`, or `navigate()` targets a
known resource route. Client navigation treats the target as route data instead
of requesting the resource as a document.

```js
"react-router/no-resource-route-client-navigation": [
  "warn",
  { resourceRoutes: ["/download"] },
]
```

`<Link reloadDocument>` and ordinary anchors are valid. Only literal targets
and explicitly configured resource patterns are checked; dynamic URLs are
skipped. `allow` covers resource endpoints intentionally consumed as data.
