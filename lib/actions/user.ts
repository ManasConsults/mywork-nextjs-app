'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import type { User, EmploymentType } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import {
  updateProfileSchema,
  updateSettingsSchema,
  changePasswordSchema,
  updateEmploymentTypeSchema,
  updateBusinessDetailsSchema,
} from '@/lib/schemas/profile.schema';
import type { UpdateProfileInput, UpdateSettingsInput, ChangePasswordInput, UpdateEmploymentTypeInput, UpdateBusinessDetailsInput } from '@/lib/schemas/profile.schema';
import { updateProfile, updateSettings, changePassword, updateEmploymentType, updateBusinessDetails } from '@/lib/services/user.service';

type UserActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UserActionResult<User>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const user = await updateProfile(userId, parsed.data);
    revalidatePath('/profile');
    return { success: true, data: user };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.';
    return { success: false, error: { message } };
  }
}

export async function updateSettingsAction(
  input: UpdateSettingsInput,
): Promise<UserActionResult<User>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const user = await updateSettings(userId, parsed.data);
    revalidatePath('/profile');
    return { success: true, data: user };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update settings.';
    return { success: false, error: { message } };
  }
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<UserActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const result = await changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
  if (!result.success) {
    return { success: false, error: { message: result.error ?? 'Failed to change password.' } };
  }

  return { success: true, data: undefined };
}

export async function updateEmploymentTypeAction(
  input: UpdateEmploymentTypeInput,
): Promise<UserActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateEmploymentTypeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    await updateEmploymentType(userId, parsed.data.employmentType as EmploymentType);
    revalidatePath('/profile');
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update employment type.';
    return { success: false, error: { message } };
  }
}

export async function updateBusinessDetailsAction(
  input: UpdateBusinessDetailsInput,
): Promise<UserActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateBusinessDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    await updateBusinessDetails(userId, parsed.data);
    revalidatePath('/profile');
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update business details.';
    return { success: false, error: { message } };
  }
}
