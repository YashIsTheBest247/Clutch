import type { ScheduleBlock } from '../types';
import { Calendar } from './icons';

function groupByDay(blocks: ScheduleBlock[]) {
  const map = new Map<string, ScheduleBlock[]>();
  for (const b of [...blocks].sort((a, z) => Date.parse(a.start) - Date.parse(z.start))) {
    const key = new Date(b.start).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  return [...map.entries()];
}

const fmt = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function Agenda({ blocks }: { blocks: ScheduleBlock[] }) {
  const days = groupByDay(blocks);
  return (
    <div className="panel flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-ink-700" />
        <h2 className="font-display text-sm font-semibold text-ink-900">Your plan</h2>
        {blocks.length > 0 && (
          <span className="chip ml-auto border border-ink-900/10 bg-paper-50 text-ink-600">{blocks.length} blocks</span>
        )}
      </div>

      {blocks.length === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          No focus blocks yet. Add tasks and Clutch will lay out a concrete schedule across your working hours.
        </p>
      ) : (
        <div className="-mr-2 space-y-4 overflow-y-auto pr-2">
          {days.map(([day, items]) => (
            <div key={day}>
              <p className="sticky top-0 mb-2 bg-stone-100/95 py-0.5 label text-ink-500 backdrop-blur">{day}</p>
              <ol className="relative space-y-2 border-l border-ink-900/10 pl-4">
                {items.map((b) => (
                  <li key={b.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-ink-900 ring-4 ring-stone-100" />
                    <div className="rounded-2xl border border-ink-900/[0.06] bg-paper-50 px-3 py-2 shadow-soft">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-display text-xs font-semibold text-ink-900">{b.taskTitle}</p>
                        <span className="shrink-0 text-[11px] tabular-nums text-ink-500">
                          {fmt(b.start)}–{fmt(b.end)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-ink-500">{b.reason}</p>
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
