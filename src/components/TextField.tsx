import type { HTMLInputTypeAttribute, InputHTMLAttributes, ReactNode } from 'react';

export interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  hint?: string;
  required?: boolean;
  type?: HTMLInputTypeAttribute;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  /** Small non-interactive content shown inside the input, e.g. a card brand. */
  adornment?: ReactNode;
  spellCheck?: boolean;
  autoCapitalize?: string;
}

/**
 * Base text input. Handles the accessibility wiring once so every field built
 * on top of it inherits it: a real <label>, hint and error text linked with
 * aria-describedby, and aria-invalid when there is an error.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  adornment,
  spellCheck,
  autoCapitalize,
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');

  return (
    <div className="ck-field">
      <label className="ck-field__label" htmlFor={id}>
        {label}
        {required ? <span className="ck-sr-only"> (required)</span> : null}
      </label>
      <div className="ck-field__control">
        <input
          id={id}
          name={id}
          className="ck-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          spellCheck={spellCheck}
          autoCapitalize={autoCapitalize}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {adornment ? <span className="ck-field__adornment">{adornment}</span> : null}
      </div>
      {hint ? (
        <p id={hintId} className="ck-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="ck-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
