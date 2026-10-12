import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserTable } from './UserTable';

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
jest.mock('@/lib/actions/admin', () => ({
  setUserActiveAction: jest.fn(),
  setUserRoleAction: jest.fn(),
  rejectUserAction: jest.fn(),
  deleteUserAction: jest.fn(),
  cancelUserDeletionAction: jest.fn(),
  setUserModulesAction: jest.fn(),
  setUserEmploymentTypeAction: jest.fn(),
}));

import { cancelUserDeletionAction, deleteUserAction } from '@/lib/actions/admin';

const base = {
  role: 'MEMBER',
  rejectedAt: null,
  moduleWork: true,
  moduleFinance: true,
  employmentType: 'EMPLOYED',
  createdAt: '2026-01-01T00:00:00.000Z',
  deletionRequestedAt: null,
  deletionDue: false,
};
// Requested 2026-10-01 -> due 15 Oct 2026 (Brisbane); requested 2026-10-10 -> due 24 Oct 2026.
const users = [
  { ...base, id: 'a', name: 'Active Ann', email: 'ann@example.com', isActive: true },
  { ...base, id: 'p', name: 'Pending Pat', email: 'pat@example.com', isActive: false },
  {
    ...base, id: 'w', name: 'Waiting Wes', email: 'wes@example.com', isActive: false,
    deletionRequestedAt: '2026-10-10T00:00:00.000Z', deletionDue: false,
  },
  {
    ...base, id: 'd', name: 'Doomed Dan', email: 'dan@example.com', isActive: false,
    deletionRequestedAt: '2026-10-01T00:00:00.000Z', deletionDue: true,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

const notDueOnly = users.filter((u) => u.id !== 'd');

describe('UserTable deletion pending', () => {
  it('counts deletion rows only in their own tab and shows the due count', () => {
    render(<UserTable users={users} currentUserId="me" />);
    expect(screen.getByRole('button', { name: 'All (4)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pending (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Active (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deletion pending (2 · 1 due)' })).toBeInTheDocument();
  });

  it('omits the due count when nothing is due', () => {
    render(<UserTable users={notDueOnly} currentUserId="me" />);
    expect(screen.getByRole('button', { name: 'Deletion pending (1)' })).toBeInTheDocument();
  });

  it('highlights red only the due row, with the Ready to delete badge', () => {
    render(<UserTable users={users} currentUserId="me" />);
    expect(screen.getAllByText('Ready to delete').length).toBeGreaterThan(0);
    const red = document.querySelectorAll('.bg-destructive\\/10');
    expect(red.length).toBeGreaterThan(0);
    for (const el of red) expect(el).toHaveTextContent('Doomed Dan');
    expect(screen.getAllByText('Due since 15 October 2026').length).toBeGreaterThan(0);
  });

  it('shows no red row when nothing is due', () => {
    render(<UserTable users={notDueOnly} currentUserId="me" />);
    expect(document.querySelector('.bg-destructive\\/10')).toBeNull();
    expect(screen.queryByText('Ready to delete')).not.toBeInTheDocument();
  });

  it('disables Delete with an accessible reason before the due date, keeping Cancel enabled', async () => {
    const user = userEvent.setup();
    render(<UserTable users={notDueOnly} currentUserId="me" />);
    await user.click(screen.getByRole('button', { name: 'Deletion pending (1)' }));

    expect(screen.getAllByText('Deletion requested').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Can be deleted from 24 October 2026').length).toBeGreaterThan(0);
    for (const btn of screen.getAllByRole('button', { name: 'Delete' })) {
      expect(btn).toBeDisabled();
      expect(btn).toHaveAccessibleDescription('Available from 24 October 2026');
    }
    for (const btn of screen.getAllByRole('button', { name: 'Cancel deletion' })) expect(btn).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeDisabled();
  });

  it('lists due rows first, oldest request first', async () => {
    const user = userEvent.setup();
    render(<UserTable users={users} currentUserId="me" />);
    await user.click(screen.getByRole('button', { name: /^Deletion pending/ }));
    const names = screen.getAllByText(/Doomed Dan|Waiting Wes/).map((el) => el.textContent);
    expect(names.indexOf('Doomed Dan')).toBeLessThan(names.indexOf('Waiting Wes'));
  });

  it('cancels a deletion request', async () => {
    (cancelUserDeletionAction as jest.Mock).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<UserTable users={users} currentUserId="me" />);
    await user.click(screen.getByRole('button', { name: /^Deletion pending/ }));
    await user.click(screen.getAllByRole('button', { name: 'Cancel deletion' })[0]);
    expect(cancelUserDeletionAction).toHaveBeenCalledWith('d');
  });

  it('requires confirmation before deleting a due account', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<UserTable users={users} currentUserId="me" />);
    await user.click(screen.getByRole('button', { name: /^Deletion pending/ }));
    const enabled = screen.getAllByRole('button', { name: 'Delete' }).filter((b) => !b.hasAttribute('disabled'));
    await user.click(enabled[0]);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Doomed Dan'));
    expect(deleteUserAction).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});
