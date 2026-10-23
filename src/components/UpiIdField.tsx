import type { PaymentFieldProps } from './CardNumberField';
import { TextField } from './TextField';

export function UpiIdField({ label = 'UPI ID', value, onChange, ...rest }: PaymentFieldProps) {
  return (
    <TextField
      {...rest}
      label={label}
      value={value}
      onChange={(next) => onChange(next.replace(/\s/g, ''))}
      required
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      placeholder="name@bank"
    />
  );
}
