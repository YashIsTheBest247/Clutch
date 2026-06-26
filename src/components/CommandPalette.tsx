import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

export interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: ReactElement;
  run: () => void;
  disabled?: boolean;
}

export function CommandPalette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = commands.filter((c) => !c.disabled);
    if (!q) return list;
    return list.filter((c) => `${c.label} ${c.hint ?? ''}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setActive(0);
  }, [query]);

  const choose = (c?: Command) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="card w-full max-w-lg animate-fade-up overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            choose(filtered[active]);
          } else if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command…  (Plan, Rescue, Briefing, Calendar, Insights…)"
          className="w-full border-b border-ink-900/[0.06] bg-transparent px-4 py-3.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {filtered.length === 0 && <li className="px-3 py-6 text-center text-xs text-ink-500">No commands match.</li>}
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  i === active ? 'bg-stone-100 text-ink-900' : 'text-ink-700 hover:bg-stone-50'
                }`}
              >
                <span className="text-ink-500">{c.icon}</span>
                <span className="flex-1">{c.label}</span>
                {c.hint && <span className="text-[11px] text-ink-400">{c.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 border-t border-ink-900/[0.06] px-4 py-2 text-[11px] text-ink-400">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
