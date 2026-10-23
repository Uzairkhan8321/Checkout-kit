import {
  detectCardBrand,
  digitsOnly,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validateUpiId,
  type CardBrand,
} from '../lib/validators';
import { isFieldNode, type FieldNode, type FormValues, type PageNode } from './types';

/** Depth-first list of every input field in the tree, in document order. */
export function collectFields(node: PageNode): FieldNode[] {
  if (isFieldNode(node)) return [node];
  if (node.type === 'stack') return node.children.flatMap(collectFields);
  return [];
}

export function fieldLabel(node: FieldNode): string {
  if (node.label) return node.label;
  switch (node.type) {
    case 'cardNumber':
      return 'Card number';
    case 'expiry':
      return 'Expiry date';
    case 'cvv':
      return 'Security code';
    case 'upiId':
      return 'UPI ID';
    default:
      return node.id;
  }
}

/** Returns an error message for the field's current value, or null if valid. */
export function validateFieldNode(
  node: FieldNode,
  value: string,
  brand: CardBrand = 'unknown',
): string | null {
  switch (node.type) {
    case 'cardNumber':
      return validateCardNumber(value);
    case 'expiry':
      return validateExpiry(value);
    case 'cvv':
      return validateCvv(value, brand);
    case 'upiId':
      return validateUpiId(value);
    case 'textField':
      return node.required && value.trim() === '' ? `${node.label} is required` : null;
  }
}

/** The CVV length depends on the card, so find the page's card number field. */
export function pageBrand(fields: FieldNode[], values: FormValues): CardBrand {
  const card = fields.find((f) => f.type === 'cardNumber');
  return card ? detectCardBrand(values[card.id] ?? '') : 'unknown';
}

/**
 * Masks sensitive values before they are logged or displayed. Only the last
 * four card digits survive; the CVV is fully hidden.
 */
export function maskSensitive(fields: FieldNode[], values: FormValues): FormValues {
  const masked: FormValues = { ...values };
  for (const field of fields) {
    const value = values[field.id] ?? '';
    if (field.type === 'cardNumber') {
      masked[field.id] = value ? `•••• ${digitsOnly(value).slice(-4)}` : '';
    } else if (field.type === 'cvv') {
      masked[field.id] = value ? '•'.repeat(value.length) : '';
    }
  }
  return masked;
}
