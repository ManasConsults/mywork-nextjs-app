import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { readExportUser } from '@/lib/services/account-data.registry';
import { exportAccountChunks } from '@/lib/services/account-data.service';
import logger from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read before opening the stream so failures still produce a proper JSON error response.
  let user: Record<string, unknown> | null;
  try {
    user = await readExportUser(userId);
  } catch (err) {
    logger.error({ userId, err: err instanceof Error ? err.name : 'unknown' }, 'account export failed');
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const exportedAt = new Date();
  const chunks = exportAccountChunks(userId, user, exportedAt);
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await chunks.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (err) {
        logger.warn({ userId, err: err instanceof Error ? err.name : 'unknown' }, 'account export aborted mid-stream');
        controller.error(err);
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mywork-export-${exportedAt.toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
