import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Note, X } from './icons';

const KEY = 'clutch.notes.v1';
const POS_KEY = 'clutch.notes.pos.v1';
const SIZE = 56;

function clampPos(p: { x: number; y: number }) {
  const m = 8;
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const h = typeof window !== 'undefined' ? window.innerHeight : 768;
  return {
    x: Math.min(Math.max(m, p.x), w - SIZE - m),
    y: Math.min(Math.max(m, p.y), h - SIZE - m),
  };
}

export function NotesWidget({
  onCapture,
  focusActive,
}: {
  onCapture?: (text: string) => void;
  focusActive?: boolean;
}) {
  const [open, setOpen] = useState(false); // mounted
  const [shown, setShown] = useState(false); // animated in
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(KEY) || '';
    } catch {
      return '';
    }
  });
  const [pos, setPos] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (s && typeof s.x === 'number') return clampPos(s);
    } catch {
      /* noop */
    }
    return typeof window !== 'undefined'
      ? { x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 16 }
      : { x: 0, y: 0 };
  });
  const drag = useRef<{ sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, notes);
    } catch {
      /* noop */
    }
  }, [notes]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onMq = () => setIsMobile(mq.matches);
    const onResize = () => setPos((p) => clampPos(p));
    mq.addEventListener('change', onMq);
    window.addEventListener('resize', onResize);
    return () => {
      mq.removeEventListener('change', onMq);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const openPanel = () => {
    setOpen(true);
    requestAnimationFrame(() => setShown(true));
  };
  const closePanel = () => {
    setShown(false);
    window.setTimeout(() => setOpen(false), 200);
  };
  const togglePanel = () => (open ? closePanel() : openPanel());

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, bx: pos.x, by: pos.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
    if (drag.current.moved) setPos(clampPos({ x: drag.current.bx + dx, y: drag.current.by + dy }));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(pos));
      } catch {
        /* noop */
      }
    } else {
      togglePanel();
    }
  };

  const fabIcon = (
    <>
      {shown ? <X className="h-6 w-6" /> : <Note className="h-6 w-6" />}
      {!shown && notes.trim() && (
        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-paper-50 bg-mint-500" />
      )}
    </>
  );

  const panelCard = (
    <div
      className={`card w-full origin-bottom overflow-hidden p-0 transition-all duration-200 ease-out ${
        shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
            <Note className="h-4 w-4" />
          </span>
          <h3 className="font-display text-sm font-semibold text-ink-900">Quick notes</h3>
        </div>
        <button onClick={closePanel} className="rounded-full p-1 text-ink-500 hover:text-ink-900" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot anything down — it's saved automatically…"
        className="h-44 w-full resize-none bg-transparent px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500/70 outline-none sm:h-48"
        autoFocus
      />

      <div className="flex items-center justify-between gap-2 border-t border-ink-900/[0.06] px-3 py-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
          <Check className="h-3 w-3 text-mint-600" /> Auto-saved
        </span>
        <div className="flex items-center gap-1.5">
          {notes.trim() && (
            <button onClick={() => setNotes('')} className="btn-ghost !px-2.5 !py-1 !text-[11px]">
              Clear
            </button>
          )}
          {onCapture && notes.trim() && (
            <button
              onClick={() => {
                onCapture(notes.trim());
                closePanel();
              }}
              className="btn-primary !px-2.5 !py-1 !text-[11px]"
              title="Turn these notes into tasks"
            >
              Capture as tasks <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ---- Mobile: a clean bottom sheet + a fixed FAB (no dragging) ----
  if (isMobile) {
    return (
      <>
        {open && (
          <>
            <div
              onClick={closePanel}
              className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 print:hidden ${
                shown ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="fixed inset-x-3 bottom-[5.5rem] z-40 mx-auto max-w-sm print:hidden">{panelCard}</div>
          </>
        )}
        <button
          onClick={togglePanel}
          aria-label="Quick notes"
          className={`fixed bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-paper-50 shadow-glow transition-all duration-300 active:scale-95 print:hidden ${
            focusActive && !open ? 'left-4' : 'right-4'
          }`}
        >
          {fabIcon}
        </button>
      </>
    );
  }

  // ---- Desktop: draggable floating button with an anchored card ----
  const onRight = pos.x + SIZE / 2 > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const shiftX =
    focusActive && !open && typeof window !== 'undefined' && pos.x > window.innerWidth / 2 && pos.y > window.innerHeight / 2
      ? Math.min(0, window.innerWidth - 16 - 260 - SIZE - 14 - pos.x)
      : 0;

  return (
    <div
      className="fixed z-40 transition-transform duration-300 ease-out print:hidden"
      style={{ left: pos.x, top: pos.y, transform: shiftX ? `translateX(${shiftX}px)` : undefined }}
    >
      {open && (
        <div className={`absolute bottom-full mb-3 w-[min(86vw,21rem)] ${onRight ? 'right-0' : 'left-0'}`}>
          {panelCard}
        </div>
      )}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="Quick notes (drag to move)"
        aria-label="Quick notes"
        style={{ touchAction: 'none' }}
        className="relative flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-ink-900 text-paper-50 shadow-glow transition-transform hover:scale-105 active:scale-95 active:cursor-grabbing"
      >
        {fabIcon}
      </button>
    </div>
  );
}
