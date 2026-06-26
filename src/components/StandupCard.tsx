import { ArrowUpRight, Calendar, Check, Lifebuoy, Play, Sparkle, Sun, X } from './icons';

/**
 * Proactive daily standup — appears once per day when you open Clutch.
 * The opposite of a passive reminder: the app reaches out with the state of
 * play and the single next move, then offers to plan or narrate it aloud.
 */
export function StandupCard({
  name,
  greeting,
  dueToday,
  slipping,
  overdue,
  firstBlock,
  topTask,
  onTrack,
  forecastTotal,
  thinking,
  onPlan,
  onBrief,
  onDismiss,
}: {
  name: string;
  greeting: string;
  dueToday: number;
  slipping: number;
  overdue: number;
  firstBlock?: string;
  topTask?: string;
  onTrack: number;
  forecastTotal: number;
  thinking: boolean;
  onPlan: () => void;
  onBrief: () => void;
  onDismiss: () => void;
}) {
  const Pill = ({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: 'ink' | 'red' | 'mint' }) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        tone === 'red'
          ? 'bg-signal-red/12 text-signal-red'
          : tone === 'mint'
            ? 'bg-mint-100 text-mint-700'
            : 'bg-paper-50 text-ink-700 border border-ink-900/10'
      }`}
    >
      {icon}
      {label}
    </span>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-900/[0.06] bg-gradient-to-br from-butter-100/70 via-paper-50 to-sky-100/50 p-5 shadow-soft">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-butter-200/40 blur-3xl" />
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
        aria-label="Dismiss standup"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-butter-100 text-butter-700">
            <Sun className="h-4 w-4" />
          </span>
          <span className="label text-ink-500">Your daily standup</span>
        </div>

        <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink-900 sm:text-xl">
          {greeting}, {name}. Here's where things stand.
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {overdue > 0 && <Pill tone="red" icon={<Lifebuoy className="h-3.5 w-3.5" />} label={`${overdue} overdue`} />}
          <Pill tone={dueToday > 0 ? 'ink' : 'mint'} icon={<Calendar className="h-3.5 w-3.5" />} label={`${dueToday} due today`} />
          {slipping > 0 && <Pill tone="red" icon={<ArrowUpRight className="h-3.5 w-3.5" />} label={`${slipping} slipping`} />}
          {forecastTotal > 0 && (
            <Pill tone="mint" icon={<Check className="h-3.5 w-3.5" />} label={`${onTrack}/${forecastTotal} on track`} />
          )}
          {firstBlock && <Pill tone="ink" icon={<Play className="h-3.5 w-3.5" />} label={`First focus ${firstBlock}`} />}
        </div>

        {topTask && (
          <p className="mt-3 text-sm text-ink-700">
            <span className="font-semibold text-ink-900">Start with:</span> {topTask}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={onPlan} disabled={thinking} className="btn-primary !py-2 !text-xs">
            <Sparkle className="h-3.5 w-3.5" /> Plan my day
          </button>
          <button onClick={onBrief} disabled={thinking} className="btn-ghost !py-2 !text-xs">
            <Play className="h-3.5 w-3.5" /> Hear the briefing
          </button>
        </div>
      </div>
    </div>
  );
}
