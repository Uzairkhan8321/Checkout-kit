/**
 * Pure validation and formatting helpers for payment inputs.
 * No React in here, so everything is trivially unit-testable.
 *
 * Each validate* function returns an error message, or null when valid.
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'unknown';

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  rupay: 'RuPay',
  unknown: '',
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Luhn checksum, the check-digit algorithm used by payment card numbers. */
export function luhnCheck(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 0) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Simplified brand detection from the issuer prefix. Good enough for UI hints
 * and CVV length; a real system would defer to the payment processor.
 */
export function detectCardBrand(value: string): CardBrand {
  const d = digitsOnly(value);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  if (/^(60|65|81|82|508)/.test(d)) return 'rupay';
  return 'unknown';
}

export function maxCardDigits(brand: CardBrand): number {
  return brand === 'amex' ? 15 : 19;
}

/** Groups digits for display: 4-6-5 for Amex, 4-4-4-4 otherwise. */
export function formatCardNumber(value: string): string {
  const brand = detectCardBrand(value);
  const digits = digitsOnly(value).slice(0, maxCardDigits(brand));

  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts: string[] = [];
  let start = 0;
  for (const size of groups) {
    if (start >= digits.length) break;
    parts.push(digits.slice(start, start + size));
    start += size;
  }
  return parts.join(' ');
}

export function validateCardNumber(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length === 0) return 'Enter your card number';

  const brand = detectCardBrand(digits);
  const lengthOk = brand === 'amex' ? digits.length === 15 : digits.length >= 13 && digits.length <= 19;
  if (!lengthOk || !luhnCheck(digits)) return 'Enter a valid card number';
  return null;
}

/** Formats as the user types: "1" -> "1", "3" -> "03", "1228" -> "12/28". */
export function formatExpiry(value: string): string {
  let digits = digitsOnly(value).slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** A card is valid through the end of its expiry month. */
export function validateExpiry(value: string, now: Date = new Date()): string | null {
  const digits = digitsOnly(value);
  if (digits.length === 0) return 'Enter the expiry date';
  if (digits.length !== 4) return 'Enter expiry as MM/YY';

  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return 'Enter a valid month (01-12)';

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  if (year < nowYear || (year === nowYear && month < nowMonth)) return 'This card has expired';
  if (year > nowYear + 20) return 'Enter a valid expiry year';
  return null;
}

export function cvvLength(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3;
}

export function validateCvv(value: string, brand: CardBrand = 'unknown'): string | null {
  const digits = digitsOnly(value);
  if (digits.length === 0) return 'Enter the security code';
  const expected = cvvLength(brand);
  if (digits.length !== expected) return `Security code must be ${expected} digits`;
  return null;
}

const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export function validateUpiId(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Enter your UPI ID';
  if (!UPI_PATTERN.test(trimmed)) return 'Enter a valid UPI ID, like name@bank';
  return null;
}
