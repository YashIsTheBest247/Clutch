// Tiny, safe-ish Markdown renderer for agent replies & deliverables.
// Handles headings, bold/italic, inline code, bullet/numbered lists, links.
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code class="rounded bg-glow-500/15 px-1 py-0.5 text-[0.85em] text-glow-500">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-glow-500 underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const sz = ['text-lg', 'text-base', 'text-sm', 'text-sm'][h[1].length - 1];
      html.push(`<p class="${sz} font-bold mt-2 mb-1">${inline(h[2])}</p>`);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ul) {
      if (list !== 'ul') {
        closeList();
        list = 'ul';
        html.push('<ul class="list-disc pl-5 space-y-1 my-1">');
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      if (list !== 'ol') {
        closeList();
        list = 'ol';
        html.push('<ol class="list-decimal pl-5 space-y-1 my-1">');
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p class="my-1">${inline(line)}</p>`);
  }
  closeList();
  return <div className={`leading-relaxed ${className}`} dangerouslySetInnerHTML={{ __html: html.join('') }} />;
}
