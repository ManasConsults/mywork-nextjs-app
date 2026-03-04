import { hashPassword, verifyPassword } from './passwords';

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('MySecret1');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('produces a different hash each call (salt randomness)', async () => {
    const hash1 = await hashPassword('MySecret1');
    const hash2 = await hashPassword('MySecret1');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hash = await hashPassword('Correct1');
    await expect(verifyPassword('Correct1', hash)).resolves.toBe(true);
  });

  it('returns false for an incorrect password', async () => {
    const hash = await hashPassword('Correct1');
    await expect(verifyPassword('Wrong123', hash)).resolves.toBe(false);
  });

  it('returns false for an empty string', async () => {
    const hash = await hashPassword('Correct1');
    await expect(verifyPassword('', hash)).resolves.toBe(false);
  });
});
