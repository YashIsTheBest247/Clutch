import { useState } from 'react';
import type { Task } from '../types';
import { Markdown } from './Markdown';
import { Check, Copy, Send, X } from './icons';

export function DeliverableModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const d = task.deliverable;
  if (!d) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(d.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card max-h-[85vh] w-full max-w-2xl animate-fade-up overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
          <div>
            <span className="chip border border-ink-900/10 bg-stone-100 text-ink-700">{d.kind}</span>
            <h3 className="mt-1 font-display text-sm font-semibold text-ink-900">{d.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {d.kind === 'email' && (
              <a
                href={`mailto:?subject=${encodeURIComponent(d.title)}&body=${encodeURIComponent(d.content)}`}
                className="btn-primary !py-1.5 !text-xs"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </a>
            )}
            <button onClick={copy} className="btn-ghost !py-1.5 !text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-glow-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onClose} className="btn-ghost !px-2.5 !py-1.5">
              <X />
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 text-sm text-ink-800">
          <Markdown text={d.content} />
        </div>
      </div>
    </div>
  );
}
