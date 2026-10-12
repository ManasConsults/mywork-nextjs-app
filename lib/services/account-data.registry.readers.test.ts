/** @jest-environment node */
import { ACCOUNT_DATA_REGISTRY, EXPORT_PAGE_SIZE, readExportUser } from './account-data.registry';

jest.mock('@/lib/db/prisma', () => {
  const delegate = () => ({ findMany: jest.fn().mockResolvedValue([]) });
  return {
    prisma: {
      user: { findUnique: jest.fn() },
      invoice: delegate(),
      transaction: delegate(),
      workLog: delegate(),
      todoItem: delegate(),
      note: delegate(),
      achievement: delegate(),
      task: delegate(),
      client: delegate(),
      account: delegate(),
      category: delegate(),
      feedbackSubmission: delegate(),
    },
  };
});

import { prisma } from '@/lib/db/prisma';

type Delegate = { findMany: jest.Mock };

function delegateFor(model: string): Delegate {
  const key = model[0].toLowerCase() + model.slice(1);
  return (prisma as unknown as Record<string, Delegate>)[key];
}

describe('registry export readers', () => {
  const exported = ACCOUNT_DATA_REGISTRY.filter((e) => e.readPage);

  it.each(exported.map((e) => [e.model]))('%s reader is scoped to the user and ordered by id', async (model) => {
    const entry = ACCOUNT_DATA_REGISTRY.find((e) => e.model === model)!;

    await entry.readPage!('userA', null, EXPORT_PAGE_SIZE);

    const arg = delegateFor(model).findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ userId: 'userA' });
    expect(arg.orderBy).toEqual({ id: 'asc' });
    expect(arg.take).toBe(EXPORT_PAGE_SIZE);
    expect(JSON.stringify(arg.where)).not.toContain('deletedAt');
  });

  it.each(exported.map((e) => [e.model]))('%s reader applies the id cursor', async (model) => {
    const entry = ACCOUNT_DATA_REGISTRY.find((e) => e.model === model)!;

    await entry.readPage!('userA', 'cursor-1', 10);

    const arg = delegateFor(model).findMany.mock.calls.at(-1)![0];
    expect(arg.where).toEqual({ userId: 'userA', id: { gt: 'cursor-1' } });
  });

  it('nests line items under invoices', async () => {
    const entry = ACCOUNT_DATA_REGISTRY.find((e) => e.model === 'Invoice')!;

    await entry.readPage!('userA', null, 5);

    expect(delegateFor('Invoice').findMany.mock.calls.at(-1)![0].include).toEqual({
      lineItems: { orderBy: { sortOrder: 'asc' } },
    });
  });

  it('does not export line items or reset tokens as top-level keys', () => {
    expect(ACCOUNT_DATA_REGISTRY.find((e) => e.model === 'InvoiceLineItem')?.exportKey).toBeNull();
    expect(ACCOUNT_DATA_REGISTRY.map((e) => e.exportKey)).not.toContain('passwordResetTokens');
  });
});

describe('readExportUser', () => {
  it('omits passwordHash', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });

    await readExportUser('u1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, omit: { passwordHash: true } });
  });
});

describe('registry erase functions', () => {
  it('InvoiceLineItem is erased through its invoice owner', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    const entry = ACCOUNT_DATA_REGISTRY.find((e) => e.model === 'InvoiceLineItem')!;

    const count = await entry.erase({ invoiceLineItem: { deleteMany } } as never, 'userA');

    expect(count).toBe(3);
    expect(deleteMany).toHaveBeenCalledWith({ where: { invoice: { userId: 'userA' } } });
  });
});
