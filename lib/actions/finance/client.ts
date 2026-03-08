'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { Client } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createClientSchema, updateClientSchema } from '@/lib/schemas/finance/client.schema';
import type { CreateClientInput, UpdateClientInput } from '@/lib/schemas/finance/client.schema';
import {
  createClient,
  updateClient,
  archiveClient,
  deleteClient,
} from '@/lib/services/finance/client.service';

type ClientActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function revalidateClientPaths(): void {
  revalidatePath('/finance/clients');
  revalidatePath('/finance/invoices');
}

export async function createClientAction(
  input: CreateClientInput,
): Promise<ClientActionResult<Client>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const client = await createClient(userId, parsed.data);
    revalidateClientPaths();
    return { success: true, data: client };
  } catch {
    return { success: false, error: { message: 'Failed to create client.' } };
  }
}

export async function updateClientAction(
  id: string,
  input: UpdateClientInput,
): Promise<ClientActionResult<Client>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const client = await updateClient(userId, id, parsed.data);
    if (!client) return { success: false, error: { message: 'Client not found.' } };
    revalidateClientPaths();
    return { success: true, data: client };
  } catch {
    return { success: false, error: { message: 'Failed to update client.' } };
  }
}

export async function archiveClientAction(id: string): Promise<ClientActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const client = await archiveClient(userId, id);
    if (!client) return { success: false, error: { message: 'Client not found.' } };
    revalidateClientPaths();
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to archive client.' } };
  }
}

export async function deleteClientAction(id: string): Promise<ClientActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await deleteClient(userId, id);
    if (!deleted) return { success: false, error: { message: 'Client not found.' } };
    revalidateClientPaths();
    return { success: true, data: undefined };
  } catch (err) {
    const message =
      err instanceof Error && err.message === 'Client has invoices'
        ? 'Cannot delete a client that has invoices.'
        : 'Failed to delete client.';
    return { success: false, error: { message } };
  }
}
