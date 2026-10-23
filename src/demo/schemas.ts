import type { PageSchema } from '../renderer';

export const cardCheckout: PageSchema = {
  version: 1,
  root: {
    id: 'page',
    type: 'stack',
    gap: 'lg',
    children: [
      { id: 'title', type: 'heading', level: 1, text: 'Pay with card' },
      {
        id: 'order',
        type: 'summary',
        rows: [
          { label: 'Subtotal', value: '₹1,499.00' },
          { label: 'Delivery', value: '₹49.00' },
          { label: 'Total', value: '₹1,548.00', emphasis: true },
        ],
      },
      {
        id: 'card-form',
        type: 'stack',
        gap: 'md',
        children: [
          { id: 'cardNumber', type: 'cardNumber' },
          {
            id: 'expiry-cvv',
            type: 'stack',
            direction: 'row',
            children: [
              { id: 'expiry', type: 'expiry' },
              { id: 'cvv', type: 'cvv' },
            ],
          },
          {
            id: 'cardName',
            type: 'textField',
            label: 'Name on card',
            required: true,
            autoComplete: 'cc-name',
          },
        ],
      },
      {
        id: 'demo-note',
        type: 'alert',
        tone: 'info',
        text: 'Demo only. Do not enter real card details. Try 4242 4242 4242 4242.',
      },
      { id: 'pay', type: 'button', label: 'Pay ₹1,548.00', action: 'submit', fullWidth: true },
    ],
  },
};

export const upiCheckout: PageSchema = {
  version: 1,
  root: {
    id: 'page',
    type: 'stack',
    gap: 'lg',
    children: [
      { id: 'title', type: 'heading', level: 1, text: 'Pay with UPI' },
      {
        id: 'order',
        type: 'summary',
        rows: [
          { label: 'Plan: Annual', value: '₹999.00' },
          { label: 'Total', value: '₹999.00', emphasis: true },
        ],
      },
      {
        id: 'upiId',
        type: 'upiId',
        hint: 'You will get a collect request in your UPI app.',
      },
      {
        id: 'timeout-note',
        type: 'alert',
        tone: 'warning',
        text: 'Approve the request within 5 minutes or it will expire.',
      },
      {
        id: 'actions',
        type: 'stack',
        direction: 'row',
        gap: 'sm',
        children: [
          { id: 'pay', type: 'button', label: 'Send request', action: 'submit' },
          { id: 'clear', type: 'button', label: 'Clear', action: 'reset', variant: 'secondary' },
        ],
      },
    ],
  },
};

export const presets = [
  { name: 'Card checkout', schema: cardCheckout },
  { name: 'UPI checkout', schema: upiCheckout },
] as const;
