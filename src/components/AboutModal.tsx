import { Logo } from './Logo';
import { X } from './icons';

const FEATURES = [
  'Autonomous plan → prioritize → schedule → do',
  'Photo & paste capture (Gemini multimodal)',
  'Live web research (Google Search grounding)',
  'Spoken daily briefing + slippage alerts',
  'Focus timer, streaks & calendar export',
];

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="card w-full max-w-md animate-fade-up p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <Logo markClassName="h-10 w-10 text-ink-900" />
          <button onClick={onClose} className="btn-ghost !px-2.5 !py-1.5">
            <X />
          </button>
        </div>
        <h3 className="font-display text-lg font-semibold text-ink-900">Clutch</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          Your autonomous AI Chief of Staff. Clutch doesn't just remind you — it plans, prioritizes, schedules, and
          does the work so you never miss a deadline.
        </p>

        <ul className="mt-4 space-y-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-ink-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" />
              {f}
            </li>
          ))}
        </ul>

        
      </div>
    </div>
  );
}
