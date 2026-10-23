import { formatExpiry } from '../lib/validators';
import type { PaymentFieldProps } from './CardNumberField';
import { TextField } from './TextField';

export function ExpiryField({ label = 'Expiry date', value, onChange, ...rest }: PaymentFieldProps) {
  return (
    <TextField
      {...rest}
      label={label}
      value={value}
      onChange={(next) => onChange(formatExpiry(next))}
      required
      inputMode="numeric"
      autoComplete="cc-exp"
      placeholder="MM/YY"
      maxLength={5}
    />
  );
}
