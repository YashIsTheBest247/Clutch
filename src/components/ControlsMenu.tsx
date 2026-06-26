import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Sliders } from './icons';

export interface Control {
  id: string;
  icon: ReactElement;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ControlsMenu({ items }: { items: Control[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const anyActive = items.some((i) => i.active);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Voice, reminders & more"
        aria-label="Controls"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 hover:scale-105 active:scale-95 ${
          anyActive
            ? 'border-transparent bg-ink-900 text-paper-50'
            : 'border-ink-900/15 bg-paper-50 text-ink-900 hover:border-ink-900/40 hover:bg-stone-100'
        }`}
      >
        <Sliders className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 animate-fade-up rounded-2xl border border-ink-900/[0.06] bg-paper-50 p-1.5 shadow-panel">
          <p className="px-3 py-1.5 label text-ink-500">Quick controls</p>
          {items.map((it) => (
            <button
              key={it.id}
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                if (!it.active) setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-800 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className={it.active ? 'text-mint-600' : 'text-ink-500'}>{it.icon}</span>
              <span className="flex-1">{it.label}</span>
              {it.active && (
                <span className="chip bg-mint-100 text-mint-700">On</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
