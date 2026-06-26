import { useEffect, useRef, useState } from 'react';

export interface Option {
  value: string;
  label: string;
}

/** Compact, fully theme-styled dropdown (replaces native <select>). Opens upward
 * so it isn't covered by the next card in a list. */
export function ThemedSelect({
  value,
  options,
  onChange,
  title,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

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
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-ink-900/15 bg-paper-50 px-2.5 py-1.5 text-[11px] text-ink-700 transition-colors hover:border-ink-900/40"
      >
        <span className="max-w-[120px] truncate">{current?.label}</span>
        <span className={`text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-1.5 min-w-[150px] animate-fade-up overflow-hidden rounded-2xl border border-ink-900/[0.08] bg-paper-50 p-1.5 shadow-panel">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full truncate rounded-xl px-3 py-1.5 text-left text-xs transition-colors ${
                o.value === value ? 'bg-mint-100 font-semibold text-mint-700' : 'text-ink-800 hover:bg-stone-100'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
