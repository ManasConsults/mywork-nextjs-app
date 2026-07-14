'use server';

import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/passwords';
import { generateResetToken, hashResetToken } from '@/lib/auth/reset-token';
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/schemas/auth.schema';
import type { RegisterInput, ForgotPasswordInput, ResetPasswordInput } from '@/lib/schemas/auth.schema';
import { sendRegistrationPendingEmail, sendPasswordResetEmail } from '@/lib/email/notifications';

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

  const { name, email, password, employmentType } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: { message: 'An account with this email already exists.' },
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { name, email, passwordHash, role: 'MEMBER', isActive: false, employmentType },
  });

  try { await sendRegistrationPendingEmail(email, name ?? null); } catch { /* email failure is non-fatal */ }

  return { success: true };
}

export type ForgotPasswordResult =
  | { success: true }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

// Always returns success (bar validation errors) regardless of whether the email
// matches an account — prevents attackers from using this endpoint to enumerate users.
export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors },
    };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Only credentials-based accounts have a password to reset.
  if (user && user.isActive && user.passwordHash) {
    const { token, tokenHash, expiresAt } = generateResetToken();

    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    try { await sendPasswordResetEmail(email, user.name ?? null, token); } catch { /* email failure is non-fatal */ }
  }

  return { success: true };
}

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors },
    };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return {
      success: false,
      error: { message: 'This password reset link is invalid or has expired.' },
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset requests for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null, id: { not: resetToken.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
