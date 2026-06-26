import type { Goal, Task } from '../types';
import { formatDeadline } from '../lib/scheduler';
import { ArrowUpRight, Check, Clock, Doc, Layers, Play } from './icons';

const priorityChip: Record<string, string> = {
  critical: 'bg-ink-900 text-paper-50',
  high: 'bg-stone-200 text-ink-800',
  medium: 'bg-stone-100 text-ink-600',
  low: 'bg-stone-100 text-ink-500',
};
const toneClass: Record<string, string> = {
  red: 'text-signal-red',
  amber: 'text-signal-amber',
  green: 'text-ink-500',
  muted: 'text-ink-400',
};

export function TaskCard({
  task,
  onToggleSub,
  onStatus,
  onOpenDeliverable,
  onDelete,
  onFocus,
  goals,
  onAssignGoal,
  onSetRecur,
}: {
  task: Task;
  onToggleSub: (subId: string) => void;
  onStatus: (status: Task['status']) => void;
  onOpenDeliverable: () => void;
  onDelete: () => void;
  onFocus?: () => void;
  goals?: Goal[];
  onAssignGoal?: (goalId?: string) => void;
  onSetRecur?: (recur?: Task['recur']) => void;
}) {
  const dl = formatDeadline(task.deadline);
  const done = task.status === 'done';
  const subDone = task.subtasks.filter((s) => s.done).length;
  const pct = task.subtasks.length ? Math.round((subDone / task.subtasks.length) * 100) : done ? 100 : 0;
  const critical = task.priority === 'critical' && !done;

  return (
    <div
      className={`card lift group p-4 ${done ? 'opacity-60' : ''} ${
        critical ? 'ring-1 ring-ink-900/15' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatus(done ? 'todo' : 'done')}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            done ? 'border-ink-900 bg-ink-900 text-paper-50' : 'border-ink-900/25 hover:border-ink-900'
          }`}
          aria-label="Toggle done"
        >
          {done && <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-display text-sm font-semibold tracking-tight ${
                done ? 'text-ink-400 line-through' : 'text-ink-900'
              }`}
            >
              {task.title}
            </h3>
            <span className={`chip shrink-0 ${priorityChip[task.priority]}`}>{task.priority}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span className={`inline-flex items-center gap-1 ${toneClass[dl.tone]}`}>
              <Clock className="h-3.5 w-3.5" /> {dl.label}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {task.estimateMins}m
            </span>
            {task.category && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium">{task.category}</span>
            )}
            {task.status === 'blocked' && <span className="font-semibold text-signal-red">blocked</span>}
          </div>

          {task.reasoning && <p className="mt-2 text-[11px] italic text-ink-500">“{task.reasoning}”</p>}

          {task.subtasks.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-ink-900 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-1">
                {task.subtasks.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => onToggleSub(s.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-1.5 py-1 text-left text-xs hover:bg-stone-100"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          s.done ? 'border-ink-900 bg-ink-900 text-paper-50' : 'border-ink-900/25'
                        }`}
                      >
                        {s.done && <Check className="h-3 w-3" />}
                      </span>
                      <span className={s.done ? 'text-ink-400 line-through' : 'text-ink-700'}>{s.title}</span>
                      <span className="ml-auto text-[10px] text-ink-400">{s.estimateMins}m</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!done && goals && goals.length > 0 && onAssignGoal && (
              <select
                value={task.goalId ?? ''}
                onChange={(e) => onAssignGoal(e.target.value || undefined)}
                title="Assign to a goal"
                className="rounded-full border border-ink-900/15 bg-paper-50 px-2.5 py-1.5 text-[11px] text-ink-600 outline-none focus:border-ink-900/40"
              >
                <option value="">No goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            )}
            {!done && onSetRecur && (
              <select
                value={task.recur ?? ''}
                onChange={(e) => onSetRecur((e.target.value || undefined) as Task['recur'])}
                title="Repeat this task"
                className="rounded-full border border-ink-900/15 bg-paper-50 px-2.5 py-1.5 text-[11px] text-ink-600 outline-none focus:border-ink-900/40"
              >
                <option value="">One-off</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
              </select>
            )}
            {task.deliverable && (
              <button onClick={onOpenDeliverable} className="btn-primary !py-1.5 !text-xs">
                <Doc className="h-3.5 w-3.5" /> Open {task.deliverable.kind}
              </button>
            )}
            {!done && onFocus && (
              <button onClick={onFocus} className="btn-ghost !py-1.5 !text-xs" title="Start a focus session">
                <Play className="h-3 w-3" /> Focus
              </button>
            )}
            {!done && task.status !== 'in_progress' && (
              <button onClick={() => onStatus('in_progress')} className="btn-ghost !py-1.5 !text-xs">
                Start <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="btn-ghost ml-auto !px-3 !py-1.5 !text-xs opacity-0 transition-opacity group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
