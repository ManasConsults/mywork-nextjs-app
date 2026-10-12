/** @jest-environment node */
import AppLayout from './layout';

class RedirectSignal extends Error {}

jest.mock('next/navigation', () => ({
  redirect: jest.fn((to: string) => {
    throw new RedirectSignal(to);
  }),
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db/prisma', () => ({ prisma: { user: { findUnique: jest.fn(), count: jest.fn() } } }));
jest.mock('./_components/AppShell', () => ({ AppShell: () => null }));
jest.mock('./_components/AppSessionProvider', () => ({ AppSessionProvider: () => null }));

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { LEGAL_VERSION } from '@/lib/legal/constants';

const mockSession = getServerSession as jest.Mock;
const mockFind = prisma.user.findUnique as jest.Mock;

const current = { themeColor: 'teal', termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION };

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: 'u1', role: 'MEMBER' } });
  mockFind.mockResolvedValue(current);
});

describe('(app) AppLayout consent gate', () => {
  it('redirects to /login without a session, before any DB read', async () => {
    mockSession.mockResolvedValue(null);
    await expect(AppLayout({ children: null })).rejects.toThrow('/login');
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('redirects to /login when the user row no longer exists', async () => {
    mockFind.mockResolvedValue(null);
    await expect(AppLayout({ children: null })).rejects.toThrow('/login');
  });

  it('redirects to /accept-terms when consent was never given', async () => {
    mockFind.mockResolvedValue({ ...current, termsAcceptedAt: null, termsVersion: null });
    await expect(AppLayout({ children: null })).rejects.toThrow('/accept-terms');
  });

  it('redirects to /accept-terms when the accepted version is stale', async () => {
    mockFind.mockResolvedValue({ ...current, termsVersion: '2020-01-01' });
    await expect(AppLayout({ children: null })).rejects.toThrow('/accept-terms');
  });

  it('renders for a user on the current version', async () => {
    await expect(AppLayout({ children: null })).resolves.toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('reads consent for the session user only', async () => {
    await AppLayout({ children: null });
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });

  it('redirects a pending-deletion user to /login with the dated message, even with stale consent', async () => {
    mockFind.mockResolvedValue({ ...current, termsAcceptedAt: null, termsVersion: null, deletionRequestedAt: new Date('2026-10-11T03:00:00.000Z') });
    await expect(AppLayout({ children: null })).rejects.toThrow('/login?error=AccountDeletionPending&deletionDate=2026-10-25');
  });
});

describe('(app) AppLayout pending approval badge', () => {
  it('excludes pending-deletion users from the admin pending count', async () => {
    mockSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } });
    (prisma.user.count as jest.Mock).mockResolvedValue(0);
    await AppLayout({ children: null });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { isActive: false, deletionRequestedAt: null } });
  });
});
