import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export type SearchResultItem = {
  id: string;
  type: 'task' | 'todo' | 'worklog' | 'achievement' | 'note';
  title: string;
  meta: string | null;
  href: string;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const userId = session.user.id;
  const contains = q;
  const mode = 'insensitive' as const;

  const [tasks, todos, workLogs, achievements, notes] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { title: { contains, mode } },
          { description: { contains, mode } },
        ],
      },
      select: { id: true, title: true, status: true },
      take: 5,
    }),
    prisma.todoItem.findMany({
      where: { userId, title: { contains, mode } },
      select: { id: true, title: true, isDone: true },
      take: 5,
    }),
    prisma.workLog.findMany({
      where: {
        userId,
        OR: [
          { description: { contains, mode } },
          { outcome: { contains, mode } },
        ],
      },
      select: { id: true, description: true, date: true },
      take: 5,
    }),
    prisma.achievement.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { title: { contains, mode } },
          { description: { contains, mode } },
        ],
      },
      select: { id: true, title: true, category: true },
      take: 5,
    }),
    prisma.note.findMany({
      where: { userId, deletedAt: null, title: { contains, mode } },
      select: { id: true, title: true },
      take: 5,
    }),
  ]);

  const results: SearchResultItem[] = [
    ...tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      meta: t.status.replace(/_/g, ' '),
      href: `/tasks/${t.id}`,
    })),
    ...todos.map((t) => ({
      id: t.id,
      type: 'todo' as const,
      title: t.title,
      meta: t.isDone ? 'Done' : 'Pending',
      href: '/todo',
    })),
    ...workLogs.map((w) => ({
      id: w.id,
      type: 'worklog' as const,
      title: w.description.length > 80 ? `${w.description.slice(0, 80)}…` : w.description,
      meta: new Date(w.date).toLocaleDateString(),
      href: '/work-logs',
    })),
    ...achievements.map((a) => ({
      id: a.id,
      type: 'achievement' as const,
      title: a.title,
      meta: a.category,
      href: `/achievements/${a.id}`,
    })),
    ...notes.map((n) => ({
      id: n.id,
      type: 'note' as const,
      title: n.title ?? 'Untitled',
      meta: null,
      href: `/notes/${n.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
