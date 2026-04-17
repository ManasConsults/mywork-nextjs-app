'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';

import { createNoteAction, updateNoteAction, saveDraftAction } from '@/lib/actions/note';
import { cn } from '@/lib/utils';

const AUTOSAVE_INTERVAL_MS = 30_000;

interface TaskOption {
  id: string;
  title: string;
}

interface NoteEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialBody?: Record<string, unknown>;
  initialTags?: string[];
  initialTaskId?: string;
  tasks: TaskOption[];
  updatedAt?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ToolbarButtonProps {
  label: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ label, title, isActive, onClick, disabled = false }: ToolbarButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded px-2 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}

export function NoteEditor({
  noteId,
  initialTitle = '',
  initialBody,
  initialTags = [],
  initialTaskId,
  tasks,
  updatedAt,
}: NoteEditorProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [, startAutoSaveTransition] = useTransition();

  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [taskId, setTaskId] = useState(initialTaskId ?? '');
  const [rootError, setRootError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Tracks whether the cursor is inside a table cell — updated on every selection
  // change so toolbar buttons enable/disable reactively.
  const [inTable, setInTable] = useState(false);

  const bodyRef = useRef<Record<string, unknown>>(
    initialBody ?? { type: 'doc', content: [] },
  );

  const editor = useEditor({
    extensions: [
      // StarterKit v3 bundles link — disable it so our custom LinkExtension doesn't duplicate
      StarterKit.configure({ link: false }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing… (markdown shortcuts supported)' }),
      Markdown.configure({ html: false, transformPastedText: true }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: initialBody,
    onUpdate({ editor: e }) {
      // JSON.parse/stringify strips undefined attrs (e.g. `tight: undefined` from
      // tiptap-markdown list items). React's flight protocol cannot serialize undefined
      // and would produce a "temporary client reference" error on the server.
      bodyRef.current = JSON.parse(JSON.stringify(e.getJSON())) as Record<string, unknown>;
    },
    onSelectionUpdate({ editor: e }) {
      setInTable(e.isActive('tableCell') || e.isActive('tableHeader'));
    },
    immediatelyRender: false,
  });

  // Auto-save every 30s — only when editing an existing note
  useEffect(() => {
    if (!noteId) return;
    const interval = setInterval(() => {
      startAutoSaveTransition(async () => {
        const result = await saveDraftAction(noteId, bodyRef.current);
        if (result.success) setLastSavedAt(new Date());
      });
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [noteId]);

  function addTagFromInput(raw: string) {
    const newTags = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (newTags.length > 0) setTags((prev) => [...prev, ...newTags]);
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput(tagInput);
    }
  }

  function handleTagBlur() {
    if (tagInput.trim()) addTagFromInput(tagInput);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSave() {
    setRootError(null);
    const body = bodyRef.current;
    const input = {
      title: title || null,
      body,
      tags,
      taskId: taskId || null,
    };

    startTransition(async () => {
      if (noteId) {
        const result = await updateNoteAction(noteId, input);
        if (!result.success) {
          setRootError(result.error.message);
          return;
        }
        setLastSavedAt(new Date());
      } else {
        const result = await createNoteAction(input);
        if (!result.success) {
          setRootError(result.error.message);
          return;
        }
        router.push(`/notes/${result.data.id}`);
      }
    });
  }

  function handleAddLink() {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  function handleDownloadMarkdown() {
    if (!editor) return;
    const markdownExt = (editor.storage as unknown as Record<string, { getMarkdown(): string }>)['markdown'];
    const markdown = markdownExt?.getMarkdown() ?? '';
    const header = title ? `# ${title}\n\n` : '';
    const blob = new Blob([header + markdown], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const lastSavedLabel = lastSavedAt
    ? `Last saved ${formatTime(lastSavedAt)}`
    : updatedAt
      ? `Last saved ${formatTime(new Date(updatedAt))}`
      : null;

  return (
    <div className="space-y-4">
      {/* Scoped table styles for the ProseMirror editor.
          Placed here (not globals.css) so they win over Tailwind preflight's
          border-width:0 reset regardless of stylesheet load order. */}
      <style>{`
        .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0.75rem 0;
          overflow: hidden;
        }
        .tiptap td,
        .tiptap th {
          border: 1px solid #c8d0d0;
          padding: 0.375rem 0.625rem;
          vertical-align: top;
          position: relative;
          box-sizing: border-box;
          min-width: 80px;
        }
        .dark .tiptap td,
        .dark .tiptap th {
          border-color: rgba(255,255,255,0.2);
        }
        .tiptap th {
          background: rgba(0,0,0,0.04);
          font-weight: 600;
          text-align: left;
        }
        .dark .tiptap th {
          background: rgba(255,255,255,0.06);
        }
        .tiptap .selectedCell::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--primary, #0891b2);
          opacity: 0.12;
          pointer-events: none;
          z-index: 2;
        }
        .tiptap .tableWrapper {
          overflow-x: auto;
        }
        .tiptap .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--primary, #0891b2);
          opacity: 0.5;
          pointer-events: none;
          z-index: 20;
        }
      `}</style>
      {rootError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title (optional)"
        maxLength={200}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Task + Tags row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">No linked task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        {/* Tag chips + input */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 leading-none text-primary hover:text-primary"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleTagBlur}
            placeholder={tags.length === 0 ? 'Add tags…' : ''}
            className="min-w-20 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Editor toolbar */}
      <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-border bg-accent/40 px-2 py-1">
        <ToolbarButton
          label="B"
          title="Bold"
          isActive={editor?.isActive('bold') ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          title="Italic"
          isActive={editor?.isActive('italic') ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="S"
          title="Strikethrough"
          isActive={editor?.isActive('strike') ?? false}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          label="<>"
          title="Inline code"
          isActive={editor?.isActive('code') ?? false}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        />
        <span className="mx-1 border-l border-border" />
        <ToolbarButton
          label="H2"
          title="Heading 2"
          isActive={editor?.isActive('heading', { level: 2 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          title="Heading 3"
          isActive={editor?.isActive('heading', { level: 3 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <span className="mx-1 border-l border-border" />
        <ToolbarButton
          label="• —"
          title="Bullet list"
          isActive={editor?.isActive('bulletList') ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1."
          title="Ordered list"
          isActive={editor?.isActive('orderedList') ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="❝"
          title="Blockquote"
          isActive={editor?.isActive('blockquote') ?? false}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        />
        <span className="mx-1 border-l border-border" />
        <ToolbarButton
          label="🔗"
          title="Insert link"
          isActive={editor?.isActive('link') ?? false}
          onClick={handleAddLink}
        />
        <span className="mx-1 border-l border-border" />
        <ToolbarButton
          label="⊞ Table"
          title="Insert table"
          isActive={false}
          onClick={() =>
            editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        />
        <span className="mx-1 border-l border-border" />
        <ToolbarButton
          label="+Row"
          title="Add row below"
          isActive={false}
          disabled={!inTable}
          onClick={() => editor?.chain().focus().addRowAfter().run()}
        />
        <ToolbarButton
          label="−Row"
          title="Delete row"
          isActive={false}
          disabled={!inTable}
          onClick={() => editor?.chain().focus().deleteRow().run()}
        />
        <ToolbarButton
          label="+Col"
          title="Add column after"
          isActive={false}
          disabled={!inTable}
          onClick={() => editor?.chain().focus().addColumnAfter().run()}
        />
        <ToolbarButton
          label="−Col"
          title="Delete column"
          isActive={false}
          disabled={!inTable}
          onClick={() => editor?.chain().focus().deleteColumn().run()}
        />
        <ToolbarButton
          label="Del Table"
          title="Delete table"
          isActive={false}
          disabled={!inTable}
          onClick={() => editor?.chain().focus().deleteTable().run()}
        />
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="min-h-80 rounded-b-md border border-border bg-card px-4 py-3 text-sm text-foreground focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 [&_.ProseMirror]:min-h-70 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-xs [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline"
      />

      {/* Footer: last saved + actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {lastSavedLabel ?? (noteId ? 'Not saved yet' : '')}
        </span>
        <div className="flex items-center gap-3">
          {noteId && (
            <button
              type="button"
              onClick={() => window.open(`/notes-print/${noteId}`, '_blank')}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Print PDF
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Download .md
          </button>
          <button
            type="button"
            onClick={() => router.push(noteId ? `/notes/${noteId}` : '/notes')}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            {noteId ? 'View note' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : noteId ? 'Save changes' : 'Create note'}
          </button>
        </div>
      </div>
    </div>
  );
}
