import { useEffect, useState } from 'react';

interface Step {
  sel: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  { sel: '[data-tour="profile"]', title: 'Your account', body: 'Sign in with Google or set up your profile here to personalize your plan.' },
  { sel: '[data-tour="controls"]', title: 'Quick controls', body: 'Reminders, voice replies, hands-free conversation, and your spoken daily briefing all live here.' },
  { sel: '[data-tour="rescue"]', title: 'Rescue Mode', body: "Overwhelmed? One tap triages everything into the 3 things to do right now." },
  { sel: '[data-tour="palette"]', title: 'Command palette', body: 'Press ⌘K (Ctrl+K) anytime to run any action instantly.' },
  { sel: '[data-tour="notes"]', title: 'Quick Notes', body: 'A floating scratchpad — jot anything down, it auto-saves, and can turn into tasks in one tap.' },
  { sel: '[data-tour="autopilot"]', title: 'Autopilot', body: 'Dump everything — type, paste, drop a photo or PDF — then hit Autopilot and Clutch captures, researches, prioritizes, schedules, and drafts it all in one shot.' },
];

type Rect = { top: number; left: number; width: number; height: number };

/** Is a tour target currently rendered and visible (not a desktop-only control on mobile)? */
function isVisible(sel: string): boolean {
  const el = document.querySelector(sel) as HTMLElement | null;
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function Tour({ onFinish }: { onFinish: () => void }) {
  // Resolve which steps apply to this viewport AFTER mount — querying during the
  // first render reads an un-committed DOM (everything 0×0) and would wrongly end
  // the tour. Numbering stays continuous (1…N), skipping only truly hidden steps.
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps ? steps[i] : undefined;
  const last = !!steps && i === steps.length - 1;

  useEffect(() => {
    // One frame lets layout settle on a hard refresh before we measure.
    const id = requestAnimationFrame(() => {
      const visible = STEPS.filter((s) => isVisible(s.sel));
      if (visible.length) setSteps(visible);
      else onFinish();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!steps) return;
    if (!step) {
      onFinish();
      return;
    }
    const find = () => document.querySelector(step.sel) as HTMLElement | null;
    const el = find();
    const r = el?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) {
      // target vanished mid-tour → skip it
      if (last) onFinish();
      else setI((p) => p + 1);
      return;
    }
    // If the target is off-screen, scroll it into view (sticky/fixed bars stay put).
    if (el && (r.top < 0 || r.bottom > window.innerHeight)) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const update = () => {
      const rr = find()?.getBoundingClientRect();
      if (rr && rr.width) setRect({ top: rr.top, left: rr.left, width: rr.width, height: rr.height });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, steps]);

  if (!steps || !step || !rect) return null;

  const boxW = 264;
  const pad = 14;
  const below = rect.top < window.innerHeight / 2;
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - boxW / 2), window.innerWidth - boxW - 8);
  const vStyle: React.CSSProperties = below
    ? { top: rect.top + rect.height + pad }
    : { bottom: window.innerHeight - rect.top + pad };
  // caret horizontal offset within the box, pointing at the target center
  const caretLeft = Math.min(Math.max(16, rect.left + rect.width / 2 - left), boxW - 16);

  return (
    <div className="pointer-events-none fixed inset-0 z-[55]">
      {/* spotlight */}
      <div
        className="absolute rounded-2xl ring-2 ring-mint-400 transition-all duration-300"
        style={{
          left: rect.left - 6,
          top: rect.top - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          boxShadow: '0 0 0 9999px rgba(8, 12, 10, 0.55)',
        }}
      />

      {/* tooltip */}
      <div
        className="pointer-events-auto fixed w-[264px] max-w-[82vw] animate-fade-up rounded-2xl border border-ink-900/[0.06] bg-paper-50 p-4 shadow-panel"
        style={{ left, ...vStyle }}
      >
        {/* caret */}
        <span
          className="absolute h-3 w-3 rotate-45 border-ink-900/[0.06] bg-paper-50"
          style={
            below
              ? { top: -6, left: caretLeft, borderTopWidth: 1, borderLeftWidth: 1 }
              : { bottom: -6, left: caretLeft, borderBottomWidth: 1, borderRightWidth: 1 }
          }
        />

        <div className="flex items-center justify-between">
          <span className="chip bg-mint-100 text-mint-700">Step {i + 1} of {steps.length}</span>
          <button onClick={onFinish} className="text-[11px] font-medium text-ink-500 transition-colors hover:text-ink-900">
            Skip tutorial
          </button>
        </div>

        <h3 className="mt-2.5 font-display text-sm font-semibold text-ink-900">{step.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">{step.body}</p>

        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-mint-500' : 'w-1.5 bg-ink-900/15'}`} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="btn-ghost !px-2.5 !py-1 !text-xs">
                Back
              </button>
            )}
            <button onClick={() => (last ? onFinish() : setI(i + 1))} className="btn-primary !px-3 !py-1 !text-xs">
              {last ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
