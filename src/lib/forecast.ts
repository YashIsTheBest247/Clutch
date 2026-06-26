import type { Task, UserProfile } from '../types';
import { workingMinutesBetween } from './scheduler';

// ---------------------------------------------------------------------------
// "Will I make it?" — an honest, data-driven on-time probability per task.
//
// It is capacity-based, not vibes: for each deadline (earliest first) we add up
// the focused minutes still required for THAT task plus everything due before
// it, then compare against the working minutes actually left before the
// deadline. The ratio is squashed through a logistic curve into a probability,
// and padded by the user's learned estimate calibration (they usually run over).
// ---------------------------------------------------------------------------

/** Focused minutes a task still needs (respects checked-off subtasks + logged time). */
export function remainingMins(task: Task): number {
  if (task.status === 'done') return 0;
  if (task.subtasks.length) {
    const left = task.subtasks.filter((s) => !s.done).reduce((n, s) => n + (s.estimateMins || 0), 0);
    return Math.max(0, left);
  }
  return Math.max(0, (task.estimateMins || 45) - (task.actualMins || 0));
}

/** Squash a (available / needed) ratio into a 0–1 on-time probability. */
function winProbability(ratio: number): number {
  if (!isFinite(ratio)) return 0.97;
  const p = 1 / (1 + Math.exp(-3.5 * (ratio - 0.8)));
  return Math.max(0.03, Math.min(0.98, p));
}

export interface TaskForecast {
  taskId: string;
  /** 0–1 probability of finishing before the deadline. */
  p: number;
  /** Working minutes left before the deadline. */
  availableMins: number;
  /** Cumulative focused minutes needed by this deadline (this task + earlier ones). */
  neededMins: number;
  overdue: boolean;
}

export interface Forecast {
  byId: Record<string, TaskForecast>;
  /** Tasks with a deadline we're scoring. */
  total: number;
  /** Expected number finished on time (sum of probabilities, rounded). */
  expected: number;
  /** Count with p ≥ 0.5. */
  onTrack: number;
  /** Count with p < 0.5. */
  atRisk: number;
  /** The single least-likely task, if any are at risk. */
  riskiestId?: string;
}

export function buildForecast(
  tasks: Task[],
  profile: UserProfile,
  calibration: { factor: number; samples: number } | undefined,
  now: Date,
): Forecast {
  // Pad estimates by the user's historical over-run, once we have signal.
  const factor = calibration && calibration.samples >= 3 ? Math.max(1, calibration.factor) : 1;

  const open = tasks
    .filter((t) => t.status !== 'done' && t.deadline)
    .sort((a, b) => Date.parse(a.deadline!) - Date.parse(b.deadline!));

  const byId: Record<string, TaskForecast> = {};
  let cum = 0;
  let expected = 0;
  let onTrack = 0;
  let riskiest: { id: string; p: number } | null = null;

  for (const t of open) {
    const deadline = Date.parse(t.deadline!);
    const overdue = deadline < now.getTime();
    cum += remainingMins(t) * factor;
    const available = workingMinutesBetween(now, new Date(deadline), profile);
    const ratio = cum <= 0 ? Infinity : available / cum;
    const p = overdue ? 0.02 : winProbability(ratio);
    byId[t.id] = { taskId: t.id, p, availableMins: available, neededMins: Math.round(cum), overdue };
    expected += p;
    if (p >= 0.5) onTrack++;
    if (!riskiest || p < riskiest.p) riskiest = { id: t.id, p };
  }

  const total = open.length;
  return {
    byId,
    total,
    expected: Math.round(expected),
    onTrack,
    atRisk: total - onTrack,
    riskiestId: riskiest && riskiest.p < 0.5 ? riskiest.id : undefined,
  };
}

/** Color + label band for a probability. */
export function forecastBand(p: number): { tone: 'green' | 'amber' | 'red'; label: string } {
  if (p >= 0.75) return { tone: 'green', label: 'On track' };
  if (p >= 0.45) return { tone: 'amber', label: 'Tight' };
  return { tone: 'red', label: 'At risk' };
}
