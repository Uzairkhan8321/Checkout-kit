import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  /** Shows a busy state and blocks repeat clicks (important for payments). */
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'ck-button',
    `ck-button--${variant}`,
    fullWidth ? 'ck-button--full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? 'Processing…' : children}
    </button>
  );
}
