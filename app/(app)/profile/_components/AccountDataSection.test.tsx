import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccountDataSection } from './AccountDataSection';

const mockSignOut = jest.fn();
jest.mock('next-auth/react', () => ({ signOut: (...args: unknown[]) => mockSignOut(...args) }));
jest.mock('@/lib/actions/account', () => ({ deleteAccountAction: jest.fn() }));

import { deleteAccountAction } from '@/lib/actions/account';

beforeEach(() => {
  jest.clearAllMocks();
});

async function openDialog(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  render(<AccountDataSection hasPassword />);
  await user.click(screen.getByRole('button', { name: 'Delete account' }));
  return user;
}

describe('AccountDataSection deletion request', () => {
  it('explains the grace period, immediate sign-out and how to cancel', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('14-day period');
    expect(dialog).toHaveTextContent('within 30 days');
    expect(dialog).toHaveTextContent('signed out immediately');
    expect(dialog).toHaveTextContent('manasm.dev@gmail.com');
  });

  it('signs out to the landing notice URL with the purge date on success', async () => {
    (deleteAccountAction as jest.Mock).mockResolvedValue({ success: true, data: { purgeDate: '2026-10-26' } });
    const user = await openDialog();
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    await waitFor(() =>
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/?deletionRequested=2026-10-26' }),
    );
  });

  it('shows the server error and does not sign out', async () => {
    (deleteAccountAction as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Confirmation did not match' },
    });
    const user = await openDialog();
    await user.type(screen.getByLabelText(/password/i), 'bad');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation did not match');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
