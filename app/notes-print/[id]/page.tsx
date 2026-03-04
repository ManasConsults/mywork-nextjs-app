import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';

import { authOptions } from '@/lib/auth/auth';
import { getNoteById, noteDisplayTitle } from '@/lib/services/note.service';
import { AutoPrint } from './_components/AutoPrint';
import { CloseButton } from './_components/CloseButton';

export const metadata: Metadata = { title: 'MyWork — Note (Print)' };

interface NotePrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePrintPage({ params }: NotePrintPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const note = await getNoteById(userId, id);
  if (!note) notFound();

  const html = generateHTML(note.body as Parameters<typeof generateHTML>[0], [
    StarterKit,
    LinkExtension,
  ]);

  const title = noteDisplayTitle(note);

  return (
    <>
      <AutoPrint />
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 13px;
          line-height: 1.7;
          color: #111;
          background: #fff;
          padding: 32px 40px;
          max-width: 780px;
          margin: 0 auto;
        }
        h1.note-title { font-size: 22px; margin: 0 0 6px; }
        .meta { font-size: 12px; color: #555; margin-bottom: 24px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .tag { background: #e6f7f6; color: #0d7d6e; padding: 1px 8px; border-radius: 10px; font-size: 11px; }
        .body-content h1 { font-size: 18px; font-weight: bold; margin: 16px 0 6px; }
        .body-content h2 { font-size: 15px; font-weight: bold; margin: 14px 0 5px; }
        .body-content h3 { font-size: 13px; font-weight: bold; margin: 12px 0 4px; }
        .body-content p { margin: 0 0 8px; }
        .body-content ul { list-style: disc; padding-left: 1.5em; margin: 0 0 8px; }
        .body-content ol { list-style: decimal; padding-left: 1.5em; margin: 0 0 8px; }
        .body-content li { margin-bottom: 2px; }
        .body-content blockquote { border-left: 3px solid #ccc; margin: 8px 0; padding: 4px 12px; color: #555; font-style: italic; }
        .body-content code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 12px; }
        .body-content pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow: auto; font-family: 'Courier New', monospace; font-size: 12px; margin: 8px 0; }
        .body-content a { color: #0d7d6e; text-decoration: underline; }
        .body-content strong { font-weight: bold; }
        .body-content em { font-style: italic; }
        .body-content s { text-decoration: line-through; }
      `}</style>

      <CloseButton />

      <h1 className="note-title">{title}</h1>

      <div className="meta">
        {note.tags.length > 0 &&
          note.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        {note.task && (
          <span>Linked task: {note.task.title}</span>
        )}
        <span>
          Last updated:{' '}
          {new Date(note.updatedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* dangerouslySetInnerHTML is intentional: HTML is generated server-side from trusted
          Tiptap JSON stored in the database. Only the authenticated note owner can access
          this page. Tiptap's generateHTML does not allow script injection from JSON. */}
      <div className="body-content" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
