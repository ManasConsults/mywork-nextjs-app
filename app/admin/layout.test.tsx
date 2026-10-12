/** @jest-environment node */
import AdminLayout from './layout';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((to: string) => {
    throw new Error(to);
  }),
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock('./_components/AdminPageTitle', () => ({ AdminPageTitle: () => null }));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { LEGAL_VERSION } from '@/lib/legal/constants';

const mockSession = getServerSession as jest.Mock;
const mockFind = prisma.user.findUnique as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } });
  mockFind.mockResolvedValue({ termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION });
});

describe('admin AdminLayout gate', () => {
  it('redirects to /login without a session', async () => {
    mockSession.mockResolvedValue(null);
    await expect(AdminLayout({ children: null })).rejects.toThrow('/login');
  });

  it('rejects non-admin users before touching the DB', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1', role: 'MEMBER' } });
    await expect(AdminLayout({ children: null })).rejects.toThrow('/dashboard');
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('redirects to /login when the admin row is gone', async () => {
    mockFind.mockResolvedValue(null);
    await expect(AdminLayout({ children: null })).rejects.toThrow('/login');
  });

  it('redirects to /accept-terms on stale consent', async () => {
    mockFind.mockResolvedValue({ termsAcceptedAt: new Date(), termsVersion: 'old' });
    await expect(AdminLayout({ children: null })).rejects.toThrow('/accept-terms');
  });

  it('renders for a consented admin', async () => {
    await expect(AdminLayout({ children: null })).resolves.toBeDefined();
  });

  it('redirects a pending-deletion user to /login with the dated message, even with stale consent', async () => {
    mockFind.mockResolvedValue({ termsAcceptedAt: null, termsVersion: null, deletionRequestedAt: new Date('2026-10-11T03:00:00.000Z') });
    await expect(AdminLayout({ children: null })).rejects.toThrow('/login?error=AccountDeletionPending&deletionDate=2026-10-25');
  });
});
