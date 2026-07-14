import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResetPasswordForm } from './ResetPasswordForm';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockResetPassword = jest.fn();
let mockSearchParams = new URLSearchParams({ token: 'valid-token' });

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/lib/actions/auth', () => ({
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID = { password: 'Password1', confirmPassword: 'Password1' };

function setup() {
  const user = userEvent.setup();
  render(<ResetPasswordForm />);
  return {
    user,
    passwordInput: () => screen.getByLabelText(/^new password/i),
    confirmInput: () => screen.getByLabelText(/confirm new password/i),
    submitButton: () => screen.getByRole('button', { name: /reset password/i }),
  };
}

async function fillAndSubmit(
  helpers: ReturnType<typeof setup>,
  overrides: Partial<typeof VALID> = {},
) {
  const values = { ...VALID, ...overrides };
  const { user, passwordInput, confirmInput, submitButton } = helpers;
  if (values.password) await user.type(passwordInput(), values.password);
  if (values.confirmPassword) await user.type(confirmInput(), values.confirmPassword);
  await user.click(submitButton());
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams({ token: 'valid-token' });
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ResetPasswordForm rendering', () => {
  it('renders both password fields and the submit button', () => {
    const { passwordInput, confirmInput, submitButton } = setup();
    expect(passwordInput()).toBeInTheDocument();
    expect(confirmInput()).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it('shows an invalid link message when the token is missing', () => {
    mockSearchParams = new URLSearchParams();
    setup();
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid reset link/i);
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('ResetPasswordForm validation', () => {
  it('shows password too short error', async () => {
    const helpers = setup();
    await fillAndSubmit(helpers, { password: 'Ab1', confirmPassword: 'Ab1' });
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows uppercase error when password has no uppercase letter', async () => {
    const helpers = setup();
    await fillAndSubmit(helpers, { password: 'password1', confirmPassword: 'password1' });
    expect(await screen.findByText(/uppercase letter/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const helpers = setup();
    await fillAndSubmit(helpers, { confirmPassword: 'Different1' });
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});

// ─── Successful reset ───────────────────────────────────────────────────────────

describe('ResetPasswordForm successful reset', () => {
  it('calls resetPassword with the token and new password', async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'valid-token',
        password: 'Password1',
        confirmPassword: 'Password1',
      });
    });
  });

  it('shows a confirmation and a sign-in button after success', async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    expect(await screen.findByRole('status')).toHaveTextContent(/password reset/i);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('navigates to /login when the sign-in button is clicked', async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    await screen.findByRole('status');
    await helpers.user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

// ─── Failed reset ────────────────────────────────────────────────────────────────

describe('ResetPasswordForm failed reset', () => {
  it('shows a root error and a link to request a new token when the token is invalid or expired', async () => {
    mockResetPassword.mockResolvedValue({
      success: false,
      error: { message: 'This password reset link is invalid or has expired.' },
    });
    const helpers = setup();
    await fillAndSubmit(helpers);

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/i);
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});
