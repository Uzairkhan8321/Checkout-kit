import { BRAND_LABELS, detectCardBrand, formatCardNumber } from '../lib/validators';
import { TextField } from './TextField';

export interface PaymentFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  hint?: string;
}

export function CardNumberField({
  label = 'Card number',
  value,
  onChange,
  ...rest
}: PaymentFieldProps) {
  const brandLabel = BRAND_LABELS[detectCardBrand(value)];

  return (
    <TextField
      {...rest}
      label={label}
      value={value}
      onChange={(next) => onChange(formatCardNumber(next))}
      required
      inputMode="numeric"
      autoComplete="cc-number"
      placeholder="1234 5678 9012 3456"
      maxLength={23}
      adornment={brandLabel || undefined}
    />
  );
}
