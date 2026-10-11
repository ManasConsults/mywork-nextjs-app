/** @jest-environment node */
import { Prisma } from '@prisma/client';

import { ACCOUNT_DATA_REGISTRY } from './account-data.registry';

jest.mock('@/lib/db/prisma', () => ({ prisma: {} }));

describe('ACCOUNT_DATA_REGISTRY', () => {
  const registered = ACCOUNT_DATA_REGISTRY.map((e) => e.model);

  it('covers every Prisma model except User, so new models cannot skip export and erasure', () => {
    const models = Prisma.dmmf.datamodel.models.map((m) => m.name).filter((name) => name !== 'User');
    expect([...registered].sort()).toEqual([...models].sort());
  });

  it('has no duplicate models or export keys', () => {
    expect(new Set(registered).size).toBe(registered.length);
    const keys = ACCOUNT_DATA_REGISTRY.map((e) => e.exportKey).filter((k) => k !== null);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('erases restricting children before their parents', () => {
    const idx = (model: string): number => registered.indexOf(model);
    expect(idx('InvoiceLineItem')).toBeLessThan(idx('Invoice'));
    expect(idx('Invoice')).toBeLessThan(idx('Client'));
    expect(idx('Transaction')).toBeLessThan(idx('Account'));
    expect(idx('Transaction')).toBeLessThan(idx('Category'));
    for (const child of ['WorkLog', 'TodoItem', 'Note', 'Achievement', 'FeedbackSubmission']) {
      expect(idx(child)).toBeLessThan(registered.length);
    }
    expect(idx('WorkLog')).toBeLessThan(idx('Task'));
  });

  it('never exports password reset tokens', () => {
    const entry = ACCOUNT_DATA_REGISTRY.find((e) => e.model === 'PasswordResetToken');
    expect(entry?.exportKey).toBeNull();
    expect(entry?.readPage).toBeNull();
  });
});
