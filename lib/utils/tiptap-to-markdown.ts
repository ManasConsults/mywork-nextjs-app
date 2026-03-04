/**
 * Lightweight server-safe Tiptap JSON → Markdown serializer.
 * Handles all nodes produced by StarterKit + tiptap-markdown + LinkExtension.
 * No Tiptap or ProseMirror imports — safe for RSC and Node.js contexts.
 */

type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TiptapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

function applyMarks(text: string, marks: TiptapMark[] = []): string {
  // Apply marks from innermost to outermost
  return marks.reduce((t, mark) => {
    switch (mark.type) {
      case 'bold':
        return `**${t}**`;
      case 'italic':
        return `*${t}*`;
      case 'code':
        return `\`${t}\``;
      case 'strike':
        return `~~${t}~~`;
      case 'link': {
        const href = String(mark.attrs?.href ?? '');
        return `[${t}](${href})`;
      }
      default:
        return t;
    }
  }, text);
}

function serializeNode(node: TiptapNode, listPrefix = ''): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => serializeNode(n)).join('');

    case 'paragraph': {
      const inner = (node.content ?? []).map((n) => serializeNode(n)).join('');
      return inner ? `${inner}\n\n` : '\n';
    }

    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      const prefix = '#'.repeat(level);
      const inner = (node.content ?? []).map((n) => serializeNode(n)).join('');
      return `${prefix} ${inner}\n\n`;
    }

    case 'text':
      return applyMarks(node.text ?? '', node.marks);

    case 'hardBreak':
      return '  \n'; // two trailing spaces = markdown hard break

    case 'horizontalRule':
      return '---\n\n';

    case 'bulletList':
      return (node.content ?? []).map((n) => serializeNode(n, '- ')).join('') + '\n';

    case 'orderedList':
      return (
        (node.content ?? []).map((n, i) => serializeNode(n, `${i + 1}. `)).join('') + '\n'
      );

    case 'listItem': {
      const inner = (node.content ?? [])
        .map((n) => serializeNode(n))
        .join('')
        .replace(/\n\n$/, '\n'); // collapse trailing double-newline inside list items
      return `${listPrefix}${inner}`;
    }

    case 'blockquote': {
      const inner = (node.content ?? []).map((n) => serializeNode(n)).join('');
      return (
        inner
          .trimEnd()
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n') + '\n\n'
      );
    }

    case 'codeBlock': {
      const lang = node.attrs?.language ? String(node.attrs.language) : '';
      const inner = (node.content ?? []).map((n) => n.text ?? '').join('');
      return `\`\`\`${lang}\n${inner}\n\`\`\`\n\n`;
    }

    default:
      // Unknown node — recurse into children so content is not lost
      return (node.content ?? []).map((n) => serializeNode(n, listPrefix)).join('');
  }
}

/**
 * Converts a Tiptap JSON document (stored as `body` in the DB) to a Markdown string.
 * Optionally prepends a `# title` heading.
 */
export function tiptapJsonToMarkdown(body: unknown, title?: string | null): string {
  const header = title ? `# ${title}\n\n` : '';
  const content = serializeNode(body as TiptapNode).trimEnd();
  return `${header}${content}\n`;
}
