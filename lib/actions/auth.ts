'use server';

import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/passwords';
import { registerSchema } from '@/lib/schemas/auth.schema';
import type { RegisterInput } from '@/lib/schemas/auth.schema';

export type RegisterResult =
  | { success: true }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors },
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: { message: 'An account with this email already exists.' },
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { name, email, passwordHash, role: 'MEMBER', isActive: false },
  });

  return { success: true };
}
