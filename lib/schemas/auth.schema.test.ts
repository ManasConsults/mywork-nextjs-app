import { loginSchema, registerSchema } from './auth.schema';

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  const valid = { email: 'user@example.com', password: 'secret' };

  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['empty email', { ...valid, email: '' }, 'email'],
    ['invalid email format', { ...valid, email: 'not-an-email' }, 'email'],
    ['missing @', { ...valid, email: 'userexample.com' }, 'email'],
    ['empty password', { ...valid, password: '' }, 'password'],
  ])('rejects %s', (_label, input, expectedField) => {
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors[expectedField]).toBeDefined();
    }
  });
});

// ─── registerSchema ───────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['single-char name', { ...valid, name: 'J' }, 'name'],
    ['name over 100 chars', { ...valid, name: 'a'.repeat(101) }, 'name'],
    ['empty email', { ...valid, email: '' }, 'email'],
    ['invalid email', { ...valid, email: 'bad' }, 'email'],
    ['password under 8 chars', { ...valid, password: 'Ab1', confirmPassword: 'Ab1' }, 'password'],
    ['password over 128 chars', { ...valid, password: 'Aa1' + 'x'.repeat(126), confirmPassword: 'Aa1' + 'x'.repeat(126) }, 'password'],
    ['no uppercase letter', { ...valid, password: 'password1', confirmPassword: 'password1' }, 'password'],
    ['no digit', { ...valid, password: 'Password', confirmPassword: 'Password' }, 'password'],
  ])('rejects %s', (_label, input, expectedField) => {
    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors[expectedField]).toBeDefined();
    }
  });

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: 'DifferentPass1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        'Passwords do not match',
      );
    }
  });
});
