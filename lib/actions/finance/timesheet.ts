'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

type ActionResult =
  | { success: true }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

const createTimesheetEntrySchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  description: z.string().min(1, 'Description is required').max(2000),
  date: z.coerce.date(),
  hours: z
    .number()
    .positive('Hours must be greater than 0')
    .max(24, 'Hours cannot exceed 24'),
});

export async function createTimesheetEntryAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createTimesheetEntrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const { clientId, description, date, hours } = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!client) return { success: false, error: { message: 'Client not found.' } };

  await prisma.workLog.create({
    data: {
      userId,
      clientId,
      description,
      date,
      timeSpent: Math.round(hours * 60),
      billable: true,
    },
  });

  revalidatePath('/finance/timesheets');
  return { success: true };
}

const updateTimesheetEntrySchema = z.object({
  description: z.string().min(1, 'Description is required').max(2000),
  date: z.coerce.date(),
  hours: z
    .number()
    .positive('Hours must be greater than 0')
    .max(24, 'Hours cannot exceed 24'),
});

export async function updateTimesheetEntryAction(
  workLogId: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const entry = await prisma.workLog.findFirst({
    where: { id: workLogId, userId, billable: true },
  });
  if (!entry) return { success: false, error: { message: 'Entry not found.' } };
  if (entry.billedAt) return { success: false, error: { message: 'Cannot edit a billed entry.' } };

  const parsed = updateTimesheetEntrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const { description, date, hours } = parsed.data;

  await prisma.workLog.update({
    where: { id: workLogId },
    data: {
      description,
      date,
      timeSpent: Math.round(hours * 60),
    },
  });

  revalidatePath('/finance/timesheets');
  return { success: true };
}

export async function deleteTimesheetEntryAction(
  workLogId: string,
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const entry = await prisma.workLog.findFirst({
    where: { id: workLogId, userId, billable: true },
  });
  if (!entry) return { success: false, error: { message: 'Entry not found.' } };
  if (entry.billedAt) return { success: false, error: { message: 'Cannot delete a billed entry.' } };

  await prisma.workLog.delete({ where: { id: workLogId } });
  revalidatePath('/finance/timesheets');
  return { success: true };
}
