import { createTransactionAction, updateTransactionAction, deleteTransactionAction } from './transaction';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/services/finance/transaction.service', () => ({
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { createTransaction, updateTransaction, deleteTransaction } from '@/lib/services/finance/transaction.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;
const mockUpdateTransaction = updateTransaction as jest.MockedFunction<typeof updateTransaction>;
const mockDeleteTransaction = deleteTransaction as jest.MockedFunction<typeof deleteTransaction>;

const session = { user: { id: 'user-1', role: 'MEMBER' }, expires: '' };

const ACC_ID = '00000000-0000-4000-8000-000000000001';
const CAT_ID = '00000000-0000-4000-8000-000000000002';

const baseTx = {
  id: 'tx-1', userId: 'user-1', accountId: ACC_ID, categoryId: CAT_ID,
  type: 'INCOME' as const, amount: 5000, date: new Date(), description: null,
  reference: null, workContext: null, isRecurring: false, recurringId: null,
  recurFrequency: null, recurEndsAt: null, createdAt: new Date(), updatedAt: new Date(),
};

const validInput = {
  accountId: ACC_ID,
  categoryId: CAT_ID,
  type: 'INCOME' as const,
  amount: 5000,
  date: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTransactionAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createTransactionAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it('returns field errors on invalid input (amount = 0)', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createTransactionAction({ ...validInput, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields).toBeDefined();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it('creates transaction on valid input', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCreateTransaction.mockResolvedValue(baseTx);
    const result = await createTransactionAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(baseTx);
  });
});

describe('updateTransactionAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateTransactionAction('tx-1', { amount: 100 });
    expect(result.success).toBe(false);
  });

  it('returns not found when service returns null', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateTransaction.mockResolvedValue(null);
    const result = await updateTransactionAction('tx-1', { amount: 100 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Transaction not found.');
  });

  it('returns success with updated transaction', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateTransaction.mockResolvedValue({ ...baseTx, amount: 100 });
    const result = await updateTransactionAction('tx-1', { amount: 100 });
    expect(result.success).toBe(true);
  });
});

describe('deleteTransactionAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await deleteTransactionAction('tx-1');
    expect(result.success).toBe(false);
  });

  it('returns not found when service returns false', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteTransaction.mockResolvedValue(false);
    const result = await deleteTransactionAction('tx-1');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Transaction not found.');
  });

  it('returns success when deleted', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteTransaction.mockResolvedValue(true);
    const result = await deleteTransactionAction('tx-1');
    expect(result.success).toBe(true);
  });
});
