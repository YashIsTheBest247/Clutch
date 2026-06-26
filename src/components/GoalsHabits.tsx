import { useState } from 'react';
import type { Goal, Habit, Task } from '../types';
import { habitStreak } from '../lib/storage';
import { Check, Flame, Plus, Target, Trash } from './icons';

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState('');
  const submit = () => {
    if (!v.trim()) return;
    onAdd(v.trim());
    setV('');
  };
  return (
    <div className="flex items-center gap-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="input !py-2 !text-xs"
      />
      <button onClick={submit} disabled={!v.trim()} className="btn-primary !px-2.5 !py-2">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function GoalsHabits({
  goals,
  habits,
  tasks,
  onAddGoal,
  onDeleteGoal,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
}: {
  goals: Goal[];
  habits: Habit[];
  tasks: Task[];
  onAddGoal: (t: string) => void;
  onDeleteGoal: (id: string) => void;
  onAddHabit: (t: string) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Goals */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-ink-700" />
          <h2 className="font-display text-sm font-semibold text-ink-900">Goals</h2>
          <span className="chip ml-auto border border-ink-900/10 bg-stone-100 text-ink-600">{goals.length}</span>
        </div>

        <div className="mb-3">
          <AddRow placeholder="New goal — e.g. Finish thesis" onAdd={onAddGoal} />
        </div>

        {goals.length === 0 ? (
          <p className="text-xs text-ink-500">No goals yet. Add one, then assign tasks to it from the board.</p>
        ) : (
          <ul className="space-y-2.5">
            {goals.map((g) => {
              const linked = tasks.filter((t) => t.goalId === g.id);
              const done = linked.filter((t) => t.status === 'done').length;
              const pct = linked.length ? Math.round((done / linked.length) * 100) : 0;
              return (
                <li key={g.id} className="group rounded-2xl border border-ink-900/[0.06] bg-stone-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ink-900">{g.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] tabular-nums text-ink-500">
                        {done}/{linked.length}
                      </span>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="text-ink-400 opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10">
                    <div className="h-full rounded-full bg-ink-900 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Habits */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-ink-700" />
          <h2 className="font-display text-sm font-semibold text-ink-900">Habits</h2>
          <span className="chip ml-auto border border-ink-900/10 bg-stone-100 text-ink-600">{habits.length}</span>
        </div>

        <div className="mb-3">
          <AddRow placeholder="New habit — e.g. 30 min deep work" onAdd={onAddHabit} />
        </div>

        {habits.length === 0 ? (
          <p className="text-xs text-ink-500">No habits yet. Track a daily routine and build a streak.</p>
        ) : (
          <ul className="space-y-2">
            {habits.map((h) => {
              const doneToday = h.history.includes(today);
              const streak = habitStreak(h.history);
              return (
                <li
                  key={h.id}
                  className="group flex items-center gap-3 rounded-2xl border border-ink-900/[0.06] bg-stone-50 p-2.5"
                >
                  <button
                    onClick={() => onToggleHabit(h.id)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      doneToday
                        ? 'border-ink-900 bg-ink-900 text-paper-50'
                        : 'border-ink-900/25 text-transparent hover:border-ink-900'
                    }`}
                    title={doneToday ? 'Done today' : 'Mark done today'}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <span className={`flex-1 truncate text-xs ${doneToday ? 'text-ink-900' : 'text-ink-700'}`}>
                    {h.title}
                  </span>
                  {streak > 0 && (
                    <span className="chip bg-stone-100 text-ink-700">
                      <Flame className="h-3.5 w-3.5 text-signal-red" /> {streak}
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteHabit(h.id)}
                    className="text-ink-400 opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
