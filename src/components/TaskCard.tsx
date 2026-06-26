import type { Goal, Task } from '../types';
import { formatDeadline, formatDuration } from '../lib/scheduler';
import { ThemedSelect } from './ThemedSelect';
import { DeadlineEditor } from './DeadlineEditor';
import { ArrowUpRight, Briefcase, Check, Clock, Doc, Heart, Layers, Play, Wallet } from './icons';

const CAT_TINTS = [
  { bg: 'bg-mint-100', fg: 'text-mint-600' },
  { bg: 'bg-sky-100', fg: 'text-sky-600' },
  { bg: 'bg-butter-100', fg: 'text-butter-600' },
  { bg: 'bg-lilac-100', fg: 'text-lilac-600' },
];
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function catIcon(text: string) {
  const t = text.toLowerCase();
  if (/thes|essay|read|study|cours|assign|exam|lectur|paper|research|write|homework|book/.test(t)) return Doc;
  if (/bill|pay|financ|tax|rent|invoic|budget|money|bank|subscription/.test(t)) return Wallet;
  if (/interview|job|meet|call|career|present|client|email|deck|pitch/.test(t)) return Briefcase;
  if (/gym|doctor|dentist|appoint|health|medic|workout|run|yoga/.test(t)) return Heart;
  return Layers;
}

const priorityChip: Record<string, string> = {
  critical: 'bg-signal-red/15 text-signal-red',
  high: 'bg-butter-100 text-butter-700',
  medium: 'bg-sky-100 text-sky-700',
  low: 'bg-stone-100 text-ink-500',
};
const toneClass: Record<string, string> = {
  red: 'text-signal-red',
  amber: 'text-signal-amber',
  green: 'text-mint-600',
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
  onSetDeadline,
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
  onSetDeadline?: (deadline?: string) => void;
}) {
  const dl = formatDeadline(task.deadline);
  const done = task.status === 'done';
  const subDone = task.subtasks.filter((s) => s.done).length;
  const pct = task.subtasks.length ? Math.round((subDone / task.subtasks.length) * 100) : done ? 100 : 0;
  const catKey = task.category || task.title;
  const tint = CAT_TINTS[hashStr(catKey) % CAT_TINTS.length];
  const CatIcon = catIcon(catKey);

  return (
    <div className={`card lift group p-4 ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatus(done ? 'todo' : 'done')}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            done ? 'border-mint-500 bg-mint-500 text-white' : 'border-ink-900/25 hover:border-mint-500'
          }`}
          aria-label="Toggle done"
        >
          {done && <Check className="h-3 w-3 animate-pop" />}
        </button>

        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${tint.bg} ${tint.fg}`}
        >
          <CatIcon className="h-4 w-4" />
        </span>

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
            {!done && onSetDeadline ? (
              <DeadlineEditor value={task.deadline} onChange={onSetDeadline} />
            ) : (
              <span className={`inline-flex items-center gap-1 ${toneClass[dl.tone]}`}>
                <Clock className="h-3.5 w-3.5" /> {dl.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {formatDuration(task.estimateMins)}
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
                <div className="h-full rounded-full bg-mint-500 transition-all" style={{ width: `${pct}%` }} />
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
                          s.done ? 'border-mint-500 bg-mint-500 text-white' : 'border-ink-900/25'
                        }`}
                      >
                        {s.done && <Check className="h-3 w-3 animate-pop" />}
                      </span>
                      <span className={s.done ? 'text-ink-400 line-through' : 'text-ink-700'}>{s.title}</span>
                      <span className="ml-auto text-[10px] text-ink-400">{formatDuration(s.estimateMins)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!done && goals && goals.length > 0 && onAssignGoal && (
              <ThemedSelect
                title="Assign to a goal"
                value={task.goalId ?? ''}
                onChange={(v) => onAssignGoal(v || undefined)}
                options={[{ value: '', label: 'No goal' }, ...goals.map((g) => ({ value: g.id, label: g.title }))]}
              />
            )}
            {!done && onSetRecur && (
              <ThemedSelect
                title="Repeat this task"
                value={task.recur ?? ''}
                onChange={(v) => onSetRecur((v || undefined) as Task['recur'])}
                options={[
                  { value: '', label: 'One-off' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekdays', label: 'Weekdays' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
              />
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
