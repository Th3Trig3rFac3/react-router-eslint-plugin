# splittable-route-module

Warn about top-level `let` and `var` state in a route module with client
exports. Mutable module state can couple client exports and prevent the route
module from being split into independent chunks.

The rule mirrors the narrow, inspectable part of React Router's split-module
policy. It does not flag immutable helpers or invent a rule about all shared
bindings. Use `allow` for a reviewed module-level cache or singleton.
