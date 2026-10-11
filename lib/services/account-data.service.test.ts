/** @jest-environment node */
import { ACCOUNT_DATA_REGISTRY, EXPORT_PAGE_SIZE } from './account-data.registry';
import { deleteUserAccount, exportAccountChunks } from './account-data.service';

jest.mock('@/lib/db/prisma', () => ({ prisma: { $transaction: jest.fn() } }));

import { prisma } from '@/lib/db/prisma';

const mockTransaction = prisma.$transaction as jest.Mock;

type Row = { id: string; role: string; isActive: boolean };

function lowerFirst(s: string): string {
  return s[0].toLowerCase() + s.slice(1);
}

function buildTx(lockedRows: Row[], failOn?: string) {
  const calls: { model: string; where: unknown }[] = [];
  const tx: Record<string, unknown> = {
    $queryRaw: jest.fn().mockResolvedValue(lockedRows),
    user: { delete: jest.fn().mockResolvedValue({}) },
  };
  for (const { model } of ACCOUNT_DATA_REGISTRY) {
    tx[lowerFirst(model)] = {
      deleteMany: jest.fn(async ({ where }: { where: unknown }) => {
        if (model === failOn) throw new Error('boom');
        calls.push({ model, where });
        return { count: 2 };
      }),
    };
  }
  return { tx, calls };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deleteUserAccount', () => {
  it('erases every registry model in order, then the user, scoped to the target', async () => {
    const { tx, calls } = buildTx([{ id: 'u1', role: 'MEMBER', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('u1', 'u1')).resolves.toEqual({ ok: true });

    expect(calls.map((c) => c.model)).toEqual(ACCOUNT_DATA_REGISTRY.map((e) => e.model));
    for (const { model, where } of calls) {
      expect(JSON.stringify(where)).toContain('"u1"');
      if (model === 'InvoiceLineItem') expect(where).toEqual({ invoice: { userId: 'u1' } });
      else expect(where).toEqual({ userId: 'u1' });
    }
    expect((tx.user as { delete: jest.Mock }).delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('refuses to delete the last active admin and erases nothing', async () => {
    const { tx, calls } = buildTx([{ id: 'a1', role: 'ADMIN', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('a1', 'a1')).resolves.toEqual({ ok: false, reason: 'LAST_ADMIN' });
    expect(calls).toHaveLength(0);
    expect((tx.user as { delete: jest.Mock }).delete).not.toHaveBeenCalled();
  });

  it('allows an admin to be deleted when another active admin exists', async () => {
    const { tx } = buildTx([
      { id: 'a1', role: 'ADMIN', isActive: true },
      { id: 'a2', role: 'ADMIN', isActive: true },
    ]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('a1', 'a2')).resolves.toEqual({ ok: true });
  });

  it('returns NOT_FOUND when the user does not exist', async () => {
    const { tx, calls } = buildTx([{ id: 'a2', role: 'ADMIN', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('missing', 'a2')).resolves.toEqual({ ok: false, reason: 'NOT_FOUND' });
    expect(calls).toHaveLength(0);
  });

  it('propagates a mid-erase failure so the transaction rolls back', async () => {
    const { tx } = buildTx([{ id: 'u1', role: 'MEMBER', isActive: true }], 'Note');
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('u1', 'u1')).rejects.toThrow('boom');
    expect((tx.user as { delete: jest.Mock }).delete).not.toHaveBeenCalled();
  });

  it('uses a bounded transaction', async () => {
    const { tx } = buildTx([{ id: 'u1', role: 'MEMBER', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));
    await deleteUserAccount('u1', 'u1');
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 15_000, maxWait: 5_000 });
  });
});

describe('exportAccountChunks', () => {
  async function collect(userId: string): Promise<string> {
    let out = '';
    for await (const chunk of exportAccountChunks(userId, { id: userId }, new Date('2026-10-11T00:00:00.000Z'))) {
      out += chunk;
    }
    return out;
  }

  // Replaces each reader so no DB is needed; later calls return an empty page.
  function stubReaders(pages: Record<string, { id: string }[][]>): void {
    for (const entry of ACCOUNT_DATA_REGISTRY) {
      if (!entry.readPage || !entry.exportKey) continue;
      const queue = [...(pages[entry.exportKey] ?? [])];
      entry.readPage = jest.fn(async () => queue.shift() ?? []);
    }
  }

  it('emits valid JSON with every export key, including empty ones', async () => {
    stubReaders({});
    const parsed = JSON.parse(await collect('u1')) as Record<string, unknown>;
    expect(parsed.user).toEqual({ id: 'u1' });
    expect(parsed.legalVersion).toBeDefined();
    for (const entry of ACCOUNT_DATA_REGISTRY) {
      if (entry.exportKey) expect(parsed[entry.exportKey]).toEqual([]);
    }
    expect(parsed).not.toHaveProperty('passwordResetTokens');
  });

  it('pages through a full page using the last id as cursor', async () => {
    const full = Array.from({ length: EXPORT_PAGE_SIZE }, (_, i) => ({ id: `t${i}` }));
    stubReaders({ tasks: [full, [{ id: 'tlast' }]] });
    const parsed = JSON.parse(await collect('u1')) as { tasks: { id: string }[] };
    expect(parsed.tasks).toHaveLength(EXPORT_PAGE_SIZE + 1);
    const taskEntry = ACCOUNT_DATA_REGISTRY.find((e) => e.exportKey === 'tasks');
    expect(taskEntry?.readPage).toHaveBeenNthCalledWith(2, 'u1', `t${EXPORT_PAGE_SIZE - 1}`, EXPORT_PAGE_SIZE);
  });
});

describe('deleteUserAccount (SA constraints)', () => {
  it('takes the FOR UPDATE lock before any erase or user delete', async () => {
    const order: string[] = [];
    const { tx } = buildTx([{ id: 'u1', role: 'MEMBER', isActive: true }]);
    (tx.$queryRaw as jest.Mock).mockImplementation(async (strings: TemplateStringsArray) => {
      order.push(`lock:${/FOR UPDATE/.test(strings.join(''))}`);
      return [{ id: 'u1', role: 'MEMBER', isActive: true }];
    });
    for (const { model } of ACCOUNT_DATA_REGISTRY) {
      const delegate = tx[lowerFirst(model)] as { deleteMany: jest.Mock };
      delegate.deleteMany.mockImplementation(async () => {
        order.push(model);
        return { count: 0 };
      });
    }
    (tx.user as { delete: jest.Mock }).delete.mockImplementation(async () => {
      order.push('user');
      return {};
    });
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await deleteUserAccount('u1', 'u1');

    expect(order).toEqual(['lock:true', ...ACCOUNT_DATA_REGISTRY.map((e) => e.model), 'user']);
  });

  it('matches the SA erasure order exactly', () => {
    expect(ACCOUNT_DATA_REGISTRY.map((e) => e.model)).toEqual([
      'InvoiceLineItem', 'Invoice', 'Transaction', 'WorkLog', 'TodoItem', 'Note', 'Achievement',
      'Task', 'Client', 'Account', 'Category', 'FeedbackSubmission', 'PasswordResetToken',
    ]);
  });

  it('never references another user in any erase call (RS isolation: user A deletion leaves user B untouched)', async () => {
    const { tx, calls } = buildTx([{ id: 'userA', role: 'MEMBER', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await deleteUserAccount('userA', 'userA');

    expect(calls.length).toBe(ACCOUNT_DATA_REGISTRY.length);
    for (const { where } of calls) {
      const json = JSON.stringify(where);
      expect(json).toContain('userA');
      expect(json).not.toContain('userB');
      expect(Object.keys(where as object)).toHaveLength(1);
    }
    expect((tx.user as { delete: jest.Mock }).delete).toHaveBeenCalledTimes(1);
    expect((tx.user as { delete: jest.Mock }).delete).toHaveBeenCalledWith({ where: { id: 'userA' } });
  });

  it('hard-deletes soft-deleted rows: no erase where clause filters on deletedAt', async () => {
    const { tx, calls } = buildTx([{ id: 'u1', role: 'MEMBER', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await deleteUserAccount('u1', 'u1');

    for (const { where } of calls) expect(JSON.stringify(where)).not.toContain('deletedAt');
  });

  it('does not count an inactive admin as a remaining administrator', async () => {
    const { tx } = buildTx([{ id: 'a1', role: 'ADMIN', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('a1', 'a1')).resolves.toEqual({ ok: false, reason: 'LAST_ADMIN' });
  });

  it('allows deleting an inactive admin even when no other admin exists', async () => {
    const { tx } = buildTx([{ id: 'a1', role: 'ADMIN', isActive: false }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await expect(deleteUserAccount('a1', 'a1')).resolves.toEqual({ ok: true });
  });

  it('logs only ids and counts, never personal data', async () => {
    const loggerModule = jest.requireActual<typeof import('@/lib/utils/logger')>('@/lib/utils/logger');
    const warn = jest.spyOn(loggerModule.default, 'warn');
    const { tx } = buildTx([{ id: 'u1', role: 'MEMBER', isActive: true }]);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    await deleteUserAccount('u1', 'actor');

    const [ctx] = warn.mock.calls[0];
    expect(Object.keys(ctx).sort()).toEqual(['actorId', 'counts', 'userId']);
    warn.mockRestore();
  });
});

describe('exportAccountChunks (content rules)', () => {
  it('never emits a passwordHash or reset-token key', async () => {
    for (const entry of ACCOUNT_DATA_REGISTRY) {
      if (entry.readPage) entry.readPage = jest.fn(async () => []);
    }
    let out = '';
    for await (const c of exportAccountChunks('u1', { id: 'u1', email: 'a@b.c' }, new Date())) out += c;

    expect(out).not.toMatch(/passwordHash|resetToken|PasswordResetToken/i);
  });
});
