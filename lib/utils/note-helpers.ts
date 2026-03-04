/**
 * Pure client-safe helpers for Note display.
 * No Prisma imports — safe to use in 'use client' components.
 */

type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
};

export function extractNoteText(body: unknown): string {
  const node = body as TiptapNode;
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(extractNoteText).join('');
}

export function noteDisplayTitle(note: { title?: string | null; body: unknown }): string {
  if (note.title) return note.title;
  const text = extractNoteText(note.body).trim();
  return text.slice(0, 60) || 'Untitled';
}

export function noteBodyPreview(note: { body: unknown }, maxChars = 120): string {
  return extractNoteText(note.body).trim().slice(0, maxChars);
}
