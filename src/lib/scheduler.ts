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
