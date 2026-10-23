# Design notes

## Data flow

```
JSON schema ──► validateSchema ──► PageSchema
                                       │
                                       ▼
                               PageRenderer
                      ┌────────────────┼────────────────┐
                      ▼                ▼                ▼
                 values/errors      registry        collectFields
                   (state)       (type → render)   (field list)
                      │                │
                      └──── RenderContext ────► components ──► validators
```

1. `validateSchema` rejects malformed JSON before it can reach React.
2. `PageRenderer` collects the form fields, owns `values` and `errors`, and builds a `RenderContext`.
3. For each node it looks up a renderer in the registry and calls it with the node, the context and a `renderChild` function (that is how `stack` recurses).
4. Field renderers pass `value`, `error`, `onChange` and `onBlur` from the context into the components.
5. Components format input as the user types; validators decide what counts as valid.

## Validation timing

- **On blur:** the field validates, so people are told about a problem when they leave it.
- **While typing:** only once the field already shows an error, so it clears as soon as it is fixed. Nobody is told they are wrong halfway through typing.
- **On submit:** every field validates, the first invalid one is focused, and a live region announces the count.

## Things worth being able to explain

- Why validators are pure functions and the components stay thin.
- Why `Button` defaults to `type="button"` (a stray button in a form would submit it).
- Why submit ignores a second click while one is in flight (double charges).
- Why CVV length depends on the card brand, and where that coupling lives (the renderer, not the field).
- Why contrast is not asserted in jsdom tests and how it is covered instead.
- What `maskSensitive` protects against, and what it does not (it is not a substitute for PCI-compliant capture).
