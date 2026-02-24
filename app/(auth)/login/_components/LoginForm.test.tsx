import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginForm } from './LoginForm';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSignIn = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  render(<LoginForm />);
  return {
    user,
    emailInput: () => screen.getByLabelText(/email address/i),
    passwordInput: () => screen.getByLabelText(/^password/i),
    submitButton: () => screen.getByRole('button', { name: /sign in/i }),
    githubButton: () => screen.getByRole('button', { name: /github/i }),
    googleButton: () => screen.getByRole('button', { name: /google/i }),
    facebookButton: () => screen.getByRole('button', { name: /facebook/i }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('LoginForm rendering', () => {
  it('renders email and password fields', () => {
    const { emailInput, passwordInput } = setup();
    expect(emailInput()).toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
  });

  it('renders sign-in submit button', () => {
    const { submitButton } = setup();
    expect(submitButton()).toBeInTheDocument();
  });

  it('renders all three OAuth provider buttons', () => {
    const { githubButton, googleButton, facebookButton } = setup();
    expect(githubButton()).toBeInTheDocument();
    expect(googleButton()).toBeInTheDocument();
    expect(facebookButton()).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    setup();
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });

  it('renders a forgot password link', () => {
    setup();
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('LoginForm validation', () => {
  it('shows email required error when submitted empty', async () => {
    const { user, submitButton } = setup();
    await user.click(submitButton());
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows password required error when submitted empty', async () => {
    const { user, submitButton } = setup();
    await user.click(submitButton());
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows invalid email error for malformed email', async () => {
    const { user, emailInput, submitButton } = setup();
    await user.type(emailInput(), 'not-an-email');
    await user.click(submitButton());
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('clears email error when user types a valid email', async () => {
    const { user, emailInput, submitButton } = setup();
    await user.click(submitButton());
    await screen.findByText(/email is required/i);

    await user.type(emailInput(), 'valid@example.com');
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it('marks email input as aria-invalid when there is an error', async () => {
    const { user, emailInput, submitButton } = setup();
    await user.click(submitButton());
    await screen.findByText(/email is required/i);
    expect(emailInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not call signIn when validation fails', async () => {
    const { user, submitButton } = setup();
    await user.click(submitButton());
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});

// ─── Successful submission ────────────────────────────────────────────────────

describe('LoginForm successful sign-in', () => {
  it('calls signIn with credentials and redirects on success', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });

    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput(), 'user@example.com');
    await user.type(passwordInput(), 'secret123');
    await user.click(submitButton());

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'user@example.com',
        password: 'secret123',
        callbackUrl: '/dashboard',
      });
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
  });
});

// ─── Failed submission ────────────────────────────────────────────────────────

describe('LoginForm failed sign-in', () => {
  it('shows root error message when signIn returns an error', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });

    const { user, emailInput, passwordInput, submitButton } = setup();
    await user.type(emailInput(), 'user@example.com');
    await user.type(passwordInput(), 'wrongpassword');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid email or password/i,
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ─── OAuth buttons ────────────────────────────────────────────────────────────

describe('LoginForm OAuth providers', () => {
  it.each([['github'], ['google'], ['facebook']] as const)(
    'calls signIn with %s provider when button is clicked',
    async (provider) => {
      mockSignIn.mockResolvedValue({});
      const { user } = setup();
      const button = screen.getByRole('button', { name: new RegExp(provider, 'i') });
      await user.click(button);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(provider, { callbackUrl: '/dashboard' });
      });
    },
  );
});
