import { useState } from 'react';

const R = 40; // clock radius as % of the face

function pos(n: number) {
  const ang = ((n * 30 - 90) * Math.PI) / 180;
  return { x: 50 + R * Math.cos(ang), y: 50 + R * Math.sin(ang) };
}
const NUMS = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return { n, ...pos(n) };
});

function to24(h12: number, period: 'AM' | 'PM') {
  const base = h12 % 12;
  return period === 'AM' ? base : base + 12;
}

export function ClockPicker({
  value,
  onChange,
  onClose,
}: {
  value: number;
  onChange: (hour: number) => void;
  onClose: () => void;
}) {
  const [h12, setH12] = useState(value % 12 === 0 ? 12 : value % 12);
  const [period, setPeriod] = useState<'AM' | 'PM'>(value < 12 ? 'AM' : 'PM');
  const sel = pos(h12);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-[20rem] animate-fade-up p-5" onClick={(e) => e.stopPropagation()}>
        {/* readout + AM/PM */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="font-display text-4xl font-bold tabular-nums text-ink-900">
            {h12}
            <span className="text-ink-400">:00</span>
          </span>
          <div className="flex flex-col gap-1">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  period === p ? 'bg-mint-100 text-mint-700' : 'text-ink-400 hover:bg-stone-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* clock face */}
        <div className="relative mx-auto aspect-square w-[260px] max-w-[78vw] rounded-full bg-stone-100">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-mint-500">
            <line x1="50" y1="50" x2={sel.x} y2={sel.y} stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="2.4" fill="currentColor" />
          </svg>
          {NUMS.map(({ n, x, y }) => {
            const active = n === h12;
            return (
              <button
                key={n}
                onClick={() => setH12(n)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  active ? 'bg-mint-500 text-white' : 'text-ink-800 hover:bg-stone-200'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-ghost !text-xs">
            Cancel
          </button>
          <button
            onClick={() => {
              onChange(to24(h12, period));
              onClose();
            }}
            className="btn-primary !text-xs"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
