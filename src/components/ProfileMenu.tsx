import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { UserProfile } from '../types';
import { Chart, Gear, Info, Trash } from './icons';

function Item({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactElement;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
        danger ? 'text-signal-red hover:bg-signal-red/10' : 'text-ink-800 hover:bg-stone-100'
      }`}
    >
      <span className={danger ? 'text-signal-red' : 'text-ink-500'}>{icon}</span>
      {label}
    </button>
  );
}

export function ProfileMenu({
  profile,
  children,
  onProfile,
  onInsights,
  onAbout,
  onReset,
}: {
  profile: UserProfile;
  children: ReactElement; // the avatar trigger
  onProfile: () => void;
  onInsights: () => void;
  onAbout: () => void;
  onReset: () => void;
}) {
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

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} title="Profile & settings" aria-label="Open profile menu">
        {children}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 animate-fade-up rounded-2xl border border-ink-900/[0.06] bg-paper-50 p-1.5 shadow-panel">
          <div className="px-3 py-2">
            <p className="font-display text-sm font-semibold text-ink-900">{profile.name}</p>
            <p className="text-[11px] text-ink-500">{profile.role}</p>
          </div>
          <div className="my-1 h-px bg-ink-900/[0.06]" />
          <Item icon={<Gear className="h-4 w-4" />} label="Profile & preferences" onClick={act(onProfile)} />
          <Item icon={<Chart className="h-4 w-4" />} label="Insights" onClick={act(onInsights)} />
          <Item icon={<Info className="h-4 w-4" />} label="About Clutch" onClick={act(onAbout)} />
          <div className="my-1 h-px bg-ink-900/[0.06]" />
          <Item icon={<Trash className="h-4 w-4" />} label="Reset everything" danger onClick={act(onReset)} />
        </div>
      )}
    </div>
  );
}
