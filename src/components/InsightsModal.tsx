import { useMemo, useState } from 'react';
import type { Habit, Task } from '../types';
import { habitStreak } from '../lib/storage';
import { generateText, hasApiKey } from '../lib/gemini';
import { Chart, Flame, Sparkle, X } from './icons';

const KTINT = {
  mint: { bg: 'bg-mint-100', fg: 'text-mint-700', dim: 'text-mint-700/70' },
  sky: { bg: 'bg-sky-100', fg: 'text-sky-700', dim: 'text-sky-700/70' },
  butter: { bg: 'bg-butter-100', fg: 'text-butter-700', dim: 'text-butter-700/70' },
  lilac: { bg: 'bg-lilac-100', fg: 'text-lilac-700', dim: 'text-lilac-700/70' },
} as const;
const BAR_COLORS = ['bg-mint-500', 'bg-sky-500', 'bg-butter-500', 'bg-lilac-500'];

function KPI({ label, value, sub, tint }: { label: string; value: string; sub?: string; tint: keyof typeof KTINT }) {
  const t = KTINT[tint];
  return (
    <div className={`rounded-2xl border border-black/[0.04] p-3 ${t.bg}`}>
      <p className={`label ${t.dim}`}>{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${t.fg}`}>{value}</p>
      {sub && <p className={`text-[11px] ${t.dim}`}>{sub}</p>}
    </div>
  );
}

export function InsightsModal({
  tasks,
  habits,
  streak,
  calibration,
  onRetro,
  onClose,
}: {
  tasks: Task[];
  habits: Habit[];
  streak: number;
  calibration?: { factor: number; samples: number };
  onRetro?: () => void;
  onClose: () => void;
}) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const m = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const openTasks = tasks.filter((t) => t.status !== 'done');
    const workloadMins = openTasks.reduce((n, t) => n + (t.estimateMins || 0), 0);
    const overdue = openTasks.filter((t) => t.deadline && Date.parse(t.deadline) < Date.now()).length;
    const cats: Record<string, number> = {};
    openTasks.forEach((t) => {
      const c = t.category || 'Uncategorized';
      cats[c] = (cats[c] || 0) + 1;
    });
    const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const bestHabit = habits.reduce((mx, h) => Math.max(mx, habitStreak(h.history)), 0);
    return {
      total,
      done,
      rate: total ? Math.round((done / total) * 100) : 0,
      workloadH: Math.round((workloadMins / 60) * 10) / 10,
      overdue,
      catList,
      maxCat: Math.max(1, ...catList.map((c) => c[1])),
      bestHabit,
    };
  }, [tasks, habits]);

  const ask = async () => {
    setLoading(true);
    try {
      const prompt = `My productivity stats: ${m.rate}% completion rate (${m.done}/${m.total} tasks done), ${
        m.total - m.done
      } open tasks worth ~${m.workloadH}h, ${m.overdue} overdue, top categories: ${
        m.catList.map(([c, n]) => `${c} (${n})`).join(', ') || 'none'
      }, completion streak ${streak} days, best habit streak ${m.bestHabit} days. In 3-4 short, warm sentences, tell me what stands out about how I work and ONE concrete suggestion to improve. No preamble.`;
      setInsight(await generateText(prompt));
    } catch (e: any) {
      setInsight(e?.message || 'Could not generate an insight right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[88vh] w-full max-w-xl animate-fade-up overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
              <Chart className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-semibold text-ink-900">Insights</h3>
          </div>
          <div className="flex items-center gap-2">
            {onRetro && (
              <button onClick={onRetro} className="btn-ghost !py-1.5 !text-xs">
                Weekly review
              </button>
            )}
            <button onClick={onClose} className="btn-ghost !px-2.5 !py-1.5">
              <X />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <KPI label="Completion" value={`${m.rate}%`} sub={`${m.done}/${m.total} done`} tint="mint" />
          <KPI label="Open workload" value={`${m.workloadH}h`} sub={`${m.total - m.done} tasks`} tint="sky" />
          <KPI label="Day streak" value={`${streak}`} sub={m.overdue ? `${m.overdue} overdue` : 'on track'} tint="butter" />
        </div>

        <div className="mt-5">
          <p className="label mb-2 text-ink-600">Open work by category</p>
          {m.catList.length === 0 ? (
            <p className="text-xs text-ink-500">No open tasks to analyze yet.</p>
          ) : (
            <ul className="space-y-2">
              {m.catList.map(([c, n], i) => (
                <li key={c} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-ink-700">{c}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-900/[0.06]">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                      style={{ width: `${(n / m.maxCat) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-ink-500">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {m.bestHabit > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs text-ink-700">
              <Flame className="h-3.5 w-3.5 text-signal-red" /> Best habit streak: {m.bestHabit} days
            </span>
          )}
          {calibration && calibration.samples >= 1 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs text-ink-700"
              title="Learned from your focus sessions"
            >
              <Chart className="h-3.5 w-3.5 text-ink-700" /> You take ~{calibration.factor}× your estimates
              <span className="text-ink-400">({calibration.samples})</span>
            </span>
          )}
        </div>

        <div className="mt-5 border-t border-ink-900/[0.06] pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="label text-ink-600">What Clutch notices</p>
            {hasApiKey() && (
              <button onClick={ask} disabled={loading} className="btn-primary !py-1.5 !text-xs">
                {loading && <Sparkle className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'Analyzing…' : insight ? 'Refresh' : 'Generate insight'}
              </button>
            )}
          </div>
          {insight ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{insight}</p>
          ) : (
            <p className="mt-2 text-xs text-ink-500">
              {hasApiKey()
                ? 'Get a personalized, AI-written read on how you work.'
                : 'Add a Gemini API key to get an AI-written read on how you work.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
