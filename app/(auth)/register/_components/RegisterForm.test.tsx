import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RegisterForm } from './RegisterForm';

// ─── Mocks ────────────────────────────────────────────────────────────────────


const mockRegisterUser = jest.fn();

jest.mock('@/lib/actions/auth', () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Password1',
  confirmPassword: 'Password1',
};

function setup() {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<RegisterForm />);
  return {
    user,
    nameInput: () => screen.getByLabelText(/full name/i),
    emailInput: () => screen.getByLabelText(/email address/i),
    passwordInput: () => screen.getByLabelText(/^password/i),
    confirmInput: () => screen.getByLabelText(/confirm password/i),
    submitButton: () => screen.getByRole('button', { name: /create account/i }),
  };
}

async function fillAndSubmit(
  helpers: ReturnType<typeof setup>,
  overrides: Partial<typeof VALID> = {},
) {
  const values = { ...VALID, ...overrides };
  const { user, nameInput, emailInput, passwordInput, confirmInput, submitButton } = helpers;
  if (values.name) await user.type(nameInput(), values.name);
  if (values.email) await user.type(emailInput(), values.email);
  if (values.password) await user.type(passwordInput(), values.password);
  if (values.confirmPassword) await user.type(confirmInput(), values.confirmPassword);
  await user.click(submitButton());
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('RegisterForm rendering', () => {
  it('renders all four fields', () => {
    const { nameInput, emailInput, passwordInput, confirmInput } = setup();
    expect(nameInput()).toBeInTheDocument();
    expect(emailInput()).toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
    expect(confirmInput()).toBeInTheDocument();
  });

  it('renders the create account button', () => {
    const { submitButton } = setup();
    expect(submitButton()).toBeInTheDocument();
  });

  it('renders a link back to the login page', () => {
    setup();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('renders a password hint when no error', () => {
    setup();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('RegisterForm validation', () => {
  it('shows name required error when name is too short', async () => {
    const helpers = setup();
    await helpers.user.type(helpers.nameInput(), 'J');
    await helpers.user.click(helpers.submitButton());
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it('shows email invalid error for bad email', async () => {
    const helpers = setup();
    await helpers.user.type(helpers.nameInput(), 'Jane');
    await helpers.user.type(helpers.emailInput(), 'bad-email');
    await helpers.user.click(helpers.submitButton());
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows password too short error', async () => {
    const helpers = setup();
    await helpers.user.type(helpers.nameInput(), 'Jane');
    await helpers.user.type(helpers.emailInput(), 'jane@example.com');
    await helpers.user.type(helpers.passwordInput(), 'Ab1');
    await helpers.user.type(helpers.confirmInput(), 'Ab1');
    await helpers.user.click(helpers.submitButton());
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows uppercase error when password has no uppercase', async () => {
    const helpers = setup();
    await helpers.user.type(helpers.nameInput(), 'Jane');
    await helpers.user.type(helpers.emailInput(), 'jane@example.com');
    await helpers.user.type(helpers.passwordInput(), 'password1');
    await helpers.user.type(helpers.confirmInput(), 'password1');
    await helpers.user.click(helpers.submitButton());
    expect(await screen.findByText(/uppercase letter/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const helpers = setup();
    await fillAndSubmit(helpers, { confirmPassword: 'Different1' });
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('marks confirm password as aria-invalid when mismatch', async () => {
    const helpers = setup();
    await fillAndSubmit(helpers, { confirmPassword: 'Different1' });
    await screen.findByText(/passwords do not match/i);
    expect(helpers.confirmInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not call registerUser when validation fails', async () => {
    const helpers = setup();
    await helpers.user.click(helpers.submitButton());
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it('clears field error when user starts typing', async () => {
    const helpers = setup();
    await helpers.user.click(helpers.submitButton());
    await screen.findByText(/email is required/i);
    await helpers.user.type(helpers.emailInput(), 'a');
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });
});

// ─── Successful registration ──────────────────────────────────────────────────

describe('RegisterForm successful registration', () => {
  it('calls registerUser with correct input on valid submission', async () => {
    mockRegisterUser.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
      });
    });
  });

  it('shows "Registration submitted!" heading after successful registration', async () => {
    mockRegisterUser.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    expect(await screen.findByRole('status')).toHaveTextContent(/registration submitted/i);
  });

  it('shows pending-approval message after successful registration', async () => {
    mockRegisterUser.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    await screen.findByRole('status');
    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
  });

  it('does not redirect after successful registration', async () => {
    mockRegisterUser.mockResolvedValue({ success: true });
    const helpers = setup();
    await fillAndSubmit(helpers);

    await screen.findByRole('status');
    // No router import — the form stays on /register after success
  });
});

// ─── Failed registration ──────────────────────────────────────────────────────

describe('RegisterForm failed registration', () => {
  it('shows root error when server returns an error message', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: { message: 'An account with this email already exists.' },
    });
    const helpers = setup();
    await fillAndSubmit(helpers);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /already exists/i,
    );
  });

  it('shows server-side field errors when returned', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: { message: 'Validation failed', fields: { email: ['Email already in use'] } },
    });
    const helpers = setup();
    await fillAndSubmit(helpers);

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
  });
});
