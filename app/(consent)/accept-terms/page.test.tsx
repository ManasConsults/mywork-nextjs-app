/** @jest-environment node */
import AcceptTermsPage from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((to: string) => {
    throw new Error(to);
  }),
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock('./_components/AcceptTermsForm', () => ({ AcceptTermsForm: () => null }));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { LEGAL_VERSION } from '@/lib/legal/constants';

const mockSession = getServerSession as jest.Mock;
const mockFind = prisma.user.findUnique as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: 'u1' } });
  mockFind.mockResolvedValue({ termsAcceptedAt: null, termsVersion: null });
});

describe('AcceptTermsPage', () => {
  it('sends anonymous visitors to /login', async () => {
    mockSession.mockResolvedValue(null);
    await expect(AcceptTermsPage()).rejects.toThrow('/login');
  });

  it('sends users with a missing row to /login', async () => {
    mockFind.mockResolvedValue(null);
    await expect(AcceptTermsPage()).rejects.toThrow('/login');
  });

  it('bounces users on the current version to /dashboard (no loop)', async () => {
    mockFind.mockResolvedValue({ termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION });
    await expect(AcceptTermsPage()).rejects.toThrow('/dashboard');
  });

  it('renders the form for users who must accept', async () => {
    await expect(AcceptTermsPage()).resolves.toBeDefined();
  });

  it('shows the form again after a version bump', async () => {
    mockFind.mockResolvedValue({ termsAcceptedAt: new Date(), termsVersion: 'old' });
    await expect(AcceptTermsPage()).resolves.toBeDefined();
  });
});
