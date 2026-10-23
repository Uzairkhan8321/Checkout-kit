# checkout-kit

Accessible, validated payment form components for React, plus a small renderer that builds a whole checkout page from **JSON**.

> **Demo only.** This is a UI exercise. It does not talk to a payment processor, and no real card data should ever be entered. Real card capture belongs in a PCI-compliant hosted field or iframe from your payment provider.

**Live demo:** _add your deployed URL here_  
**Screenshot:** _add a screenshot or GIF here_

## Why this exists

Checkout pages repeat the same hard parts: input formatting, validation rules, error messaging, keyboard and screen-reader behaviour. Re-implementing them per page is how inconsistencies and accessibility bugs creep in.

This project explores one answer: build those parts **once** as a small set of tested components, then describe pages as data that a renderer turns into UI.

## What's in it

**Components** (`src/components`)

| Component | What it does |
| --- | --- |
| `TextField` | Base input: real label, hint and error wired with `aria-describedby`, `aria-invalid` |
| `CardNumberField` | Digit-only input, 4-4-4-4 grouping (4-6-5 for Amex), brand hint |
| `ExpiryField` | `MM/YY` auto-formatting |
| `CvvField` | Masked, length follows the card brand (4 digits for Amex, else 3) |
| `UpiIdField` | UPI ID entry, no autocapitalise or spellcheck |
| `Button` | Loading state that blocks double submits, `type="button"` by default |
| `Alert` | `role="alert"` for errors, `role="status"` otherwise |

**Validators** (`src/lib/validators.ts`): Luhn checksum, brand detection, expiry (valid through the end of the month), CVV, UPI ID. All pure functions with no React, so they are easy to test.

**Schema renderer** (`src/renderer`): takes JSON like this and renders a working, validated form.

```json
{
  "version": 1,
  "root": {
    "id": "page",
    "type": "stack",
    "children": [
      { "id": "title", "type": "heading", "level": 1, "text": "Pay with UPI" },
      { "id": "upiId", "type": "upiId" },
      { "id": "pay", "type": "button", "label": "Pay", "action": "submit" }
    ]
  }
}
```

- `validateSchema` checks untrusted JSON first and reports errors with paths, like `root.children[1].text must be a non-empty string`.
- A **registry** maps each node type to a renderer, so a team can override how any node renders without forking the renderer.
- Validation runs on blur and on submit. A failed submit focuses the first invalid field and announces how many need attention.
- Submitted values can be run through `maskSensitive` before logging or display: only the last four card digits survive, and the CVV is hidden.

## Run it

```bash
npm install
npm run dev        # demo app with a live schema editor
npm test           # unit, component, renderer and accessibility tests
npm run lint
npm run typecheck
npm run build
```

The demo shows a rendered page next to its JSON. Edit the JSON and the page updates live. Try breaking it to see the validation messages.

## Design decisions

- **Controlled components, logic outside.** Fields take `value` and `onChange`; formatting and validation live in pure functions. That keeps components thin and the rules testable without rendering anything.
- **Accessibility lives in the base component.** `TextField` does the label, description and invalid wiring once, and every field inherits it. Tests run axe-core over each component and over the rendered page, including the error state.
- **Design tokens.** Components read CSS variables (`src/styles/tokens.css`), with a dark theme through `prefers-color-scheme`. Theming means overriding variables, not editing component CSS.
- **Schema versioning.** Every schema has `"version": 1` so the format can evolve without silently breaking stored pages.
- **Brand-aware CVV.** The renderer finds the page's card number field and passes the detected brand to the CVV field, so the two stay consistent.

## Testing

- Validators: known-good and known-bad card numbers, expiry edge cases (current month, past, impossible month), UPI formats.
- Components: formatting while typing, ARIA wiring, loading and busy behaviour, roles.
- Renderer: rendering from data, validation and focus management, brand-dependent CVV, async submit with a busy state, reset, registry overrides.
- Accessibility: axe-core over components and pages. Colour contrast is disabled in these tests because jsdom has no layout engine, so contrast is handled by the tokens and should be checked in a real browser (for example Lighthouse).

## Known limitations and roadmap

- Brand detection is prefix-based and simplified. A real system would defer to the payment processor.
- No i18n yet. Messages are English-only strings in `validators.ts`.
- No Storybook yet. The components would benefit from documented stories.
- The registry covers the built-in node types only; custom node types would need a type extension.
- Not yet checked with a real screen reader or in a real browser's Lighthouse.
