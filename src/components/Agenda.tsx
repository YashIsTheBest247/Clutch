import { useState } from 'react';
import type { Commitment, ScheduleBlock, Task } from '../types';
import { downloadICS, googleCalendarUrl, scheduleToICS } from '../lib/calendar';
import { Calendar, Download, Plus, X } from './icons';

type Item =
  | { kind: 'focus'; id: string; title: string; start: string; end: string; reason: string }
  | { kind: 'fixed'; id: string; title: string; start: string; end: string };

function groupByDay(items: Item[]) {
  const map = new Map<string, Item[]>();
  for (const it of [...items].sort((a, z) => Date.parse(a.start) - Date.parse(z.start))) {
    const key = new Date(it.start).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return [...map.entries()];
}

const fmt = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function Agenda({
  blocks,
  tasks,
  commitments = [],
  onAddCommitment,
  onDeleteCommitment,
}: {
  blocks: ScheduleBlock[];
  tasks: Task[];
  commitments?: Commitment[];
  onAddCommitment?: (title: string, start: string, end: string) => void;
  onDeleteCommitment?: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [dur, setDur] = useState(60);

  const items: Item[] = [
    ...blocks.map((b) => ({ kind: 'focus' as const, id: b.id, title: b.taskTitle, start: b.start, end: b.end, reason: b.reason })),
    ...commitments.map((c) => ({ kind: 'fixed' as const, id: c.id, title: c.title, start: c.start, end: c.end })),
  ];
  const days = groupByDay(items);
  const exportICS = () => downloadICS(scheduleToICS(blocks, tasks));

  const submit = () => {
    if (!title.trim() || !start) return;
    const s = new Date(start);
    const e = new Date(s.getTime() + dur * 60000);
    onAddCommitment?.(title.trim(), s.toISOString(), e.toISOString());
    setTitle('');
    setStart('');
    setDur(60);
    setAdding(false);
  };

  return (
    <div className="panel flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <Calendar className="h-4 w-4" />
        </span>
        <h2 className="font-display text-sm font-semibold text-ink-900">Your plan</h2>
        <div className="ml-auto flex items-center gap-1.5">
          {onAddCommitment && (
            <button
              onClick={() => setAdding((a) => !a)}
              title="Add a fixed commitment"
              className="btn-ghost !px-2.5 !py-1.5 !text-[11px]"
            >
              <Plus className="h-3.5 w-3.5" /> Commitment
            </button>
          )}
          {(blocks.length > 0 || tasks.some((t) => t.deadline && t.status !== 'done')) && (
            <button onClick={exportICS} title="Export to your calendar (.ics)" className="btn-ghost !px-2.5 !py-1.5 !text-[11px]">
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-3 space-y-2 rounded-2xl border border-ink-900/10 bg-stone-50 p-2.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CS101 lecture"
            className="input !py-2 !text-xs"
          />
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="input !py-2 !text-xs"
            />
            <select value={dur} onChange={(e) => setDur(Number(e.target.value))} className="input !w-auto !py-2 !text-xs">
              <option value={30}>30m</option>
              <option value={60}>1h</option>
              <option value={90}>1.5h</option>
              <option value={120}>2h</option>
            </select>
            <button onClick={submit} disabled={!title.trim() || !start} className="btn-primary !px-2.5 !py-2">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          No focus blocks yet. Add tasks and Clutch will lay out a concrete schedule across your working hours — around
          any fixed commitments you add.
        </p>
      ) : (
        <div className="-mr-2 space-y-4 overflow-y-auto pr-2">
          {days.map(([day, list]) => (
            <div key={day}>
              <p className="sticky top-0 mb-2 bg-stone-100/95 py-0.5 label text-ink-500 backdrop-blur">{day}</p>
              <ol className="relative space-y-2 border-l border-ink-900/10 pl-4">
                {list.map((it) => (
                  <li key={it.id} className="group relative">
                    <span
                      className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ring-4 ring-stone-100 ${
                        it.kind === 'fixed' ? 'bg-signal-red' : 'bg-ink-900'
                      }`}
                    />
                    <div
                      className={`rounded-2xl px-3 py-2 transition-transform duration-200 group-hover:-translate-y-[2px] ${
                        it.kind === 'fixed'
                          ? 'border border-dashed border-signal-red/40 bg-signal-red/[0.05]'
                          : 'border border-ink-900/[0.06] bg-paper-50 shadow-soft'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-display text-xs font-semibold text-ink-900">{it.title}</p>
                        <span className="shrink-0 text-[11px] tabular-nums text-ink-500">
                          {fmt(it.start)}–{fmt(it.end)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        {it.kind === 'fixed' ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-signal-red">Fixed</span>
                        ) : (
                          <p className="text-[10px] text-ink-500">{it.reason}</p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={googleCalendarUrl(
                              it.kind === 'fixed' ? it.title : 'Focus · ' + it.title,
                              it.start,
                              it.end,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            title="Add to Google Calendar"
                            className="flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Calendar className="h-3 w-3" /> Add
                          </a>
                          {it.kind === 'fixed' && onDeleteCommitment && (
                            <button
                              onClick={() => onDeleteCommitment(it.id)}
                              title="Remove commitment"
                              className="shrink-0 text-ink-400 opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
