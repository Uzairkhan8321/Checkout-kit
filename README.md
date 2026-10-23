# checkout-kit

Payment form components for React, plus a small renderer that builds a checkout page from JSON.

Demo only. It doesn't talk to a payment processor, and no real card numbers should be entered.

**Live demo:** [add your link after deploying]

## Why I built this

[2 or 3 sentences in your own words. Why a checkout form? What did you want to learn? For example: you wanted to practise accessible forms, or reusable components for a payments page.]

## What's inside

**Components** (`src/components`): `TextField`, `CardNumberField`, `ExpiryField`, `CvvField`, `UpiIdField`, `Button`, `Alert`. Every field is built on `TextField`, which handles the label, hint and error wiring once for accessibility.

**Validators** (`src/lib/validators.ts`): Luhn check, card brand detection, expiry, CVV and UPI ID. They are plain functions with no React, so they are easy to test.

**Renderer** (`src/renderer`): give it JSON and it renders a working form.

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

- `validateSchema` checks the JSON before rendering and reports errors with a path, like `root.children[1].text must be a non-empty string`.
- A registry maps each node type to a renderer, so you can override how a node renders without changing the renderer.
- Fields validate on blur and on submit. A failed submit focuses the first bad field and announces how many need attention.

## Run it

Needs Node.js 20 or newer.

```bash
npm install
npm run dev      # demo with a live JSON editor
npm test
npm run lint
npm run build
```

## Tests

72 tests using Vitest, Testing Library and axe-core. They cover the validators, the schema checks, each component, and the full page (submit, errors, focus, double-click protection). axe-core checks accessibility, including the error state. Colour contrast isn't tested because jsdom can't compute it, so I still need to check that in a real browser.

CI runs lint, typecheck, tests and build on every push.

## Limits

- Card brand detection only looks at the number prefix. A real system would ask the payment processor.
- Messages are English only.
- No end-to-end browser tests yet.
- [Add one thing you'd improve next, in your own words.]