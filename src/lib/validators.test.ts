import { describe, expect, it } from 'vitest';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  luhnCheck,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validateUpiId,
} from './validators';

describe('luhnCheck', () => {
  it('accepts well-known test card numbers', () => {
    expect(luhnCheck('4242424242424242')).toBe(true);
    expect(luhnCheck('5555555555554444')).toBe(true);
    expect(luhnCheck('378282246310005')).toBe(true);
  });

  it('rejects a number with one digit changed', () => {
    expect(luhnCheck('4242424242424241')).toBe(false);
  });

  it('ignores spaces and rejects empty input', () => {
    expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
    expect(luhnCheck('')).toBe(false);
  });
});

describe('detectCardBrand', () => {
  it.each([
    ['4242424242424242', 'visa'],
    ['5555555555554444', 'mastercard'],
    ['2221000000000009', 'mastercard'],
    ['378282246310005', 'amex'],
    ['6073849700004947', 'rupay'],
    ['9999', 'unknown'],
    ['', 'unknown'],
  ])('%s is %s', (number, brand) => {
    expect(detectCardBrand(number)).toBe(brand);
  });
});

describe('formatCardNumber', () => {
  it('groups most cards in fours', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('groups Amex as 4-6-5', () => {
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
  });

  it('strips non-digits and caps the length', () => {
    expect(formatCardNumber('4242-4242 abcd 4242 4242 4242 4242')).toBe('4242 4242 4242 4242 424');
    expect(formatCardNumber('3782822463100059999')).toBe('3782 822463 10005');
  });

  it('formats partial input without trailing spaces', () => {
    expect(formatCardNumber('4242')).toBe('4242');
    expect(formatCardNumber('42424')).toBe('4242 4');
  });
});

describe('validateCardNumber', () => {
  it('asks for a number when empty', () => {
    expect(validateCardNumber('')).toBe('Enter your card number');
  });

  it('accepts valid numbers', () => {
    expect(validateCardNumber('4242 4242 4242 4242')).toBeNull();
    expect(validateCardNumber('3782 822463 10005')).toBeNull();
  });

  it('rejects bad checksums and short numbers', () => {
    expect(validateCardNumber('4242 4242 4242 4241')).toBe('Enter a valid card number');
    expect(validateCardNumber('4242 4242')).toBe('Enter a valid card number');
  });

  it('requires exactly 15 digits for Amex', () => {
    expect(validateCardNumber('3782 822463 1000')).toBe('Enter a valid card number');
  });
});

describe('formatExpiry', () => {
  it('inserts the slash after the month', () => {
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('122')).toBe('12/2');
  });

  it('pads a first digit that cannot start a month', () => {
    expect(formatExpiry('3')).toBe('03');
    expect(formatExpiry('1')).toBe('1');
  });

  it('drops non-digits and extra characters', () => {
    expect(formatExpiry('12/28/99')).toBe('12/28');
  });
});

describe('validateExpiry', () => {
  const now = new Date(2026, 9, 23); // 23 Oct 2026

  it('accepts the current month and future dates', () => {
    expect(validateExpiry('10/26', now)).toBeNull();
    expect(validateExpiry('01/29', now)).toBeNull();
  });

  it('rejects past months and years', () => {
    expect(validateExpiry('09/26', now)).toBe('This card has expired');
    expect(validateExpiry('12/25', now)).toBe('This card has expired');
  });

  it('rejects impossible months and incomplete input', () => {
    expect(validateExpiry('13/28', now)).toBe('Enter a valid month (01-12)');
    expect(validateExpiry('00/28', now)).toBe('Enter a valid month (01-12)');
    expect(validateExpiry('12/2', now)).toBe('Enter expiry as MM/YY');
    expect(validateExpiry('', now)).toBe('Enter the expiry date');
  });

  it('rejects years too far in the future', () => {
    expect(validateExpiry('01/60', now)).toBe('Enter a valid expiry year');
  });
});

describe('validateCvv', () => {
  it('needs 3 digits normally and 4 for Amex', () => {
    expect(validateCvv('123', 'visa')).toBeNull();
    expect(validateCvv('1234', 'amex')).toBeNull();
    expect(validateCvv('123', 'amex')).toBe('Security code must be 4 digits');
    expect(validateCvv('12', 'visa')).toBe('Security code must be 3 digits');
    expect(validateCvv('')).toBe('Enter the security code');
  });
});

describe('validateUpiId', () => {
  it.each(['name@okaxis', 'first.last@ybl', 'user_123@paytm', '9876543210@upi'])(
    'accepts %s',
    (id) => expect(validateUpiId(id)).toBeNull(),
  );

  it.each(['', 'name', 'name@', '@bank', 'a@b', 'na me@bank', 'name@bank.com'])(
    'rejects "%s"',
    (id) => expect(validateUpiId(id)).not.toBeNull(),
  );

  it('ignores surrounding whitespace', () => {
    expect(validateUpiId('  name@okaxis  ')).toBeNull();
  });
});
