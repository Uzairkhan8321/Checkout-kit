import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

/** Errors interrupt screen readers (role="alert"); everything else is polite. */
export function Alert({ tone = 'info', title, children }: AlertProps) {
  return (
    <div className={`ck-alert ck-alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title ? <p className="ck-alert__title">{title}</p> : null}
      <p className="ck-alert__text">{children}</p>
    </div>
  );
}
