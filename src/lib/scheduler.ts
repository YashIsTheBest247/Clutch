import type { ScheduleBlock, Task, UserProfile } from '../types';
import { uid } from './storage';

const MS = 60 * 1000;

function startOfWorkday(d: Date, hour: number): Date {
  const x = new Date(d);
  x.setHours(hour, 0, 0, 0);
  return x;
}

/**
 * Greedy auto-scheduler: walks forward from `now`, packing tasks into free
 * working-hour slots, earliest-deadline-first, without colliding with existing
 * blocks. Deterministic so the agent can rely on it rather than inventing times.
 */
export function autoSchedule(
  tasks: Task[],
  profile: UserProfile,
  existing: ScheduleBlock[],
  now: Date,
): ScheduleBlock[] {
  const pending = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const da = a.deadline ? Date.parse(a.deadline) : Infinity;
      const db = b.deadline ? Date.parse(b.deadline) : Infinity;
      if (da !== db) return da - db;
      return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
    });

  const busy = [...existing].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const blocks: ScheduleBlock[] = [];
  let cursor = new Date(Math.max(now.getTime(), startOfWorkday(now, profile.dayStartHour).getTime()));

  const advanceIntoWorkHours = (c: Date): Date => {
    let x = new Date(c);
    if (x.getHours() >= profile.dayEndHour) {
      x.setDate(x.getDate() + 1);
      x = startOfWorkday(x, profile.dayStartHour);
    } else if (x.getHours() < profile.dayStartHour) {
      x = startOfWorkday(x, profile.dayStartHour);
    }
    return x;
  };

  const overlapsBusy = (s: Date, e: Date): ScheduleBlock | undefined =>
    busy.find((b) => Date.parse(b.start) < e.getTime() && Date.parse(b.end) > s.getTime());

  for (const task of pending) {
    let remaining = Math.max(25, task.estimateMins || 45);
    let guard = 0;
    while (remaining > 0 && guard++ < 60) {
      cursor = advanceIntoWorkHours(cursor);
      const dayEnd = startOfWorkday(cursor, profile.dayEndHour);
      const chunk = Math.min(remaining, 90, (dayEnd.getTime() - cursor.getTime()) / MS);
      if (chunk < 20) {
        cursor = new Date(dayEnd.getTime() + MS);
        continue;
      }
      const start = new Date(cursor);
      const end = new Date(start.getTime() + chunk * MS);
      const clash = overlapsBusy(start, end);
      if (clash) {
        cursor = new Date(Date.parse(clash.end) + MS);
        continue;
      }
      const block: ScheduleBlock = {
        id: uid('blk'),
        taskId: task.id,
        taskTitle: task.title,
        start: start.toISOString(),
        end: end.toISOString(),
        reason:
          task.deadline && Date.parse(task.deadline) < end.getTime() + 24 * 60 * MS
            ? 'Deadline is close — front-loaded.'
            : 'Fits an open focus slot.',
      };
      blocks.push(block);
      busy.push(block);
      remaining -= chunk;
      cursor = new Date(end.getTime() + 10 * MS); // small break
    }
  }
  return blocks;
}

/** RICE-ish urgency: deadline proximity dominates, weighted by priority. */
export function computeUrgency(task: Task, now: Date): number {
  const prWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  let score = (prWeight[task.priority] ?? 2) * 10;
  if (task.deadline) {
    const hoursLeft = (Date.parse(task.deadline) - now.getTime()) / (3600 * 1000);
    if (hoursLeft <= 0) score += 100;
    else if (hoursLeft < 24) score += 60;
    else if (hoursLeft < 72) score += 35;
    else if (hoursLeft < 24 * 7) score += 15;
  }
  const effortPenalty = Math.min(10, (task.estimateMins || 45) / 60);
  return Math.round(score - effortPenalty);
}

