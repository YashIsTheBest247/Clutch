import { useEffect, useRef, useState } from 'react';
import { formatDeadline } from '../lib/scheduler';
import { Clock } from './icons';

const toneClass: Record<string, string> = {
  red: 'text-signal-red',
  amber: 'text-signal-amber',
  green: 'text-mint-600',
  muted: 'text-ink-400',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function DeadlineEditor({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dl = formatDeadline(value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Set deadline"
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors hover:bg-ink-900/[0.06] ${toneClass[dl.tone]}`}
      >
        <Clock className="h-3.5 w-3.5" /> {dl.label}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-64 animate-fade-up rounded-2xl border border-ink-900/[0.08] bg-paper-50 p-3 shadow-panel">
          <p className="label mb-1.5 text-ink-600">Deadline</p>
          <input
            type="datetime-local"
            value={toLocalInput(value)}
            onChange={(e) => onChange(fromLocalInput(e.target.value))}
            className="input !py-2 !text-xs"
          />
          <div className="mt-2.5 flex items-center justify-between">
            <button
              onClick={() => onChange(undefined)}
              className="text-[11px] font-semibold text-signal-red hover:underline"
            >
              Clear deadline
            </button>
            <button onClick={() => setOpen(false)} className="btn-primary !px-3 !py-1 !text-[11px]">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
