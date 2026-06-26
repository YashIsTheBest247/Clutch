import { useEffect, useRef, useState } from 'react';
import type { Task } from '../types';
import { fireConfetti } from '../lib/confetti';
import { Check, Pause, Play, X } from './icons';

const DEFAULT_MINS = 25;

export function FocusTimer({
  task,
  onClose,
  onComplete,
}: {
  task: Task;
  onClose: () => void;
  onComplete: (focusedMins: number) => void;
}) {
  const total = DEFAULT_MINS * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (!running || finished) return;
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(tick.current!);
          setFinished(true);
          setRunning(false);
          fireConfetti(window.innerWidth - 130, window.innerHeight - 150);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running, finished]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = 1 - remaining / total;
  const focusedMins = Math.max(1, Math.round((total - remaining) / 60));
  const R = 34;
  const C = 2 * Math.PI * R;

  const restart = () => {
    setRemaining(total);
    setFinished(false);
    setRunning(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[260px] animate-fade-up rounded-3xl border border-white/[0.06] bg-ink-900 p-4 text-paper-100 shadow-panel">
      <div className="mb-2 flex items-center justify-between">
        <span className="label text-paper-50/70">Focus session</span>
        <button onClick={onClose} className="rounded-full p-1 text-paper-400 hover:text-paper-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 truncate text-sm font-semibold text-paper-100" title={task.title}>
        {task.title}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative h-[84px] w-[84px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="#ff8a4d"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold tabular-nums">
            {finished ? '✓' : `${mins}:${String(secs).padStart(2, '0')}`}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          {finished ? (
            <>
              <p className="text-xs text-paper-300">Session complete — nice work.</p>
              <button
                onClick={() => {
                  onComplete(focusedMins);
                  onClose();
                }}
                className="btn-primary w-full !py-1.5 !text-xs"
              >
                <Check className="h-3.5 w-3.5" /> Mark done
              </button>
              <button onClick={restart} className="btn w-full border border-white/20 text-paper-100 hover:border-white/50 !py-1.5 !text-xs">
                Another 25
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRunning((r) => !r)}
                className="btn-primary w-full !py-1.5 !text-xs"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => {
                  onComplete(focusedMins);
                  onClose();
                }}
                className="btn w-full border border-white/20 text-paper-100 hover:border-white/50 !py-1.5 !text-xs"
              >
                <Check className="h-3.5 w-3.5" /> Done now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
