import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { Alert, Button, CardNumberField, CvvField, ExpiryField, TextField, UpiIdField } from '.';

/** Small controlled wrapper so typing actually updates the field. */
function Controlled({
  Field,
  initial = '',
  ...props
}: {
  Field: typeof CardNumberField | typeof ExpiryField | typeof UpiIdField;
  initial?: string;
  error?: string | null;
  hint?: string;
}) {
  const [value, setValue] = useState(initial);
  return <Field id="field" value={value} onChange={setValue} {...props} />;
}

describe('TextField', () => {
  it('links label, hint and error to the input', () => {
    render(
      <TextField
        id="name"
        label="Full name"
        value=""
        onChange={() => {}}
        hint="As on your card"
        error="Required"
      />,
    );
    const input = screen.getByLabelText('Full name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('As on your card Required');
  });

  it('is not marked invalid without an error', () => {
    render(<TextField id="name" label="Full name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Full name')).not.toHaveAttribute('aria-invalid');
  });
});

describe('CardNumberField', () => {
  it('formats digits as the user types and shows the brand', async () => {
    const user = userEvent.setup();
    render(<Controlled Field={CardNumberField} />);
    const input = screen.getByLabelText(/card number/i);

    await user.type(input, '4242424242424242');
    expect(input).toHaveValue('4242 4242 4242 4242');
    expect(screen.getByText('Visa')).toBeInTheDocument();
  });

  it('ignores letters', async () => {
    const user = userEvent.setup();
    render(<Controlled Field={CardNumberField} />);
    const input = screen.getByLabelText(/card number/i);

    await user.type(input, '42ab42');
    expect(input).toHaveValue('4242');
  });
});

describe('ExpiryField', () => {
  it('inserts the slash while typing', async () => {
    const user = userEvent.setup();
    render(<Controlled Field={ExpiryField} />);
    const input = screen.getByLabelText(/expiry date/i);

    await user.type(input, '1228');
    expect(input).toHaveValue('12/28');
  });
});

describe('CvvField', () => {
  it('limits length by card brand', async () => {
    const user = userEvent.setup();
    const Wrapper = ({ brand }: { brand: 'visa' | 'amex' }) => {
      const [value, setValue] = useState('');
      return <CvvField id="cvv" value={value} onChange={setValue} brand={brand} />;
    };

    const { unmount } = render(<Wrapper brand="visa" />);
    await user.type(screen.getByLabelText(/security code/i), '123456');
    expect(screen.getByLabelText(/security code/i)).toHaveValue('123');
    unmount();

    render(<Wrapper brand="amex" />);
    await user.type(screen.getByLabelText(/security code/i), '123456');
    expect(screen.getByLabelText(/security code/i)).toHaveValue('1234');
  });
});

describe('UpiIdField', () => {
  it('strips whitespace', async () => {
    const user = userEvent.setup();
    render(<Controlled Field={UpiIdField} />);
    const input = screen.getByLabelText(/upi id/i);

    await user.type(input, 'na me@ok axis');
    expect(input).toHaveValue('name@okaxis');
  });
});

describe('Button', () => {
  it('blocks clicks and announces busy state while loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Pay
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Processing…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button', { name: 'Click' })).toHaveAttribute('type', 'button');
  });
});

describe('Alert', () => {
  it('uses role="alert" for errors and role="status" otherwise', () => {
    render(
      <>
        <Alert tone="error">Payment failed</Alert>
        <Alert tone="info">FYI</Alert>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
    expect(screen.getByRole('status')).toHaveTextContent('FYI');
  });
});

describe('accessibility (axe)', () => {
  it('has no violations for every field in its default and error states', async () => {
    const { container } = render(
      <div>
        <CardNumberField id="a" value="" onChange={() => {}} />
        <CardNumberField id="b" value="4242" onChange={() => {}} error="Enter a valid card number" />
        <ExpiryField id="c" value="" onChange={() => {}} hint="MM/YY" />
        <CvvField id="d" value="" onChange={() => {}} brand="amex" />
        <UpiIdField id="e" value="" onChange={() => {}} error="Enter a valid UPI ID" />
        <Button>Pay</Button>
        <Alert tone="error" title="Payment failed">
          Try another card.
        </Alert>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