/** Working minutes available between two times, given the user's working hours. */
export function workingMinutesBetween(start: Date, end: Date, p: UserProfile): number {
  if (end <= start) return 0;
  let total = 0;
  const cur = new Date(start);
  let guard = 0;
  while (cur < end && guard++ < 90) {
    const dayStart = new Date(cur);
    dayStart.setHours(p.dayStartHour, 0, 0, 0);
    const dayEnd = new Date(cur);
    dayEnd.setHours(p.dayEndHour, 0, 0, 0);
    const segStart = new Date(Math.max(cur.getTime(), dayStart.getTime()));
    const segEnd = new Date(Math.min(end.getTime(), dayEnd.getTime()));
    if (segEnd > segStart) total += (segEnd.getTime() - segStart.getTime()) / 60000;
    cur.setDate(cur.getDate() + 1);
    cur.setHours(p.dayStartHour, 0, 0, 0);
  }
  return Math.round(total);
}

export interface RealityCheck {
  overcommitted: boolean;
  /** Minutes you're short by at the tightest point. */
  deficitMins: number;
  committedMins: number;
  availableMins: number;
  /** Human label of the deadline where the crunch is worst. */
  horizon?: string;
  /** Lowest-value tasks to cut or move to make the rest fit. */
  cut: Task[];
}

/**
 * Honest capacity math: walk deadlines earliest-first and check whether the
 * cumulative work required can actually fit in the available working hours.
 * If not, suggest the lowest-priority tasks to cut/move.
 */
export function realityCheck(tasks: Task[], p: UserProfile, now: Date): RealityCheck {
  const open = tasks
    .filter((t) => t.status !== 'done' && t.deadline)
    .sort((a, b) => Date.parse(a.deadline!) - Date.parse(b.deadline!));

  let cum = 0;
  let worst = { deficit: 0, committed: 0, available: 0, deadline: '' };
  for (const t of open) {
    cum += t.estimateMins || 45;
    const avail = workingMinutesBetween(now, new Date(t.deadline!), p);
    const deficit = cum - avail;
    if (deficit > worst.deficit) worst = { deficit, committed: cum, available: avail, deadline: t.deadline! };
  }

  const prRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const cut: Task[] = [];
  if (worst.deficit > 0 && worst.deadline) {
    const dueByHorizon = open
      .filter((t) => Date.parse(t.deadline!) <= Date.parse(worst.deadline))
      .sort((a, b) => prRank[a.priority] - prRank[b.priority] || (b.estimateMins || 0) - (a.estimateMins || 0));
    let need = worst.deficit;
    for (const t of dueByHorizon) {
      if (need <= 0) break;
      cut.push(t);
      need -= t.estimateMins || 45;
    }
  }

  return {
    overcommitted: worst.deficit > 0,
    deficitMins: Math.max(0, Math.round(worst.deficit)),
    committedMins: Math.round(worst.committed),
    availableMins: Math.round(worst.available),
    horizon: worst.deadline
      ? new Date(worst.deadline).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      : undefined,
    cut,
  };
}

/** Tasks that are overdue or at risk of slipping (deadline within the time they need). */
export function slippage(tasks: Task[], now: Date): { overdue: Task[]; atRisk: Task[] } {
  const overdue: Task[] = [];
  const atRisk: Task[] = [];
  for (const t of tasks) {
    if (t.status === 'done' || !t.deadline) continue;
    const msLeft = Date.parse(t.deadline) - now.getTime();
    if (msLeft < 0) overdue.push(t);
    else if (msLeft < (t.estimateMins || 45) * 60 * 1000 * 1.5 || msLeft < 12 * 3600 * 1000) atRisk.push(t);
  }
  return { overdue, atRisk };
}

export function formatDeadline(iso?: string): { label: string; tone: 'red' | 'amber' | 'green' | 'muted' } {
  if (!iso) return { label: 'No deadline', tone: 'muted' };
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / (3600 * 1000);
  const day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  let rel: string;
  if (diffMs < 0) rel = 'Overdue';
  else if (diffH < 1) rel = `${Math.max(1, Math.round(diffMs / 60000))}m left`;
  else if (diffH < 24) rel = `${Math.round(diffH)}h left`;
  else rel = `${Math.round(diffH / 24)}d left`;
  const tone = diffMs < 0 ? 'red' : diffH < 24 ? 'red' : diffH < 72 ? 'amber' : 'green';
  return { label: `${rel} · ${day} ${time}`, tone };
}
