import { deleteAccountSchema } from './account.schema';

describe('deleteAccountSchema', () => {
  it('accepts a confirmation with the acknowledgement ticked', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: 'secret', acknowledged: true }).success).toBe(true);
  });

  it('rejects an empty confirmation', () => {
    const result = deleteAccountSchema.safeParse({ confirmation: '', acknowledged: true });
    expect(result.success).toBe(false);
  });

  it.each([false, undefined])('rejects acknowledged = %p', (acknowledged) => {
    const result = deleteAccountSchema.safeParse({ confirmation: 'secret', acknowledged });
    expect(result.success).toBe(false);
  });
});
