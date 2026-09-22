# valid-route-module

Check that each statically resolved route-module path contains at least one
meaningful React Router route export. This is separate from
`valid-route-module-path`, which only checks that the file exists.

The rule reads source text without importing or executing it, follows local
route-config fragments, and skips missing, malformed, or dynamic modules. It
recognizes component, loader/action, middleware, boundary, and documented
metadata exports.
