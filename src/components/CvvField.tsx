import { cvvLength, digitsOnly, type CardBrand } from '../lib/validators';
import type { PaymentFieldProps } from './CardNumberField';
import { TextField } from './TextField';

export interface CvvFieldProps extends PaymentFieldProps {
  /** Amex uses 4 digits; everything else uses 3. */
  brand?: CardBrand;
}

export function CvvField({
  label = 'Security code (CVV)',
  value,
  onChange,
  brand = 'unknown',
  ...rest
}: CvvFieldProps) {
  const length = cvvLength(brand);

  return (
    <TextField
      {...rest}
      label={label}
      value={value}
      onChange={(next) => onChange(digitsOnly(next).slice(0, length))}
      required
      type="password"
      inputMode="numeric"
      autoComplete="cc-csc"
      placeholder={'•'.repeat(length)}
      maxLength={length}
    />
  );
}
