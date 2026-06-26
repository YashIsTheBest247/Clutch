import type { Toast } from '../lib/useToasts';
import { X } from './icons';

export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-fade-up items-center gap-3 rounded-2xl bg-ink-900 px-4 py-2.5 text-xs text-paper-50 shadow-panel"
        >
          <span className="flex-1">{t.message}</span>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction!();
                onDismiss(t.id);
              }}
              className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 font-semibold uppercase tracking-wide transition-colors hover:bg-white/25"
            >
              {t.actionLabel}
            </button>
          )}
          <button onClick={() => onDismiss(t.id)} className="shrink-0 text-paper-400 hover:text-paper-50" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
