import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { cardCheckout, upiCheckout } from '../demo/schemas';
import { expectNoA11yViolations } from '../test/a11y';
import { PageRenderer } from './PageRenderer';
import { collectFields, maskSensitive } from './fields';

async function fillValidCard(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
  await user.type(screen.getByLabelText(/expiry date/i), '1230');
  await user.type(screen.getByLabelText(/security code/i), '123');
  await user.type(screen.getByLabelText(/name on card/i), 'Asha Rao');
}

describe('PageRenderer: rendering', () => {
  it('renders the page described by the schema', () => {
    render(<PageRenderer schema={cardCheckout} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Pay with card' })).toBeInTheDocument();
    expect(screen.getByText('₹1,548.00', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay/i })).toHaveAttribute('type', 'submit');
  });

  it('renders a different page from different data', () => {
    render(<PageRenderer schema={upiCheckout} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Pay with UPI' })).toBeInTheDocument();
    expect(screen.getByLabelText(/upi id/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
  });

  it('lets callers override how a node type renders', () => {
    render(
      <PageRenderer
        schema={upiCheckout}
        registry={{ heading: (node) => <h1 data-testid="custom">{node.text.toUpperCase()}</h1> }}
      />,
    );
    expect(screen.getByTestId('custom')).toHaveTextContent('PAY WITH UPI');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PageRenderer schema={cardCheckout} />);
    await expectNoA11yViolations(container);
  });
});

describe('PageRenderer: validation', () => {
  it('blocks submit, shows every error and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PageRenderer schema={cardCheckout} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /pay/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your card number')).toBeInTheDocument();
    expect(screen.getByText('Enter the expiry date')).toBeInTheDocument();
    expect(screen.getByText('Enter the security code')).toBeInTheDocument();
    expect(screen.getByText('Name on card is required')).toBeInTheDocument();
    expect(screen.getByLabelText(/card number/i)).toHaveFocus();
   expect(screen.getByText('4 fields need attention')).toBeInTheDocument();
  });

  it('validates a field when it loses focus', async () => {
    const user = userEvent.setup();
    render(<PageRenderer schema={upiCheckout} />);

    await user.type(screen.getByLabelText(/upi id/i), 'nobank');
    await user.tab();
    expect(screen.getByText('Enter a valid UPI ID, like name@bank')).toBeInTheDocument();
  });

  it('clears an error as soon as the user fixes the value', async () => {
    const user = userEvent.setup();
    render(<PageRenderer schema={upiCheckout} />);

    const input = screen.getByLabelText(/upi id/i);
    await user.type(input, 'nobank');
    await user.tab();
    expect(screen.getByText('Enter a valid UPI ID, like name@bank')).toBeInTheDocument();

    await user.type(input, '@okaxis');
    expect(screen.queryByText('Enter a valid UPI ID, like name@bank')).not.toBeInTheDocument();
  });

  it('rejects an expired card', async () => {
    const user = userEvent.setup();
    render(<PageRenderer schema={cardCheckout} />);

    await user.type(screen.getByLabelText(/expiry date/i), '0120');
    await user.tab();
    expect(screen.getByText('This card has expired')).toBeInTheDocument();
  });

  it('has no accessibility violations while showing errors', async () => {
    const user = userEvent.setup();
    const { container } = render(<PageRenderer schema={cardCheckout} />);
    await user.click(screen.getByRole('button', { name: /pay/i }));
    await expectNoA11yViolations(container);
  });
});

describe('PageRenderer: card brand and CVV', () => {
  it('requires a 4-digit security code once an Amex number is entered', async () => {
    const user = userEvent.setup();
    render(<PageRenderer schema={cardCheckout} />);

    await user.type(screen.getByLabelText(/card number/i), '378282246310005');
    const cvv = screen.getByLabelText(/security code/i);

    await user.type(cvv, '1234567');
    expect(cvv).toHaveValue('1234');
  });

  it('keeps the security code to 3 digits for Visa', async () => {
    const user = userEvent.setup();
    render(<PageRenderer schema={cardCheckout} />);

    await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
    const cvv = screen.getByLabelText(/security code/i);

    await user.type(cvv, '123456');
    expect(cvv).toHaveValue('123');
  });
});

describe('PageRenderer: submit', () => {
  it('calls onSubmit with the field values when everything is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PageRenderer schema={cardCheckout} onSubmit={onSubmit} />);

    await fillValidCard(user);
    await user.click(screen.getByRole('button', { name: /pay/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/30',
      cvv: '123',
      cardName: 'Asha Rao',
    });
  });

  it('shows a busy state and ignores a second click while submitting', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<PageRenderer schema={cardCheckout} onSubmit={onSubmit} />);

    await fillValidCard(user);
    await user.click(screen.getByRole('button', { name: /pay/i }));

    const busy = await screen.findByRole('button', { name: 'Processing…' });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(await screen.findByRole('button', { name: /pay/i })).toBeEnabled();
  });

  it('clears values and errors on reset', async () => {
    const user = userEvent.setup();
    render(<PageRenderer schema={upiCheckout} />);

    await user.type(screen.getByLabelText(/upi id/i), 'nobank');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText(/upi id/i)).toHaveValue('');
    expect(screen.queryByText(/valid UPI ID/)).not.toBeInTheDocument();
  });
});

describe('maskSensitive', () => {
  it('keeps only the last four card digits and hides the CVV', () => {
    const fields = collectFields(cardCheckout.root);
    const masked = maskSensitive(fields, {
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/30',
      cvv: '123',
      cardName: 'Asha Rao',
    });
    expect(masked).toEqual({
      cardNumber: '•••• 4242',
      expiry: '12/30',
      cvv: '•••',
      cardName: 'Asha Rao',
    });
  });
});
