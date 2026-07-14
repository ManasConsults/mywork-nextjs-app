import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ForgotPasswordForm } from './ForgotPasswordForm';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRequestPasswordReset = jest.fn();

jest.mock('@/lib/actions/auth', () => ({
  requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  render(<ForgotPasswordForm />);
  return {
    user,
    emailInput: () => screen.getByLabelText(/email address/i),
    submitButton: () => screen.getByRole('button', { name: /send reset link/i }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ForgotPasswordForm rendering', () => {
  it('renders the email field and submit button', () => {
    const { emailInput, submitButton } = setup();
    expect(emailInput()).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it('renders a link back to the login page', () => {
    setup();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('ForgotPasswordForm validation', () => {
  it('shows a required error when submitted empty', async () => {
    const helpers = setup();
    await helpers.user.click(helpers.submitButton());
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows an invalid email error for a malformed address', async () => {
    const helpers = setup();
    await helpers.user.type(helpers.emailInput(), 'not-an-email');
    await helpers.user.click(helpers.submitButton());
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('clears the field error when the user starts typing', async () => {
    const helpers = setup();
    await helpers.user.click(helpers.submitButton());
    await screen.findByText(/email is required/i);
    await helpers.user.type(helpers.emailInput(), 'a');
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });
});

// ─── Successful submission ─────────────────────────────────────────────────────

describe('ForgotPasswordForm successful submission', () => {
  it('calls requestPasswordReset with the entered email', async () => {
    mockRequestPasswordReset.mockResolvedValue({ success: true });
    const helpers = setup();
    await helpers.user.type(helpers.emailInput(), 'jane@example.com');
    await helpers.user.click(helpers.submitButton());

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({ email: 'jane@example.com' });
    });
  });

  it('shows the "check your email" confirmation regardless of whether the account exists', async () => {
    mockRequestPasswordReset.mockResolvedValue({ success: true });
    const helpers = setup();
    await helpers.user.type(helpers.emailInput(), 'jane@example.com');
    await helpers.user.click(helpers.submitButton());

    expect(await screen.findByRole('status')).toHaveTextContent(/check your email/i);
  });
});

// ─── Failed submission ──────────────────────────────────────────────────────────

describe('ForgotPasswordForm failed submission', () => {
  it('shows a root error when validation fails server-side', async () => {
    mockRequestPasswordReset.mockResolvedValue({
      success: false,
      error: { message: 'Validation failed', fields: { email: ['Enter a valid email address'] } },
    });
    const helpers = setup();
    await helpers.user.type(helpers.emailInput(), 'jane@example.com');
    await helpers.user.click(helpers.submitButton());

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });
});
